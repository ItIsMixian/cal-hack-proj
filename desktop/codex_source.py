"""Read selected local Codex rollouts. Only human input_text becomes evidence.

No auth/config files, model responses, tool output or other applications are read.
Selection is held in memory and resets on app restart/clear. No model calls here.
"""
from contextlib import closing
from datetime import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import sqlite3
import time

from activity_memory import reduced_title, SENSITIVE_TITLE

ID = re.compile(r'^[a-f0-9-]{36}$')
INTERNAL = re.compile(r'<(?:send_user_message_question_reply|environment_context|permissions instructions|collaboration_mode|INSTRUCTIONS)|^# AGENTS\.md|^<turn_aborted>|^You are ', re.I)


def owner_text(payload):
    if not isinstance(payload,dict) or payload.get('type') != 'message' or payload.get('role') != 'user':
        return ''
    metadata = payload.get('internal_chat_message_metadata_passthrough', {})
    if not isinstance(metadata,dict): return ''
    # Imported/tool-generated messages without explicit human provenance are excluded.
    items = payload.get('content', [])
    provenance = metadata.get('content_item_metadata', [])
    if not isinstance(items,list) or not isinstance(provenance,list): return ''
    texts = []
    for i, item in enumerate(items):
        if not isinstance(item, dict) or item.get('type') != 'input_text':
            continue
        if provenance and (i >= len(provenance) or not isinstance(provenance[i],dict) or not isinstance(provenance[i].get('provenance'),dict) or provenance[i]['provenance'].get('type') != 'user'):
            continue
        text = item.get('text', '')
        if not isinstance(text, str) or INTERNAL.search(text):
            continue
        # App-added file/browser context is not the human's request.
        if '## My request:' in text:
            text = text.split('## My request:', 1)[1]
        elif '<in-app-browser-context' in text or '# Files mentioned by the user:' in text:
            continue
        text = re.sub(r'```[\s\S]*?```', ' [code omitted] ', text)
        text = re.sub(r'<image\b[\s\S]*?</image>', '', text, flags=re.I)
        texts.append(text.strip())
    return '\n'.join(texts).strip()


