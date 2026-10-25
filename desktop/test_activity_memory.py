from pathlib import Path
import tempfile
import time
import unittest
from activity_memory import ActivityMemory,reduced_title
from observer import ObserverService
from native_host import dispatch

class ActivityTests(unittest.TestCase):
    def test_title_reduction_and_consent_do_not_read_app_bodies(self):
        self.assertIsNone(reduced_title('msedge.exe','Robot paper - arxiv',False))
        self.assertIsNone(reduced_title('chatgpt.exe','Banking password'))
        self.assertIsNone(reduced_title('powershell.exe','private command'))
        title=reduced_title('msedge.exe','Research https://arxiv.org/abs/123?token=secret alice@example.test',True)
        self.assertNotIn('token',title);self.assertNotIn('alice@',title);self.assertIn('arxiv.org',title)
        self.assertNotIn('Alice',reduced_title('code.exe',r'D:\Users\Alice\project notes - VS Code'))

    def memory(self,folder):
        memory=ActivityMemory(Path(folder)/'memory.db');now=time.time()
        memory.tick('code.exe','Mirrorville activity memory - VS Code',now-8,100)
        memory.tick('code.exe','Mirrorville activity memory - VS Code',now-6,102)
        return memory,now

    def test_episodes_survive_restart_and_owner_corrections_are_scoped(self):
        with tempfile.TemporaryDirectory() as folder:
            memory,now=self.memory(folder)
            snap=memory.snapshot('owner-one');self.assertEqual(len(snap['unseen']),1)
            episode=snap['unseen'][0]
            theme={'text':'可能正在为 Mirrorville 开发活动记忆。','episodeIds':[episode['id']],'evidence':'Mirrorville activity memory'}
            memory.save('owner-one',[episode['id']],[theme],snap['generation'])
            note=memory.snapshot('owner-one')['memories'][0]
            memory.revise('owner-one',note['id'],'我正在把活动片段和近况归纳接进 Mirrorville。','confirmed')
            reopened=ActivityMemory(memory.path)
            self.assertEqual(reopened.snapshot('owner-one')['memories'][0]['state'],'confirmed')
            self.assertEqual(reopened.snapshot('owner-two')['memories'],[])
            with self.assertRaises(ValueError): reopened.revise('owner-two',note['id'],'forged text','confirmed')
            self.assertEqual(reopened.snapshot('owner-one')['unseen'],[])
            for i in range(35):
                reopened.save('owner-one',[episode['id']],[{**theme,'text':f'A newer tentative activity draft {i}'}],reopened.generation)
            self.assertTrue(any(row['state']=='confirmed' for row in reopened.snapshot('owner-one')['memories']))

    def test_hallucinated_references_and_clear_during_model_call_are_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            memory,_=self.memory(folder);snap=memory.snapshot('owner-one');episode=snap['unseen'][0]
            theme={'text':'Unsupported fabricated context','episodeIds':[episode['id']],'evidence':'not in the title'}
            with self.assertRaises(ValueError): memory.save('owner-one',[episode['id']],[theme],snap['generation'])
            self.assertEqual(memory.snapshot('owner-one')['memories'],[])
            self.assertEqual(len(memory.snapshot('owner-one')['unseen']),1)
            memory.clear()
            with self.assertRaises(ValueError):memory.save('owner-one',[episode['id']],[],snap['generation'])

    def test_idle_or_long_gaps_do_not_count_as_work_and_native_mode_is_opt_in(self):
        class Sampler:
            value={'app':'ChatGPT.exe','title':'Mirrorville desktop migration - Codex','idle_seconds':0}
            def sample(self):return self.value
        with tempfile.TemporaryDirectory() as folder:
            sampler=Sampler();service=ObserverService(Path(folder),['http://127.0.0.1:17431'],sampler=sampler)
            service.pair(service.code);now=time.time()
            dispatch(service,'capture',{'enabled':True,'browserTopics':False})
            service.sample_once(now-8,100);service.sample_once(now-6,102)
            self.assertEqual(service.memory.snapshot('owner-one')['episodes'],[])
            dispatch(service,'capture',{'enabled':True,'browserTopics':False,'contextTitles':True})
            service.sample_once(now-4,104);service.sample_once(now-2,106)
            snap=service.memory.snapshot('owner-one');self.assertEqual(snap['episodes'][0]['seconds'],2)
            service.sample_once(now+20,128)
            self.assertEqual(service.memory.snapshot('owner-one')['episodes'][0]['seconds'],2)
            sampler.value={**sampler.value,'idle_seconds':121}
            service.sample_once(now+22,130)
            self.assertIsNone(service.memory.previous)

if __name__=='__main__':unittest.main()
