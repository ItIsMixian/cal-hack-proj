"""Local, redacted activity episodes and owner-scoped semantic memory.

The pipeline follows Marglo's observation -> episode -> context -> summary split.
No Marglo database/persona is imported. No original title or app body is retained.
"""
from contextlib import closing
from datetime import datetime, timezone
import hashlib
import json
import re
import sqlite3
import time
from urllib.parse import urlsplit

SENSITIVE_TITLE = re.compile(r'password|passcode|api.?key|access.?token|private.?key|banking|patient|medical|passport|payroll|gmail|outlook|proton.?mail|whatsapp|wechat|discord|slack|telegram|messenger|密码|密钥|银行|病历|工资|邮箱|微信', re.I)
IGNORED_APPS = {'explorer.exe','shellexperiencehost.exe','searchhost.exe','systemsettings.exe','lockapp.exe','cmd.exe','powershell.exe','pwsh.exe','windowsterminal.exe'}


def reduced_title(app, title, browser_topics=False):
    app = app.lower()
    if app in IGNORED_APPS or SENSITIVE_TITLE.search(app) or not isinstance(title,str) or len(title)>2048 or SENSITIVE_TITLE.search(title):
        return None
    if app in {'chrome.exe','msedge.exe','firefox.exe','brave.exe','vivaldi.exe'} and not browser_topics:
        return None
    title = re.sub(r'https?://[^\s<>]+', lambda m: urlsplit(m.group()).hostname or '[link]', title)
    title = re.sub(r'[A-Za-z]:[\\/][^\s|—]+|\\\\[^\s]+', '[local path]', title)
    title = re.sub(r'[\w.+-]+@[\w-]+\.[\w.-]+', '[email]', title)
    title = re.sub(r'(?<!\w)(?:\+?\d[\d ().-]{7,}\d)(?!\w)', '[number]', title)
    title = re.sub(r'[\x00-\x1f\x7f]', ' ', title)
    title = re.sub(r'\s+', ' ', title).strip()[:200]
    if len(title)<4 or title.lower() in {'codex','chatgpt','openai','new tab','新建标签页'}:
        return None
    return title


def iso(ts):
    return datetime.fromtimestamp(ts, timezone.utc).isoformat(timespec='seconds').replace('+00:00','Z')


