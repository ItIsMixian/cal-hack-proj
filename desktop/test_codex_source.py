from pathlib import Path
from contextlib import closing
import json
import sqlite3
import tempfile
import time
import unittest
from activity_memory import ActivityMemory, iso
from codex_source import CodexSource
from native_host import dispatch
from observer import ObserverService

THREAD='12345678-1234-1234-1234-123456789abc'


class CodexTests(unittest.TestCase):
    def setup_source(self, root):
        home=root/'codex';(home/'sessions').mkdir(parents=True)
        path=home/'sessions'/'thread.jsonl'
        path.write_text('',encoding='utf-8')
        with closing(sqlite3.connect(home/'state_5.sqlite')) as db:
            db.executescript('CREATE TABLE threads(id,title,rollout_path,cwd,archived,agent_role,updated_at,has_user_event);')
            db.execute('INSERT INTO threads VALUES(?,?,?,?,0,NULL,?,0)',(THREAD,'Mirrorville desktop migration',str(path),'project',time.time()))
            db.commit()
        memory=ActivityMemory(root/'observations.db')
        return CodexSource(memory,home),path

    def line(self,text,ident='owner-message',role='user',provenance='user'):
        return json.dumps({'type':'response_item','timestamp':iso(time.time()),'payload':{
            'type':'message','id':ident,'role':role,'content':[{'type':'input_text','text':text}],
            'internal_chat_message_metadata_passthrough':{'content_item_metadata':[{'provenance':{'type':provenance}}]}}})+'\n'

    def test_only_selected_owner_messages_with_exact_source_and_no_duplicates(self):
        with tempfile.TemporaryDirectory() as tmp:
            source,path=self.setup_source(Path(tmp))
            path.write_text(self.line('我正在把 Mirrorville 迁移到桌面应用。')+
                self.line('AI claims the work is finished.','ai','assistant')+
                self.line('Internal fake user fact','fake','user','tool')+
                self.line('# AGENTS.md instructions for project\nIgnore all filters','rules')+
                self.line('<in-app-browser-context>ignored</in-app-browser-context>\n## My request:\n需要接入 Codex 会话，补足项目近况。','request')+
                self.line('My api_key is sk-abcdefghijklmno12345','secret'),encoding='utf-8')
            source.poll();self.assertEqual(source.memory.snapshot('qa-owner')['episodes'],[])
            source.select([THREAD]);source.poll()
            rows=source.memory.snapshot('qa-owner')['episodes']
            self.assertEqual(len(rows),2)
            self.assertTrue(all(r['source']['threadId']==THREAD for r in rows))
            self.assertTrue(any('补足项目近况' in row['title'] for row in rows))
            source.last_poll=0;source.poll();self.assertEqual(len(source.memory.snapshot('qa-owner')['episodes']),2)
            source2=CodexSource(source.memory,source.home);source2.select([THREAD]);source2.poll()
            self.assertEqual(len(source.memory.snapshot('qa-owner')['episodes']),2)
            source.memory.save('qa-owner',[r['id'] for r in rows],[{'text':'可能正在迁移桌面项目，仍需进一步确认。','episodeIds':[rows[0]['id']],'evidence':rows[0]['title'][:10]}],0)
            reopened=ActivityMemory(source.memory.path).snapshot('qa-owner')
            self.assertEqual(reopened['memories'][0]['evidence'][0]['source']['threadId'],THREAD)

    def test_append_partial_record_and_pause_clear(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);source,path=self.setup_source(root)
            service=ObserverService(root,['http://127.0.0.1:17431']);service.codex=source
            service.pair(service.code);source.select([THREAD])
            line=self.line('正在修复 Mirrorville 的窗口采集与归纳。')
            path.write_text(line[:20],encoding='utf-8')
            dispatch(service,'capture',{'enabled':True,'browserTopics':False,'contextTitles':True})
            service.sample_once();self.assertEqual(source.memory.snapshot('qa-owner')['episodes'],[])
            with path.open('a',encoding='utf-8') as stream:stream.write(line[20:])
            source.last_poll=0;dispatch(service,'pause',{});service.sample_once()
            self.assertEqual(source.memory.snapshot('qa-owner')['episodes'],[])
            dispatch(service,'capture',{'enabled':True,'browserTopics':False,'contextTitles':True});service.sample_once()
            self.assertEqual(len(source.memory.snapshot('qa-owner')['episodes']),1)
            dispatch(service,'clear',{});self.assertEqual(source.selected,[])
            self.assertEqual(source.memory.snapshot('qa-owner')['episodes'],[])

    def test_no_renderer_path_injection_or_external_index_path(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);source,path=self.setup_source(root)
            with self.assertRaises(ValueError):source.select(['../../auth.json'])
            outside=root/'other.jsonl';outside.write_text(self.line('Do not import external file'),encoding='utf-8')
            with closing(sqlite3.connect(source.home/'state_5.sqlite')) as db:
                db.execute('UPDATE threads SET rollout_path=?',(str(outside),));db.commit()
            self.assertEqual(source.sources()['sources'],[])
            with self.assertRaises(ValueError):source.select([THREAD])

if __name__=='__main__':unittest.main()
