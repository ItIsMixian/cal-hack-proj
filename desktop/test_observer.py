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

spec = importlib.util.spec_from_file_location("observer", Path(__file__).with_name("observer.py"))
observer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(observer)
ORIGIN = "http://localhost:5173"


class FakeSampler:
    value = {"app": "Code.exe", "title": "main.ts - mirrorville-project - Visual Studio Code", "idle_seconds": 0}
    def sample(self): return self.value


class ObserverTests(unittest.TestCase):
    def test_private_directory_guard_does_not_change_mixed_user_folders(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            (folder / "unrelated.txt").write_text("private user file", encoding="utf-8")
            with self.assertRaises(ValueError): observer.secure_data_dir(folder)
            self.assertEqual((folder / "unrelated.txt").read_text(encoding="utf-8"), "private user file")
            self.assertFalse((folder / ".mirrorville-observer").exists())
            with self.assertRaises(ValueError): observer.secure_data_dir(Path.home())

    def test_known_titles_derive_meaningful_labels_without_paths_or_file_contents(self):
        context = observer.derive_context("Code.exe", "private-file.ts - mirrorville-project - Visual Studio Code")
        self.assertEqual(context, ("code editor", "Project workspace: mirrorville-project"))
        self.assertEqual(observer.derive_context("Unity.exe", "ForestTown - Opening - Unity 6"), ("Unity", "Unity project or scene: ForestTown"))
        blender = observer.derive_context("blender.exe", "Blender [D:\\private\\some-owner\\robot-arm.blend]")
        self.assertEqual(blender, ("Blender", "Blender document: robot-arm"))
        self.assertNotIn("private", str(blender))
        self.assertIsNone(observer.derive_context("Code.exe", "main.ts - PRIVATE_API_KEY - Visual Studio Code"))
        self.assertIsNone(observer.derive_context("unknown.exe", "Anything personal"))

    def test_browser_topics_are_separate_opt_in_with_sensitive_filters(self):
        title = "Robot grasping research - Google Chrome"
        self.assertIsNone(observer.derive_context("chrome.exe", title))
        self.assertEqual(observer.derive_context("chrome.exe", title, True)[1], "Possible reading or project topic: Robot grasping research")
        for title in ["Gmail inbox research - Google Chrome", "bank documentation - Google Chrome", "https://private.example/research - Google Chrome", "Research for alice@example.test - Google Chrome", "Random entertainment - Google Chrome"]:
            self.assertIsNone(observer.derive_context("chrome.exe", title, True))
        self.assertEqual(observer.derive_context("chrome.exe", "owner/robot-project: code - GitHub - Google Chrome", True)[1], "GitHub repository viewed: robot-project")

    def test_capture_starts_paused_requires_pair_and_resets_gaps_idle_unknown(self):
        with tempfile.TemporaryDirectory() as tmp:
            sampler = FakeSampler(); service = observer.ObserverService(Path(tmp), [ORIGIN], sampler=sampler)
            now = time.time()
            service.sample_once(now, 100)
            self.assertEqual(service.store.count(), 0)
            self.assertEqual(service.pair(service.code)[0], 200)
            service.enabled = True
            service.sample_once(now, 100); service.sample_once(now + 2, 102)
            self.assertEqual(service.store.count(), 1)
            service.sample_once(now + 300, 400)  # Suspended computer cannot become 5 minutes of activity.
            sampler.value = None; service.sample_once(now + 302, 402)
            sampler.value = {"app": "Code.exe", "title": "main.ts - mirrorville-project - Visual Studio Code", "idle_seconds": 121}
            service.sample_once(now + 304, 404)
            with closing(sqlite3.connect(service.store.path)) as db:
                self.assertEqual(db.execute("SELECT SUM(dwell_seconds) FROM observations").fetchone()[0], 2)
                self.assertNotIn("main.ts", str(db.execute("SELECT * FROM observations").fetchall()))
            service.disconnect()
            self.assertFalse(service.enabled); self.assertIsNone(service.previous)

    def test_ids_remain_stable_when_context_order_changes_and_count_matches_contexts(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = observer.Store(Path(tmp) / "db.sqlite")
            now = time.time()
            for _ in range(80): store.add("code editor", "Project workspace: alpha", now - 100, now - 90, 2)
            store.add("code editor", "Project workspace: beta", now - 50, now - 40, 2)
            first = {i["text"].split(".")[0]: i["id"] for i in store.package()["items"]}
            self.assertEqual(store.count(), 2)
            store.add("code editor", "Project workspace: alpha", now - 10, now, 2)
            second = {i["text"].split(".")[0]: i["id"] for i in store.package()["items"]}
            self.assertEqual(first, second)
            self.assertIn("seconds", store.package()["items"][0]["text"])

    def test_pair_rate_limit_expiry_token_rotation_and_untrusted_origins(self):
        with tempfile.TemporaryDirectory() as tmp:
            service = observer.ObserverService(Path(tmp), [ORIGIN])
            for _ in range(5): self.assertEqual(service.pair("错误代码")[0], 403)
            self.assertEqual(service.pair(service.code)[0], 429)
            service.blocked_until = 0
            old_code = service.code
            _, first = service.pair(old_code)
            self.assertTrue(service.authorized("Bearer " + first["token"]))
            self.assertFalse(service.authorized("Bearer ééé"))
            self.assertNotEqual(service.code, old_code)
            service.disconnect()
            self.assertFalse(service.authorized("Bearer " + first["token"]))
            service.code_until = 0
            self.assertEqual(service.pair(service.code)[0], 403)
            for origin in ["*", "https://*.example.test", "http://localhost:5173/", "https://user:pass@example.test"]:
                with self.assertRaises(ValueError): observer.ObserverService(Path(tmp), [origin])

    def test_http_exact_origin_host_auth_body_limits_clear_and_disconnect(self):
        with tempfile.TemporaryDirectory() as tmp:
            service = observer.ObserverService(Path(tmp), [ORIGIN])
            server = observer.ThreadingHTTPServer(("127.0.0.1", 0), observer.make_handler(service))
            thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
            def request(method, path, body=None, headers=None):
                h = {"Origin": ORIGIN, **(headers or {})}
                if isinstance(body, dict): body = json.dumps(body); h["Content-Type"] = "application/json"
                conn = http.client.HTTPConnection("127.0.0.1", server.server_port, timeout=3)
                try:
                    conn.request(method, path, body, h); response = conn.getresponse(); data = response.read()
                    return response.status, dict(response.getheaders()), json.loads(data) if data else {}
                finally: conn.close()
            try:
                status, headers, health = request("GET", "/health")
                self.assertEqual(status, 200); self.assertEqual(set(health), {"service", "version"})
                self.assertEqual(request("GET", "/health", headers={"Origin": "http://localhost:5173.evil.test"})[0], 403)
                self.assertEqual(request("GET", "/health", headers={"Host": "evil.test"})[0], 403)
                self.assertEqual(request("GET", "/status")[0], 401)
                self.assertEqual(request("POST", "/capture", {"enabled": True})[0], 401)
                self.assertEqual(request("GET", "/health?token=anything")[0], 404)
                self.assertEqual(request("POST", "/pair", "x", {"Content-Type": "text/plain"})[0], 415)
                self.assertEqual(request("POST", "/pair", "x" * 5000, {"Content-Type": "application/json"})[0], 413)
                status, _, result = request("POST", "/pair", {"code": service.code})
                self.assertEqual(status, 200)
                auth = {"Authorization": "Bearer " + result["token"]}
                self.assertFalse(request("GET", "/status", headers=auth)[2]["enabled"])
                self.assertEqual(request("POST", "/capture", {"enabled": True, "browserTopics": True}, auth)[0], 200)
                self.assertTrue(service.enabled); self.assertTrue(service.browser_topics)
                now = time.time(); service.store.add("code editor", "Project workspace: real-project", now - 2, now, 2)
                self.assertEqual(len(request("GET", "/observations", headers=auth)[2]["items"]), 1)
                self.assertEqual(request("POST", "/clear", {}, auth)[0], 200)
                self.assertFalse(service.enabled); self.assertEqual(service.store.count(), 0)
                self.assertEqual(request("POST", "/disconnect", {}, auth)[0], 200)
                self.assertEqual(request("GET", "/status", headers=auth)[0], 401)
                status, cors, _ = request("OPTIONS", "/capture", headers={"Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "authorization,content-type"})
                self.assertEqual(status, 204); self.assertEqual(cors.get("Access-Control-Allow-Origin"), ORIGIN)
                self.assertNotIn("*", cors.values())
            finally:
                server.shutdown(); server.server_close(); thread.join(timeout=2)


if __name__ == "__main__": unittest.main()