class ActivityMemory:
    def __init__(self,path):
        self.path=path
        self.previous=None
        self.generation=0
        with closing(sqlite3.connect(path)) as db:
            db.executescript('''
CREATE TABLE IF NOT EXISTS activity_episodes (id TEXT PRIMARY KEY,app TEXT NOT NULL,title TEXT NOT NULL,start_ts REAL NOT NULL,end_ts REAL NOT NULL,seconds REAL NOT NULL);
CREATE TABLE IF NOT EXISTS activity_seen (scope TEXT NOT NULL,episode_id TEXT NOT NULL,PRIMARY KEY(scope,episode_id));
CREATE TABLE IF NOT EXISTS activity_sources (episode_id TEXT PRIMARY KEY,thread_id TEXT NOT NULL,label TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS activity_memories (id TEXT PRIMARY KEY,scope TEXT NOT NULL,text TEXT NOT NULL,evidence TEXT NOT NULL,state TEXT NOT NULL,created REAL NOT NULL,updated REAL NOT NULL);
''')
            db.commit()

    def tick(self,app,title,now,steady,max_gap=4):
        if not title:
            self.previous=None
            return
        with closing(sqlite3.connect(self.path)) as db:
            old=self.previous
            if old and old[1:3]==(app,title) and 0<steady-old[4]<=max_gap and 0<now-old[3]<=max_gap:
                db.execute('UPDATE activity_episodes SET end_ts=?,seconds=seconds+? WHERE id=?',(now,steady-old[4],old[0]))
                episode_id=old[0]
            else:
                episode_id=hashlib.sha256(f'{app}\0{title}\0{now}'.encode()).hexdigest()[:24]
                db.execute('INSERT INTO activity_episodes VALUES(?,?,?,?,?,?)',(episode_id,app,title,now,now,0))
            db.execute('DELETE FROM activity_episodes WHERE end_ts<?',(time.time()-7*86400,))
            db.execute('DELETE FROM activity_episodes WHERE id NOT IN (SELECT id FROM activity_episodes ORDER BY end_ts DESC LIMIT 2000)')
            db.execute('DELETE FROM activity_seen WHERE episode_id NOT IN (SELECT id FROM activity_episodes)')
            db.execute("DELETE FROM activity_memories WHERE state='draft' AND updated<?",(time.time()-30*86400,))
            db.commit()
        self.previous=(episode_id,app,title,now,steady)

    def snapshot(self,scope):
        with closing(sqlite3.connect(self.path)) as db:
            db.row_factory=sqlite3.Row
            rows=db.execute("SELECT * FROM activity_episodes WHERE (seconds>=2 OR app='Codex conversation') AND end_ts>=? ORDER BY end_ts DESC LIMIT 60",(time.time()-7*86400,)).fetchall()
            sources={r['episode_id']:{'threadId':r['thread_id'],'label':r['label']} for r in db.execute('SELECT * FROM activity_sources WHERE episode_id IN (SELECT id FROM activity_episodes)')}
            seen={r[0] for r in db.execute('SELECT episode_id FROM activity_seen WHERE scope=?',(scope,))}
            latest=[dict(r) for r in db.execute('SELECT * FROM activity_memories WHERE scope=? ORDER BY updated DESC LIMIT 20',(scope,))]
            stable=[dict(r) for r in db.execute("SELECT * FROM activity_memories WHERE scope=? AND state!='draft' ORDER BY updated DESC LIMIT 10",(scope,))]
            memories=sorted({r['id']:r for r in latest+stable}.values(),key=lambda r:r['updated'],reverse=True)
        episodes=[{'id':r['id'],'app':r['app'],'title':r['title'],'startAt':iso(r['start_ts']),'endAt':iso(r['end_ts']),'seconds':round(r['seconds'])} for r in reversed(rows)]
        for row in episodes:
            if row['id'] in sources: row['source']=sources[row['id']]
        for row in memories:
            row['evidence']=json.loads(row['evidence'])[:3]
            row.pop('scope',None)
        unseen=[r for r in episodes if r['id'] not in seen]
        return {'episodes':episodes,'unseen':unseen,'memories':memories,'generation':self.generation}

    def save(self,scope,episode_ids,themes,generation):
        if generation!=self.generation:
            raise ValueError('Memory changed during understanding')
        snapshot=self.snapshot(scope)
        by_id={r['id']:r for r in snapshot['episodes']}
        if not episode_ids or len(episode_ids)>80 or any(i not in by_id for i in episode_ids):
            raise ValueError('Unknown evidence')
        if not isinstance(themes,list) or len(themes)>5:
            raise ValueError('Invalid understanding')
        now=time.time()
        with closing(sqlite3.connect(self.path)) as db:
            for theme in themes:
                if set(theme)!={'text','episodeIds','evidence'} or not isinstance(theme['text'],str) or not 4<=len(theme['text'])<=400:
                    raise ValueError('Invalid memory')
                ids=theme['episodeIds']
                if not ids or len(ids)>8 or any(i not in episode_ids for i in ids):
                    raise ValueError('Invalid references')
                evidence=theme['evidence']
                if not isinstance(evidence,str) or len(evidence)<4 or not any(evidence in by_id[i]['title'] for i in ids):
                    raise ValueError('Ungrounded evidence')
                key=hashlib.sha256((scope+'\0'+theme['text'].strip()).encode()).hexdigest()[:24]
                refs=sorted([by_id[i] for i in ids],key=lambda row:evidence not in row['title'])
                # Preserve owner edits/confirmed or dismissed memories rather than overwrite them.
                db.execute('INSERT OR IGNORE INTO activity_memories VALUES(?,?,?,?,?,?,?)',(key,scope,theme['text'].strip(),json.dumps(refs,ensure_ascii=False),'draft',now,now))
            db.executemany('INSERT OR IGNORE INTO activity_seen VALUES(?,?)',[(scope,i) for i in episode_ids])
            db.execute("DELETE FROM activity_memories WHERE state='draft' AND id NOT IN (SELECT id FROM activity_memories ORDER BY updated DESC LIMIT 120)")
            db.commit()

    def revise(self,scope,key,text,state):
        if state not in {'confirmed','dismissed'} or not isinstance(text,str) or not 4<=len(text.strip())<=400:
            raise ValueError('Invalid correction')
        with closing(sqlite3.connect(self.path)) as db:
            row=db.execute('SELECT id FROM activity_memories WHERE id=? AND scope=?',(key,scope)).fetchone()
            if not row:
                raise ValueError('Not this local owner scope')
            db.execute('UPDATE activity_memories SET text=?,state=?,updated=? WHERE id=? AND scope=?',(text.strip(),state,time.time(),key,scope))
            db.commit()
        self.generation+=1

    def clear(self):
        self.previous=None
        self.generation+=1
        with closing(sqlite3.connect(self.path)) as db:
            db.executescript('DELETE FROM activity_episodes;DELETE FROM activity_seen;DELETE FROM activity_memories;DELETE FROM activity_sources;')
            db.commit()
