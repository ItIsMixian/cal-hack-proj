from pathlib import Path
from datetime import datetime
from contextlib import closing
import sqlite3
import tempfile
import unittest
from activity_memory import ActivityMemory
from daily_reports import DailyReports


class ReportTests(unittest.TestCase):
    def setup_reports(self, root):
        memory=ActivityMemory(root/'memory.db');reports=DailyReports(memory)
        base=datetime.now().astimezone().replace(hour=8,minute=30,second=0,microsecond=0).timestamp()
        with closing(sqlite3.connect(memory.path)) as db:
            db.execute('INSERT INTO activity_episodes VALUES(?,?,?,?,?,?)',('a'*24,'code.exe','Mirrorville desktop migration',base,base+3600,3600))
            db.execute('INSERT INTO activity_episodes VALUES(?,?,?,?,?,?)',('b'*24,'Codex conversation','希望把 Marglo 的近况总结接入 Mirrorville。',base+4000,base+4000,1));db.commit()
        return reports,base

    def test_hour_boundaries_preserve_time_and_source_types(self):
        with tempfile.TemporaryDirectory() as tmp:
            reports,base=self.setup_reports(Path(tmp));state=reports.list('owner-test')
            self.assertEqual(len(state['days']),2)
            contexts=[reports.context('owner-test',d['date']) for d in state['days']]
            windows=[e for c in contexts for e in c['episodes'] if e['app']=='code.exe']
            self.assertEqual(sum(e['seconds'] for e in windows),3600)
            self.assertEqual({e['seconds'] for e in windows},{1800})
            self.assertEqual(sum(c['overview']['ownerMessages'] for c in contexts),1)
            self.assertEqual(len({e['id'] for c in contexts for e in c['episodes']}),3)
            self.assertTrue(all('episodes' not in d for d in state['days']))

    def test_summary_persistence_delivery_scope_clear_and_stale_result(self):
        with tempfile.TemporaryDirectory() as tmp:
            reports,base=self.setup_reports(Path(tmp));scope='owner-test'
            context=reports.context(scope,reports.list(scope)['days'][0]['date']);first=context['episodes'][0]
            body={'date':context['date'],'hash':context['hash'],'generation':0,'episodeIds':[r['id'] for r in context['episodes']],
                'themes':[{'text':'你这段时间主要在处理桌面项目的迁移，讨论如何把近况总结作为材料接入角色，让最近的工作背景能够延续。','episodeIds':[first['id']],'evidence':first['title'][:10]}]}
            reports.save(scope,body);reports.delivered(scope,body['date'],'9',body['hash'])
            reopened=DailyReports(ActivityMemory(reports.memory.path));saved=reopened.list(scope)
            self.assertEqual(len(saved['reports']),1);self.assertEqual(len(saved['deliveries']),1)
            self.assertNotIn('evidence',saved['reports'][0]);self.assertNotIn('episodes',saved['reports'][0])
            self.assertEqual(reopened.list('another-owner')['reports'],[])
            reports.memory.clear();reports.clear()
            with self.assertRaises(ValueError):reports.save(scope,body)
            self.assertEqual(reports.list(scope)['reports'],[])

    def test_no_material_no_fake_report_and_persistent_source_setting(self):
        with tempfile.TemporaryDirectory() as tmp:
            reports=DailyReports(ActivityMemory(Path(tmp)/'memory.db'))
            self.assertEqual(reports.list('owner-test')['days'],[])
            reports.set_codex(True);self.assertTrue(DailyReports(reports.memory).settings())
            reports.clear();self.assertFalse(reports.settings())

    def test_raw_window_copy_is_not_saved_as_material(self):
        with tempfile.TemporaryDirectory() as tmp:
            reports,_=self.setup_reports(Path(tmp));scope='owner-test'
            context=reports.context(scope,reports.list(scope)['days'][0]['date'])
            source=next(e for e in context['episodes'] if e['app']=='code.exe')
            body={'date':context['date'],'hash':context['hash'],'generation':0,'episodeIds':[source['id']],
                'themes':[{'text':'你在 '+source['title']+' 里持续工作，这段时间的主题围绕桌面迁移和近况理解展开，没有更多完成进展。','episodeIds':[source['id']],'evidence':source['title'][:10]}]}
            with self.assertRaises(ValueError):reports.save(scope,body)
            self.assertEqual(reports.list(scope)['reports'],[])

if __name__=='__main__':unittest.main()
