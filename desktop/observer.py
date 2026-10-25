"""Mirrorville's opt-in Windows foreground observer and authenticated loopback bridge.

Only derived activity labels are stored. Native titles exist transiently in sample().
No dependency on Marglo, external packages, browser cookies, screenshots or keyboard capture.
"""
from __future__ import annotations

import argparse
from contextlib import closing
import ctypes
from ctypes import wintypes
from datetime import datetime, timezone
import hmac
import hashlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import re
import secrets
import sqlite3
import subprocess
import threading
import time
from urllib.parse import urlsplit
from activity_memory import ActivityMemory, reduced_title

SERVICE = "mirrorville-desktop"
MAX_BODY = 4096
SENSITIVE = re.compile(r"password|passcode|secret|api.?key|access.?token|private.?key|bank|banking|medical|patient|diagnos|passport|social.?security|salary|payroll|inbox|gmail|outlook|proton.?mail|yahoo.?mail|whatsapp|wechat|discord|slack|messenger|telegram|facebook|instagram|signal|密码|密钥|银行|医疗|病历|工资|邮箱|聊天|微信|支付宝|账单", re.I)
CONTACT = re.compile(r"https?://|www\.|[\w.+-]+@[\w-]+\.[\w.-]+|[A-Za-z]:[\\/]|\\\\|(?:^|\s)(?:~?/)(?:Users|home|mnt|tmp)/|(?:\+?\d[\d ().-]{7,}\d)", re.I)
BROWSERS = {"chrome.exe", "msedge.exe", "firefox.exe", "brave.exe", "vivaldi.exe"}
EDITORS = {"code.exe", "code - insiders.exe", "cursor.exe", "windsurf.exe"}
AI_TOOLS = {"codex.exe": "Codex", "chatgpt.exe": "OpenAI desktop app"}


