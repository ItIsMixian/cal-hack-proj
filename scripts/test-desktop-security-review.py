"""Independent adversarial bridge/fidelity checks; no native capture or user data."""
from contextlib import closing
import http.client
import importlib.util
import json
from pathlib import Path
import sqlite3
import tempfile
import threading
import time
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("desktop_observer_review", Path(__file__).resolve().parents[1] / "desktop" / "observer.py")
observer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(observer)
ORIGIN = "http://localhost:5173"


class SecurityReview(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.service = observer.ObserverService(Path(self.directory.name), [ORIGIN])
        self.server = observer.ThreadingHTTPServer(("127.0.0.1", 0), observer.make_handler(self.service))
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self):
        self.server.shutdown(); self.server.server_close(); self.thread.join()
        self.directory.cleanup()

    def call(self, method, path, *, origin=ORIGIN, host=None, token=None, value=None, extras=()):
        connection = http.client.HTTPConnection("127.0.0.1", self.server.server_port, timeout=3)
        connection.putrequest(method, path, skip_host=True)
        connection.putheader("Host", host or f"127.0.0.1:{self.server.server_port}")
        if origin is not None:
            connection.putheader("Origin", origin)
        if token:
            connection.putheader("Authorization", f"Bearer {token}")
        raw = None if value is None else json.dumps(value).encode()
        if raw is not None:
            connection.putheader("Content-Type", "application/json")
            connection.putheader("Content-Length", str(len(raw)))
        for key, text in extras:
            connection.putheader(key, text)
        connection.endheaders(raw)
        response = connection.getresponse()
        status, headers, body = response.status, dict(response.getheaders()), response.read()
        connection.close()
        return status, headers, json.loads(body) if body else {}

    def pair(self):
        status, _, value = self.call("POST", "/pair", value={"code": self.service.code})
        self.assertEqual(status, 200)
        return value["token"]

    def test_cross_site_null_missing_origin_and_rebinding_host_are_denied_without_cors(self):
        for origin in [None, "null", "https://evil.test", "http://localhost:5173.evil.test"]:
            status, headers, _ = self.call("GET", "/health", origin=origin)
            self.assertEqual(status, 403)
            self.assertNotIn("Access-Control-Allow-Origin", headers)
        for host in ["evil.test", f"localhost:{self.server.server_port}", f"127.0.0.1:{self.server.server_port}.evil.test"]:
            self.assertEqual(self.call("GET", "/health", host=host)[0], 403)
        self.assertEqual(self.call("GET", "/health", extras=[("Origin", ORIGIN)])[0], 403)
        self.assertEqual(self.call("GET", "/health", extras=[("Host", f"127.0.0.1:{self.server.server_port}")])[0], 403)

    def test_preflight_does_not_grant_arbitrary_headers_or_methods(self):
        status, headers, _ = self.call("OPTIONS", "/capture", extras=[("Access-Control-Request-Method", "POST"), ("Access-Control-Request-Headers", "authorization,content-type")])
        self.assertEqual(status, 204)
        self.assertEqual(headers.get("Access-Control-Allow-Origin"), ORIGIN)
        self.assertEqual(self.call("OPTIONS", "/capture", extras=[("Access-Control-Request-Method", "DELETE")])[0], 403)
        self.assertEqual(self.call("OPTIONS", "/capture", extras=[("Access-Control-Request-Method", "POST"), ("Access-Control-Request-Headers", "x-evil")])[0], 403)

    def test_pairing_is_paused_consumed_rotatable_and_rate_limited(self):
        original = self.service.code
        token = self.pair()
        self.assertFalse(self.service.enabled)
        self.assertEqual(self.call("POST", "/pair", value={"code": original})[0], 403)
        self.assertEqual(self.call("POST", "/capture", token=token, value={"enabled": True})[0], 200)
        self.assertEqual(self.call("POST", "/disconnect", token=token, value={})[0], 200)
        self.assertFalse(self.service.enabled)
        self.assertEqual(self.call("GET", "/observations", token=token)[0], 401)
        for _ in range(5):
            self.call("POST", "/pair", value={"code": "wrong-code"})
        self.assertEqual(self.call("POST", "/pair", value={"code": self.service.code})[0], 429)

    def test_no_token_query_auth_duplicate_auth_or_non_json_mutation(self):
        token = self.pair()
        self.assertEqual(self.call("GET", "/observations")[0], 401)
        self.assertEqual(self.call("GET", f"/observations?token={token}")[0], 404)
        self.assertEqual(self.call("GET", "/observations", token=token, extras=[("Authorization", f"Bearer {token}")])[0], 401)
        self.assertEqual(self.call("POST", "/capture", token=token, value={"enabled": True}, extras=[("Content-Type", "text/plain")])[0], 415)
        self.assertFalse(self.service.enabled)
        self.service.token_until = time.monotonic() - 1
        self.assertEqual(self.call("GET", "/status", token=token)[0], 401)
        self.assertFalse(self.service.enabled)