class CodexSource:
    def __init__(self, memory, home=None):
        self.memory = memory
        self.home = Path(home or os.environ.get('CODEX_HOME') or Path.home()/'.codex')
        self.selected = []
        self.offsets = {}
        self.last_poll = 0
        self.next_source = 0
        self.state = 'not_selected'
        self.auto_recent = False

    def _rows(self):
        db = self.home/'state_5.sqlite'
        if not db.is_file():
            return []
        with closing(sqlite3.connect(db.as_uri()+'?mode=ro', uri=True, timeout=.3)) as conn:
            # has_user_event is unset in current desktop paginated histories, even for
            # human chats. Verify role/provenance in the rollout rather than trusting it.
            return conn.execute("SELECT id,title,rollout_path,cwd FROM threads WHERE archived=0 AND agent_role IS NULL ORDER BY updated_at DESC LIMIT 40").fetchall()

    def _path(self, raw):
        if os.name == 'nt' and raw.startswith('\\\\?\\'):
            raw = raw[4:]
        path = Path(raw).resolve()
        # Do not follow a modified index outside Codex's session directory.
        return path if path.is_relative_to((self.home/'sessions').resolve()) else None

    def sources(self):
        result = []
        try:
            for thread_id, title, raw, cwd in self._rows():
                path = self._path(raw)
                label = reduced_title('codex conversation', title, True)
                if ID.fullmatch(thread_id) and label and path and path.is_file():
                    result.append({'id':thread_id, 'label':label, 'selected':thread_id in self.selected})
            return {'sources':result, 'state':self.state}
        except (OSError, sqlite3.Error):
            return {'sources':[], 'state':'unavailable'}

    def select(self, ids):
        allowed = {row['id'] for row in self.sources()['sources']}
        if not isinstance(ids, list) or len(ids)>10 or any(not isinstance(i,str) or i not in allowed for i in ids) or len(set(ids))!=len(ids):
            raise ValueError('Choose known local Codex conversations')
        self.selected = list(ids)
        self.next_source = 0
        self.last_poll = 0
        self.state = 'waiting' if ids else 'not_selected'

    def poll(self):
        if self.auto_recent:
            self.selected=[r['id'] for r in self.sources()['sources'][:10]]
        if not self.selected or time.monotonic()-self.last_poll<10:
            return
        self.last_poll = time.monotonic()
        rows = {r[0]:r for r in self._rows()}
        batch=(self.selected+self.selected)[self.next_source:self.next_source+min(2,len(self.selected))]
        self.next_source=(self.next_source+len(batch))%len(self.selected)
        for thread_id in batch:
            row = rows.get(thread_id)
            path = self._path(row[2]) if row else None
            if not path or not path.is_file():
                continue
            size = path.stat().st_size
            previous = self.offsets.get(thread_id)
            offset = previous if previous is not None and previous<=size else max(0,size-64_000_000)
            with path.open('rb') as stream:
                stream.seek(offset)
                if previous is None and offset:
                    stream.readline()  # Skip a partial record at the bounded tail boundary.
                lines = []
                for _ in range(12000):
                    start = stream.tell()
                    line = stream.readline(1_000_001)
                    if not line:
                        break
                    if len(line)>1_000_000:
                        while line and not line.endswith(b'\n'):
                            line=stream.readline(1_000_001)
                        continue
                    if not line.endswith(b'\n'):
                        stream.seek(start)
                        break  # A concurrently written record is retried next poll.
                    if len(line)<=1_000_000:
                        lines.append(line)
                end = stream.tell()
            records = []
            for line in lines:
                try:
                    value=json.loads(line)
                    if value.get('type')!='response_item':
                        continue
                    payload=value.get('payload',{})
                    text=owner_text(payload)
                    stamp=datetime.fromisoformat(value['timestamp'].replace('Z','+00:00')).timestamp()
                    if not text or not time.time()-7*86400<=stamp<=time.time()+300:
                        continue
                    if SENSITIVE_TITLE.search(text) or re.search(r'\b(?:sk-|ghp_|github_pat_)[A-Za-z0-9_-]{12,}|-----BEGIN .*PRIVATE KEY',text):
                        continue
                    key=payload.get('id') or hashlib.sha256(line).hexdigest()
                    # At most 800 characters per owner message, in independently cited excerpts.
                    for index in range(0,min(len(text),800),200):
                        excerpt=reduced_title('codex conversation',text[index:index+200],True)
                        if excerpt:
                            ident=hashlib.sha256(f'codex:{thread_id}:{key}:{index}'.encode()).hexdigest()[:24]
                            records.append((ident,'Codex conversation',excerpt,stamp,stamp,1))
                except (ValueError, TypeError, KeyError):
                    continue
            with closing(sqlite3.connect(self.memory.path)) as db:
                db.executemany('INSERT OR IGNORE INTO activity_episodes VALUES(?,?,?,?,?,?)',records[-160:])
                label=reduced_title('codex conversation',row[1],True) or 'Selected Codex conversation'
                db.executemany('INSERT OR REPLACE INTO activity_sources VALUES(?,?,?)',[(r[0],thread_id,label) for r in records[-160:]])
                db.execute('DELETE FROM activity_episodes WHERE end_ts<?',(time.time()-7*86400,))
                db.execute('DELETE FROM activity_episodes WHERE id NOT IN (SELECT id FROM activity_episodes ORDER BY end_ts DESC LIMIT 2000)')
                db.execute('DELETE FROM activity_sources WHERE episode_id NOT IN (SELECT id FROM activity_episodes)')
                db.commit()
            self.offsets[thread_id]=end
        self.state='watching'

    def clear(self):
        self.auto_recent=False
        self.selected=[]
        self.offsets.clear()
        self.state='not_selected'