def iso(value: float) -> str:
    return datetime.fromtimestamp(value, timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def safe_label(value: str, *, document: bool = False) -> str | None:
    value = re.sub(r"[\x00-\x1f\x7f]", " ", value).strip(" *•●—–-")
    if not 3 <= len(value) <= 100 or SENSITIVE.search(value) or CONTACT.search(value):
        return None
    if "\\" in value or "/" in value or len(value.split()) > 18:
        return None
    if document:
        value = re.sub(r"\.(?:blend|unity|tscn)$", "", value, flags=re.I)
    if not any(char.isalpha() for char in value):
        return None
    return re.sub(r"\s+", " ", value)


def derive_context(process_name: str, window_title: str, browser_topics: bool = False) -> tuple[str, str] | None:
    """Extract known workspace/document/topic shapes, never persist the original title."""
    app = process_name.lower()
    if app in AI_TOOLS:
        return "AI desktop tool", f"Using {AI_TOOLS[app]}; the project, conversation and progress are not observed"
    if len(window_title) > 2048 or SENSITIVE.search(window_title):
        return None
    if app == "blender.exe":
        # Reduce a known Blender document title to its basename locally, then discard path/title.
        document = re.search(r"(?:^|[\\/\[])([^\\/\[\]]+\.blend)(?:\s*\]|$)", window_title, re.I)
        if document:
            label = safe_label(document.group(1), document=True)
            if label:
                return "Blender", f"Blender document: {label}"
    if CONTACT.search(window_title):
        return None
    if app in EDITORS:
        parts = re.split(r"\s[-—–]\s", window_title)
        product = re.compile(r"^(?:Visual Studio Code(?: - Insiders)?|Cursor|Windsurf)(?:\s*\[.*\])?$", re.I)
        if len(parts) >= 2 and product.match(parts[-1]):
            label = safe_label(re.sub(r"\s*\[(?:Administrator|WSL[^]]*|SSH[^]]*|Dev Container[^]]*)\]\s*$", "", parts[-2]))
            if label and label.lower() not in {"welcome", "untitled", "settings", "extensions"}:
                return "code editor", f"Project workspace: {label}"
    if app == "unity.exe":
        parts = re.split(r"\s[-—–]\s", window_title)
        # Unity commonly presents 'Project - Scene - Unity ...' or 'Scene - Project - ...'.
        if len(parts) >= 2 and any("unity" in part.lower() for part in parts[1:]):
            label = safe_label(parts[0], document=True)
            if label:
                return "Unity", f"Unity project or scene: {label}"
    if app == "blender.exe":
        # Full paths in Blender titles are deliberately rejected rather than reduced blindly.
        match = re.match(r"^(?:Blender\s*[-—–]\s*|)([^\[\]]+?\.blend)(?:\s*[-—–]\s*Blender)?$", window_title, re.I)
        if match:
            label = safe_label(match.group(1), document=True)
            if label:
                return "Blender", f"Blender document: {label}"
    if app in BROWSERS and browser_topics:
        topic = re.sub(r"\s[-—–]\s(?:Google Chrome|Microsoft Edge|Mozilla Firefox|Brave|Vivaldi)(?:\s.*)?$", "", window_title, flags=re.I)
        # Only page topics associated with reading, research and project sites are eligible.
        if not re.search(r"arxiv|github|wikipedia|google scholar|documentation|docs|research|paper|论文|文档", topic, re.I):
            return None
        github = re.search(r"(?:^|[ ·])([A-Za-z0-9_-]+)/([A-Za-z0-9_.-]+)(?:[: ·]|$)", topic)
        if "github" in topic.lower() and github:
            label = safe_label(github.group(2))
            if label:
                return "web browser", f"GitHub repository viewed: {label}"
        topic = re.sub(r"\s[-—–|]\s(?:arXiv.*|Wikipedia|Google Scholar|GitHub)$", "", topic, flags=re.I)
        label = safe_label(topic)
        if label:
            return "web browser", f"Possible reading or project topic: {label}"
    return None


class NativeSampler:
    def __init__(self) -> None:
        self.last_state = "waiting"
        self.read_titles = False
        if os.name != "nt":
            raise RuntimeError("Native foreground observation requires Windows.")
        self.user32 = ctypes.WinDLL("user32", use_last_error=True)
        self.kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
        self.user32.GetForegroundWindow.restype = wintypes.HWND
        self.user32.GetWindowThreadProcessId.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.DWORD)]
        self.user32.GetWindowTextW.argtypes = [wintypes.HWND, wintypes.LPWSTR, ctypes.c_int]
        self.user32.OpenInputDesktop.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
        self.user32.OpenInputDesktop.restype = wintypes.HANDLE
        self.user32.GetUserObjectInformationW.argtypes = [wintypes.HANDLE, ctypes.c_int, wintypes.LPVOID, wintypes.DWORD, ctypes.POINTER(wintypes.DWORD)]
        self.user32.CloseDesktop.argtypes = [wintypes.HANDLE]
        self.kernel32.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
        self.kernel32.OpenProcess.restype = wintypes.HANDLE
        self.kernel32.QueryFullProcessImageNameW.argtypes = [wintypes.HANDLE, wintypes.DWORD, wintypes.LPWSTR, ctypes.POINTER(wintypes.DWORD)]
        self.kernel32.CloseHandle.argtypes = [wintypes.HANDLE]
        self.kernel32.GetTickCount.restype = wintypes.DWORD

    def unlocked(self) -> bool:
        desktop = self.user32.OpenInputDesktop(0, False, 0x0001)
        if not desktop:
            return False
        try:
            name = ctypes.create_unicode_buffer(256); required = wintypes.DWORD()
            return bool(self.user32.GetUserObjectInformationW(desktop, 2, name, ctypes.sizeof(name), ctypes.byref(required))) and name.value.lower() == "default"
        finally:
            self.user32.CloseDesktop(desktop)

    def sample(self) -> dict | None:
        self.last_state = "unavailable"
        class LASTINPUTINFO(ctypes.Structure):
            _fields_ = [("cbSize", wintypes.UINT), ("dwTime", wintypes.DWORD)]
        if not self.unlocked():
            self.last_state = "locked"
            return None
        info = LASTINPUTINFO(); info.cbSize = ctypes.sizeof(info)
        if not self.user32.GetLastInputInfo(ctypes.byref(info)):
            return None
        idle = ((int(self.kernel32.GetTickCount()) - int(info.dwTime)) & 0xFFFFFFFF) / 1000
        if idle >= 120:
            self.last_state = "idle"
            return None
        hwnd = self.user32.GetForegroundWindow()
        if not hwnd:
            return None
        pid = wintypes.DWORD()
        self.user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
        handle = self.kernel32.OpenProcess(0x1000, False, pid.value)
        if not handle:
            return None
        try:
            path = ctypes.create_unicode_buffer(32768); length = wintypes.DWORD(len(path))
            if not self.kernel32.QueryFullProcessImageNameW(handle, 0, path, ctypes.byref(length)):
                return None
            app = path.value.rsplit("\\", 1)[-1].lower()
        finally:
            self.kernel32.CloseHandle(handle)
        if app in {"mirrorville.exe", "mirrorville-portable.exe"}:
            self.last_state = "self"
            return None
        if app in AI_TOOLS and not self.read_titles:
            self.last_state = "reading"
            return {"app": app, "title": "", "idle_seconds": idle}
        if not self.read_titles and app not in EDITORS | BROWSERS | {"unity.exe", "blender.exe"}:
            self.last_state = "unsupported"
            return None
        title = ctypes.create_unicode_buffer(2049)
        if not self.user32.GetWindowTextW(hwnd, title, len(title)):
            return None
        self.last_state = "reading"
        return {"app": app, "title": title.value, "idle_seconds": idle}


