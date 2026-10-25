import importlib.util
from contextlib import closing
from pathlib import Path
import hashlib
import json
import sqlite3
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).with_name("export-marglo-package.py")
spec = importlib.util.spec_from_file_location("marglo_export", SCRIPT)
export = importlib.util.module_from_spec(spec)
spec.loader.exec_module(export)
NOW = 1_792_864_800.0


class ExportTests(unittest.TestCase):
    def fixture(self, folder):
        db = folder / "store.db"
        with closing(sqlite3.connect(db, isolation_level=None)) as conn:
            conn.execute("CREATE TABLE episodes (start_ts REAL, end_ts REAL, app TEXT, title TEXT, dwell_ms INTEGER)")
            conn.executemany("INSERT INTO episodes VALUES (?,?,?,?,?)", [
                (NOW - 600, NOW - 300, "Code.exe", "PRIVATE_PROJECT_TITLE", 300_000),
                (NOW - 300, NOW, "Code.exe", "https://private.example/other-person", 300_000),
                (NOW - 300, NOW, "PRIVATE_UNKNOWN_APP.exe", "PRIVATE_UNKNOWN_TITLE", 300_000),
                (NOW - 30 * 86400, NOW - 30 * 86400 + 500, "Unity.exe", "OLD_TITLE", 500_000),
                (NOW + 100, NOW + 200, "Unity.exe", "FUTURE_TITLE", 100_000),
                (NOW - 100, NOW - 90, "Blender.exe", "INVALID_DWELL", -1),
            ])
            conn.execute("CREATE TABLE intents (rationale TEXT)")
            conn.execute("INSERT INTO intents VALUES ('PRIVATE_MEMOIR_DO_NOT_READ')")
        return db

    def test_aggregates_only_allowlisted_metadata_and_preserves_store(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp); db = self.fixture(folder)
            before = hashlib.sha256(db.read_bytes()).hexdigest()
            pack = export.build_package(folder, 7, [], NOW)
            encoded = json.dumps(pack)
            self.assertEqual(len(pack["items"]), 1)
            self.assertIn("10 minutes", pack["items"][0]["text"])
            self.assertEqual(pack["items"][0]["status"], "tentative")
            for secret in ["PRIVATE", "private.example", "Code.exe", "OLD_TITLE", "FUTURE_TITLE", "MEMOIR"]:
                self.assertNotIn(secret, encoded)
            self.assertEqual(before, hashlib.sha256(db.read_bytes()).hexdigest())

    def test_context_is_opt_in_allowlisted_undated_and_redacted(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp); self.fixture(folder)
            (folder / "context.md").write_text("## 当前在做的事\n- Building a small robot; ask person@example.test\n## 这周打算\n- Prepare a robot demo # ?\n## 对静笺的常驻约定\nPRIVATE_AGENT_INSTRUCTION\n## App semantics\nPRIVATE_TITLE\n", encoding="utf-8")
            self.assertEqual(len(export.build_package(folder, 7, [], NOW)["items"]), 1)
            items = export.build_package(folder, 7, ["current_projects", "this_week"], NOW)["items"][1:]
            self.assertEqual(len(items), 2)
            self.assertTrue(all(i["startAt"] is None and i["endAt"] is None and i["status"] == "tentative" for i in items))
            text = json.dumps(items)
            self.assertIn("robot", text)
            self.assertIn("# ?", text)
            self.assertNotIn("person@example.test", text)
            self.assertNotIn("PRIVATE", text)

    def test_time_clipping_and_dwell_capping(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp); db = self.fixture(folder)
            with closing(sqlite3.connect(db, isolation_level=None)) as conn:
                conn.execute("DELETE FROM episodes")
                conn.execute("INSERT INTO episodes VALUES (?,?,?,?,?)", (NOW - 86400 - 60, NOW - 86400 + 120, "Unity.exe", "PRIVATE", 999999999))
            pack = export.build_package(folder, 1, [], NOW)
            item = pack["items"][0]
            self.assertIn("2 minutes", item["text"])
            self.assertEqual(item["startAt"], export.iso(NOW - 86400))

    def test_rejects_missing_and_unsupported_sources_and_bad_window(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            with self.assertRaises(ValueError): export.build_package(folder, 7, [], NOW)
            self.assertFalse((folder / "store.db").exists())
            with closing(sqlite3.connect(folder / "store.db", isolation_level=None)) as conn: conn.execute("CREATE TABLE unrelated (value TEXT)")
            with self.assertRaises(ValueError): export.build_package(folder, 7, [], NOW)
            with self.assertRaises(ValueError): export.build_package(None, 31, [], NOW)
            with self.assertRaises(ValueError): export.build_package(None, 7, ["marglo_instructions"], NOW)

    def test_cli_template_and_exclusive_output(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "template.json"
            first = subprocess.run([sys.executable, str(SCRIPT), "--template", "--out", str(output)], capture_output=True, text=True)
            self.assertEqual(first.returncode, 0, first.stderr)
            self.assertEqual(json.loads(output.read_text(encoding="utf-8"))["items"], [])
            before = output.read_bytes()
            second = subprocess.run([sys.executable, str(SCRIPT), "--template", "--out", str(output)], capture_output=True, text=True)
            self.assertEqual(second.returncode, 1)
            self.assertEqual(output.read_bytes(), before)


if __name__ == "__main__": unittest.main()
