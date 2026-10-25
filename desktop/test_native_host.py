from pathlib import Path
import tempfile
import unittest
import time
from native_host import dispatch
from observer import ObserverService

class Sampler:
    def sample(self):
        return {"app": "Code.exe", "title": "file.ts - synthetic-garden - Visual Studio Code", "idle_seconds": 0}

class NativeTests(unittest.TestCase):
    def test_codex_clue_contains_no_title_and_diagnostics_explain_zero_results(self):
        from observer import derive_context
        self.assertEqual(derive_context('Codex.exe', 'SECRET_CONVERSATION')[1], 'Using Codex; the project, conversation and progress are not observed')
        self.assertNotIn('SECRET_CONVERSATION', str(derive_context('ChatGPT.exe','SECRET_CONVERSATION')))
        with tempfile.TemporaryDirectory() as tmp:
            sampler=Sampler()
            service=ObserverService(Path(tmp),['http://127.0.0.1:17431'],sampler=sampler)
            service.pair(service.code)
            dispatch(service,'capture',{'enabled':True,'browserTopics':False})
            now=time.time()
            service.sample_once(now,100); service.sample_once(now+2,102)
            state=dispatch(service,'status',{})
            self.assertEqual(state['sampleState'],'eligible')
            self.assertEqual(state['observations'],1)
            self.assertIsNotNone(state['lastSampleAt'])
            self.assertIsNotNone(state['lastClueAt'])
            self.assertNotIn('title',state)
            sampler.last_state='self'; sampler.sample=lambda:None
            service.sample_once(now+4,104)
            self.assertEqual(dispatch(service,'status',{})['sampleState'],'self')
            self.assertIsNone(service.previous)

    def test_pipe_session_starts_paused_requires_explicit_consent_and_clear_pauses(self):
        with tempfile.TemporaryDirectory() as tmp:
            service=ObserverService(Path(tmp), ['http://127.0.0.1:17431'], sampler=Sampler())
            service.pair(service.code)
            self.assertFalse(dispatch(service,'status',{})['enabled'])
            with self.assertRaises(ValueError): dispatch(service,'capture',{'enabled':'true','browserTopics':False})
            dispatch(service,'capture',{'enabled':True,'browserTopics':False})
            service.sample_once(100,100); service.sample_once(102,102)
            self.assertTrue(service.enabled)
            dispatch(service,'pause',{})
            self.assertFalse(service.enabled)
            self.assertIsNone(service.previous)
            dispatch(service,'clear',{})
            self.assertEqual(dispatch(service,'observations',{})['items'],[])
            service.disconnect()

    def test_unknown_operations_never_expose_raw_sample(self):
        with tempfile.TemporaryDirectory() as tmp:
            service=ObserverService(Path(tmp),['http://127.0.0.1:17431'])
            for operation in ['sample','readFile','exec','pair']:
                with self.assertRaises(ValueError): dispatch(service,operation,{})

if __name__ == '__main__': unittest.main()