class Store:
    def __init__(self, path: Path):
        self.path = path
        with closing(sqlite3.connect(path)) as db:
            db.execute("CREATE TABLE IF NOT EXISTS observations (id INTEGER PRIMARY KEY, app TEXT NOT NULL, label TEXT NOT NULL, start_ts REAL NOT NULL, end_ts REAL NOT NULL, dwell_seconds REAL NOT NULL)")
            db.commit()

    def add(self, app: str, label: str, start: float, end: float, dwell: float) -> None:
        if dwell <= 0 or end < start:
            return
        with closing(sqlite3.connect(self.path)) as db:
            db.execute("INSERT INTO observations(app,label,start_ts,end_ts,dwell_seconds) VALUES (?,?,?,?,?)", (app, label, start, end, dwell))
            db.execute("DELETE FROM observations WHERE end_ts < ?", (time.time() - 7 * 86400,))
            db.execute("DELETE FROM observations WHERE id NOT IN (SELECT id FROM observations ORDER BY id DESC LIMIT 5000)")
            db.commit()

    def clear(self) -> None:
        with closing(sqlite3.connect(self.path)) as db:
            db.execute("DELETE FROM observations"); db.commit()

    def count(self) -> int:
        with closing(sqlite3.connect(self.path)) as db:
            return min(60, db.execute("SELECT COUNT(*) FROM (SELECT app,label FROM observations WHERE end_ts >= ? GROUP BY app,label)", (time.time() - 7 * 86400,)).fetchone()[0])

    def latest(self):
        with closing(sqlite3.connect(self.path)) as db:
            value = db.execute("SELECT MAX(end_ts) FROM observations WHERE end_ts >= ?", (time.time() - 7 * 86400,)).fetchone()[0]
        return iso(value) if value is not None else None

    def package(self) -> dict:
        now = time.time()
        with closing(sqlite3.connect(self.path)) as db:
            rows = db.execute("SELECT app,label,MIN(start_ts),MAX(end_ts),SUM(dwell_seconds) FROM observations WHERE end_ts >= ? GROUP BY app,label ORDER BY MAX(end_ts) DESC LIMIT 60", (now - 7 * 86400,)).fetchall()
        return {"type": "mirrorville.marglo", "version": 1, "generatedAt": iso(now), "items": [
            {"id": "desktop_" + hashlib.sha256((app + "\0" + label).encode("utf-8")).hexdigest()[:24], "kind": "observation", "text": f"{label}. My computer observed this context in {app} for about {round(dwell)} seconds. This is an activity clue, not proof of preference, motive or completion.", "startAt": iso(start), "endAt": iso(end), "provenance": "desktop_activity", "status": "tentative"}
            for i, (app, label, start, end, dwell) in enumerate(rows)
        ]}