class FidelityReview(unittest.TestCase):
    def test_acl_guard_rejects_broad_and_mixed_user_folders_before_permission_commands(self):
        with patch.object(observer.subprocess, "run") as command:
            for folder in [Path.cwd(), Path.home(), Path(Path.cwd().anchor)]:
                with self.assertRaises(ValueError): observer.secure_data_dir(folder)
            with tempfile.TemporaryDirectory() as folder:
                private = Path(folder) / "personal-notes.txt"
                private.write_text("Keep this user file unchanged", encoding="utf-8")
                with self.assertRaises(ValueError): observer.secure_data_dir(Path(folder))
                self.assertEqual(private.read_text(encoding="utf-8"), "Keep this user file unchanged")
            command.assert_not_called()

    def test_null_locked_desktop_fails_closed_and_handles_are_closed(self):
        sampler = object.__new__(observer.NativeSampler)
        class User32:
            name = "Winlogon"
            closed = []
            def OpenInputDesktop(self, *_): return 42
            def GetUserObjectInformationW(self, _desktop, _index, name, *_): name.value = self.name; return 1
            def CloseDesktop(self, handle): self.closed.append(handle)
        user32 = User32(); sampler.user32 = user32
        self.assertFalse(sampler.unlocked())
        self.assertEqual(user32.closed, [42])
        user32.name = "Default"
        self.assertTrue(sampler.unlocked())
        user32.OpenInputDesktop = lambda *_: 0
        self.assertFalse(sampler.unlocked())

    def test_pause_idle_and_sleep_gaps_do_not_become_work_and_native_title_is_not_stored(self):
        class Sampler:
            value = {"app": "code.exe", "title": "private-file.ts - SafeProject - Visual Studio Code", "idle_seconds": 0}
            def sample(self): return self.value
        with tempfile.TemporaryDirectory() as folder:
            sampler = Sampler()
            service = observer.ObserverService(Path(folder), [ORIGIN], sampler=sampler)
            now = time.time(); steady = time.monotonic()
            service.sample_once(now, steady)
            self.assertEqual(service.store.count(), 0)
            service.pair(service.code); service.enabled = True
            service.sample_once(now, steady); service.sample_once(now + 2, steady + 2)
            sampler.value = None
            service.sample_once(now + 4, steady + 4)
            sampler.value = {"app": "code.exe", "title": "private-file.ts - SafeProject - Visual Studio Code", "idle_seconds": 0}
            service.sample_once(now + 6, steady + 6)
            service.sample_once(now + 100, steady + 100)
            with closing(sqlite3.connect(service.store.path)) as db:
                self.assertEqual(db.execute("SELECT SUM(dwell_seconds) FROM observations").fetchone()[0], 2)
                text = str(db.execute("SELECT app,label FROM observations").fetchall())
            self.assertNotIn("private-file.ts", text)
            self.assertNotIn("Visual Studio Code", text)
            self.assertIn("SafeProject", text)
            packed = json.dumps(service.store.package())
            self.assertIn("tentative", packed)
            self.assertIn("not proof", packed)


if __name__ == "__main__":
    unittest.main()