class ObserverService:
    def __init__(self, data_dir: Path, origins: list[str], pairing_file: Path | None = None, poll_seconds: float = 2.0, sampler=None):
        self.origins = set(origins)
        if not self.origins or any(urlsplit(origin).scheme not in {"http", "https"} or not urlsplit(origin).netloc or urlsplit(origin).path or urlsplit(origin).query or urlsplit(origin).fragment or urlsplit(origin).username for origin in origins):
            raise ValueError("Use explicit http(s) origins without paths, credentials or wildcards.")
        if any("*" in origin for origin in origins) or not 0.5 <= poll_seconds <= 10:
            raise ValueError("Wildcard origins are forbidden; poll interval must be 0.5–10 seconds.")
        data_dir.mkdir(parents=True, exist_ok=True)
        self.store = Store(data_dir / "observations.db")
        self.memory = ActivityMemory(data_dir / "observations.db")
        self.context_titles = False
        self.codex = None  # Native-only selected conversation source; absent in web companion.
        self.pairing_file = pairing_file
        self.lock = threading.RLock()
        self.enabled = False; self.browser_topics = False
        self.poll_seconds = poll_seconds; self.sampler = sampler
        self.token: str | None = None; self.token_until = 0.0
        self.code = secrets.token_hex(4); self.code_until = time.monotonic() + 900
        self.failures = 0; self.blocked_until = 0.0
        self.previous: tuple[str, str, float, float] | None = None
        self.last_state = "waiting"
        self.last_sample_at = None
        self.stopped = threading.Event()
        self.write_pairing_code()

    def write_pairing_code(self):
        if self.pairing_file:
            self.pairing_file.write_text(self.code + "\n", encoding="ascii")

    def pair(self, code: object) -> tuple[int, dict]:
        with self.lock:
            now = time.monotonic()
            if now < self.blocked_until:
                return 429, {"error": "Too many pairing attempts. Wait a minute."}
            if not isinstance(code, str) or now > self.code_until or not hmac.compare_digest(code.encode("utf-8"), self.code.encode("ascii")):
                self.failures += 1
                if self.failures >= 5:
                    self.blocked_until = now + 60; self.failures = 0
                return 403, {"error": "Invalid or expired pairing code. Restart the helper for a new code."}
            self.failures = 0; self.enabled = False; self.previous = None
            self.token = secrets.token_urlsafe(32); self.token_until = now + 12 * 3600
            # Successful pairing consumes the visible code; a second page cannot silently take over.
            self.code = secrets.token_hex(4); self.code_until = now + 900; self.write_pairing_code()
            return 200, {"token": self.token}

    def authorized(self, header: str) -> bool:
        with self.lock:
            if not self.token or time.monotonic() >= self.token_until:
                self.enabled = False; self.previous = None; self.token = None
                return False
            return hmac.compare_digest(header.encode("utf-8"), f"Bearer {self.token}".encode("ascii"))

    def sample_once(self, now: float | None = None, monotonic_now: float | None = None):
        with self.lock:
            if not self.enabled or not self.token or time.monotonic() >= self.token_until:
                self.previous = None; self.enabled = False; return
            moment = time.time() if now is None else now
            self.last_sample_at = iso(moment)
            steady = time.monotonic() if monotonic_now is None else monotonic_now
            if self.codex:
                try:
                    self.codex.poll()
                except (OSError, sqlite3.Error, ValueError):
                    self.codex.state = 'unavailable'
            sample = self.sampler.sample() if self.sampler else None
            memory_title = None
            if self.context_titles and sample and 0 <= sample.get("idle_seconds", 0) < 120:
                memory_title=reduced_title(sample['app'],sample['title'],self.browser_topics)
                self.memory.tick(sample['app'], memory_title, moment, steady, min(15,self.poll_seconds*2))
            else:
                self.memory.previous = None
            context = derive_context(sample["app"], sample["title"], self.browser_topics) if sample and 0 <= sample.get("idle_seconds", 0) < 120 else None
            if not context:
                self.last_state = "eligible" if memory_title else (("browser_off" if sample and sample["app"].lower() in BROWSERS and not self.browser_topics else "filtered") if sample else getattr(self.sampler, "last_state", "unavailable"))
                self.previous = None; return
            self.last_state = "eligible"
            app, label = context
            if self.previous:
                previous_app, previous_label, previous_time, previous_steady = self.previous
                gap = steady - previous_steady
                wall_gap = moment - previous_time
                if context == (previous_app, previous_label) and 0 < gap <= min(15, self.poll_seconds * 2) and 0 < wall_gap <= min(15, self.poll_seconds * 2):
                    self.store.add(app, label, previous_time, moment, gap)
            self.previous = (app, label, moment, steady)

    def loop(self):
        while not self.stopped.wait(self.poll_seconds):
            try:
                self.sample_once()
            except Exception:
                # Fail closed without exposing native titles or exception details.
                with self.lock:
                    self.enabled = False; self.previous = None; self.last_state = "error"

    def status(self):
        with self.lock:
            self.authorized("Bearer " + (self.token or ""))
            return {"enabled": self.enabled, "browserTopics": self.browser_topics,
                    "codexState": self.codex.state if self.codex else 'unavailable',
                    "observations": self.store.count(), "sampleState": self.last_state if self.enabled or self.last_state == "error" else "paused",
                    "contextTitles": self.context_titles,
                    "lastSampleAt": self.last_sample_at, "lastClueAt": self.store.latest()}

    def disconnect(self):
        with self.lock:
            self.enabled = False; self.previous = None; self.token = None; self.token_until = 0
            self.code = secrets.token_hex(4); self.code_until = time.monotonic() + 900; self.write_pairing_code()


def make_handler(service: ObserverService):
    class Handler(BaseHTTPRequestHandler):
        server_version = "MirrorvilleDesktop/1"

        def setup(self):
            super().setup()
            self.connection.settimeout(5)

        def log_message(self, *_):
            pass  # No request paths, tokens, native titles or personal content in logs.

        def allowed(self) -> bool:
            return self.headers.get_all("Host") == [f"127.0.0.1:{self.server.server_port}"] and self.headers.get_all("Origin") is not None and len(self.headers.get_all("Origin")) == 1 and self.headers.get("Origin") in service.origins

        def send_json(self, status: int, value: dict):
            body = json.dumps(value, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            if self.allowed():
                self.send_header("Access-Control-Allow-Origin", self.headers["Origin"])
                self.send_header("Vary", "Origin")
            self.end_headers(); self.wfile.write(body)

        def check(self, authenticate=True) -> bool:
            if not self.allowed():
                self.send_json(403, {"error": "Origin or host not allowed."}); return False
            if self.path not in {"/health", "/pair", "/status", "/capture", "/observations", "/clear", "/disconnect"}:
                self.send_json(404, {"error": "Unknown endpoint."}); return False
            if authenticate and (len(self.headers.get_all("Authorization") or []) != 1 or not service.authorized(self.headers.get("Authorization", ""))):
                self.send_json(401, {"error": "Pair with the desktop helper again."}); return False
            return True

        def body(self) -> dict | None:
            if len(self.headers.get_all("Content-Type") or []) != 1 or self.headers.get_content_type() != "application/json" or self.headers.get("Transfer-Encoding"):
                self.send_json(415, {"error": "JSON body required."}); return None
            lengths = self.headers.get_all("Content-Length") or []
            if len(lengths) != 1 or not lengths[0].isdigit() or not 0 < int(lengths[0]) <= MAX_BODY:
                self.send_json(413, {"error": "Invalid or oversized request."}); return None
            try:
                value = json.loads(self.rfile.read(int(lengths[0])))
                if not isinstance(value, dict): raise ValueError()
                return value
            except (ValueError, UnicodeError):
                self.send_json(400, {"error": "Invalid JSON object."}); return None

        def do_OPTIONS(self):
            if not self.check(authenticate=False): return
            method = self.headers.get("Access-Control-Request-Method", "")
            requested = {value.strip().lower() for value in self.headers.get("Access-Control-Request-Headers", "").split(",") if value.strip()}
            if method not in {"GET", "POST"} or not requested.issubset({"authorization", "content-type"}):
                self.send_json(403, {"error": "Preflight not allowed."}); return
            self.send_response(204)
            self.send_header("Access-Control-Allow-Origin", self.headers["Origin"])
            self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Methods", "GET, POST")
            self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
            self.send_header("Access-Control-Allow-Private-Network", "true")
            self.end_headers()

        def do_GET(self):
            if not self.check(authenticate=self.path != "/health"): return
            with service.lock:
                if self.path != "/health" and not service.authorized(self.headers.get("Authorization", "")):
                    self.send_json(401, {"error": "Pair with the desktop helper again."}); return
                if self.path == "/health": self.send_json(200, {"service": SERVICE, "version": 1})
                elif self.path == "/status": self.send_json(200, service.status())
                elif self.path == "/observations": self.send_json(200, service.store.package())
                else: self.send_json(405, {"error": "Method not allowed."})

        def do_POST(self):
            if not self.check(authenticate=self.path != "/pair"): return
            value = self.body()
            if value is None: return
            with service.lock:
                if self.path != "/pair" and not service.authorized(self.headers.get("Authorization", "")):
                    self.send_json(401, {"error": "Pair with the desktop helper again."}); return
                if self.path == "/pair":
                    if set(value) != {"code"}: self.send_json(400, {"error": "Pairing code required."}); return
                    status, result = service.pair(value["code"]); self.send_json(status, result)
                elif self.path == "/capture":
                    if not set(value).issubset({"enabled", "browserTopics"}) or not isinstance(value.get("enabled"), bool) or ("browserTopics" in value and not isinstance(value["browserTopics"], bool)):
                        self.send_json(400, {"error": "Capture requires enabled boolean and optional browserTopics boolean."}); return
                    service.enabled = value["enabled"]; service.browser_topics = value.get("browserTopics", service.browser_topics); service.previous = None
                    self.send_json(200, {"enabled": service.enabled, "browserTopics": service.browser_topics})
                elif self.path == "/clear" and not value:
                    service.enabled = False; service.previous = None; service.store.clear(); service.memory.clear(); self.send_json(200, {"enabled": False, "observations": 0})
                elif self.path == "/disconnect" and not value:
                    service.disconnect(); self.send_json(200, {"enabled": False})
                else: self.send_json(400, {"error": "Unsupported operation or fields."})
    return Handler


def secure_data_dir(path: Path):
    path = path.absolute()
    protected = {Path(path.anchor), Path.home().absolute(), Path.cwd().absolute()}
    for name in ("LOCALAPPDATA", "APPDATA", "TEMP", "TMP", "USERPROFILE"):
        if os.environ.get(name): protected.add(Path(os.environ[name]).absolute())
    if path in protected or path.is_symlink() or (hasattr(path, "is_junction") and path.is_junction()):
        raise ValueError("Choose a dedicated, non-linked Mirrorville observer data directory.")
    marker = path / ".mirrorville-observer"
    allowed = {".mirrorville-observer", "observations.db", "observations.db-journal", "observations.db-wal", "observations.db-shm", "pairing-code.txt"}
    if path.exists():
        children = list(path.iterdir())
        if children and (not marker.is_file() or marker.read_text(encoding="ascii") != SERVICE or any(child.name not in allowed or not child.is_file() or child.is_symlink() for child in children)):
            raise ValueError("Existing data directory is not a dedicated Mirrorville observer folder. Choose a new empty directory.")
    path.mkdir(parents=True, exist_ok=True)
    if os.name == "nt":
        # Restrict the private directory to the current owner, LocalSystem and administrators.
        account = f"{os.environ.get('USERDOMAIN', '')}\\{os.environ.get('USERNAME', '')}".strip("\\")
        result = subprocess.run(["icacls", str(path), "/inheritance:r", "/grant:r", f"{account}:(OI)(CI)F", "*S-1-5-18:(OI)(CI)F", "*S-1-5-32-544:(OI)(CI)F"], capture_output=True)
        if result.returncode:
            raise RuntimeError("Could not protect the private observer folder permissions.")
    else:
        path.chmod(0o700)
    marker.write_text(SERVICE, encoding="ascii")


def main() -> int:
    parser = argparse.ArgumentParser(description="Opt-in Mirrorville desktop observer. Starts PAUSED. No cloud upload.")
    parser.add_argument("--origin", action="append", required=True, help="Exact browser origin, e.g. http://localhost:5173; repeat for more")
    parser.add_argument("--data-dir", type=Path, default=Path(os.environ.get("LOCALAPPDATA", str(Path.home()))) / "Mirrorville" / "observer")
    parser.add_argument("--pairing-file", type=Path, help="Pairing-code file inside --data-dir (default pairing-code.txt)")
    parser.add_argument("--port", type=int, default=17358)
    parser.add_argument("--poll-seconds", type=float, default=2.0)
    args = parser.parse_args()
    try:
        if not 1024 <= args.port <= 65535: raise ValueError("Use a local unprivileged port.")
        # Check the original target before resolving so a junction cannot bypass the guard.
        if args.data_dir.is_symlink() or (hasattr(args.data_dir, "is_junction") and args.data_dir.is_junction()):
            raise ValueError("Linked observer data directories are not supported.")
        data_dir = args.data_dir.absolute()
        secure_data_dir(data_dir)
        pairing_file = (args.pairing_file or data_dir / "pairing-code.txt").resolve()
        if pairing_file.parent != data_dir.resolve() or pairing_file.name != "pairing-code.txt": raise ValueError("Pairing-code file must be pairing-code.txt inside the private data directory.")
        service = ObserverService(data_dir, args.origin, pairing_file, args.poll_seconds, NativeSampler())
        server = ThreadingHTTPServer(("127.0.0.1", args.port), make_handler(service))
        server.daemon_threads = True
        thread = threading.Thread(target=service.loop, daemon=True); thread.start()
        print(f"Mirrorville observer is paused on 127.0.0.1:{args.port}. Pair in the room, then explicitly enable capture. Your local pairing code is: {service.code}", flush=True)
        try: server.serve_forever(poll_interval=0.25)
        except KeyboardInterrupt: pass
        finally:
            service.stopped.set(); service.disconnect(); server.server_close()
            try: pairing_file.unlink(missing_ok=True)
            except OSError: pass
        return 0
    except (OSError, RuntimeError, ValueError):
        print("Desktop observer could not start. Check Windows, private folder permissions, explicit origins and whether the local port is already in use.")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
