"""Create a local, reviewable Mirrorville package; never start or modify Marglo."""
from __future__ import annotations

import argparse
from contextlib import closing
from datetime import datetime, timezone
import json
import math
from pathlib import Path
import re
import sqlite3
import sys

# Unknown executable names never leave the computer. Labels describe activity, not motives.
APP_LABELS = {
    "code": "a code editor", "code - insiders": "a code editor", "cursor": "a code editor",
    "pycharm64": "a code editor", "idea64": "a code editor", "devenv": "a code editor",
    "unity": "Unity", "godot": "Godot", "blender": "Blender", "figma": "Figma",
    "chrome": "a web browser", "msedge": "a web browser", "firefox": "a web browser",
    "acrobat": "a document reader", "acrord32": "a document reader", "zotero": "Zotero",
    "notepad": "a text editor", "obsidian": "a notes app", "notion": "a notes app",
}
HEADINGS = {"current_projects": {"当前在做的事", "current projects"}, "this_week": {"这周打算", "this week"}}


def iso(ts: float) -> str:
    return datetime.fromtimestamp(ts, timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def redact(text: str) -> str:
    for pattern, replacement in [
        (r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+", "[email]"),
        (r"https?://\S+|www\.\S+", "[link]"),
        (r"[A-Za-z]:[\\/][^\n\r|]+|\\\\[^\s]+", "[local path]"),
        (r"(?:~/(?:[^\s]+)|/(?:Users|home|mnt|tmp)/[^\s]+)", "[local path]"),
        (r"(?:\+?\d[\d\s().-]{6,}\d)", "[number]"),
        (r"(^|\s)@[\w.]{2,}", r"\1[handle]"),
    ]:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    return text.strip()


def activity_items(db_path: Path, start: float, end: float) -> list[dict]:
    # mode=ro avoids accidentally opening an empty store or running any application migration.
    if not db_path.is_file():
        raise ValueError("Marglo store.db was not found. Pass --data-dir pointing to Marglo's data folder, or use --template without a data folder.")
    totals: dict[str, dict] = {}
    with closing(sqlite3.connect(db_path.resolve().as_uri() + "?mode=ro", uri=True)) as conn:
        conn.execute("PRAGMA query_only=ON")
        conn.execute("PRAGMA trusted_schema=OFF")
        columns = {row[1] for row in conn.execute("PRAGMA table_info(episodes)")}
        if not {"app", "start_ts", "end_ts", "dwell_ms"}.issubset(columns):
            raise ValueError("This store does not have the supported Marglo episodes schema.")
        # Never SELECT title, events JSON, browser URLs, context history, agent thoughts or memoirs.
        rows = conn.execute("SELECT app, start_ts, end_ts, dwell_ms FROM episodes WHERE end_ts >= ? AND start_ts <= ? ORDER BY end_ts DESC LIMIT 50001", (start, end))
        for count, (app, began, ended, dwell) in enumerate(rows, 1):
            if count > 50_000:
                raise ValueError("Too many activity episodes; export a shorter --days window.")
            if not isinstance(app, str) or len(app) > 100 or "/" in app or "\\" in app:
                continue
            label = APP_LABELS.get(re.sub(r"\.exe$", "", app.lower()))
            if not label:
                continue
            if not all(isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) for v in (began, ended, dwell)) or ended < began or dwell <= 0:
                continue
            clipped_start, clipped_end = max(began, start), min(ended, end)
            seconds = min(dwell / 1000, clipped_end - clipped_start)
            if seconds <= 0:
                continue
            item = totals.setdefault(label, {"seconds": 0, "start": clipped_start, "end": clipped_end})
            item["seconds"] += seconds
            item["start"] = min(item["start"], clipped_start)
            item["end"] = max(item["end"], clipped_end)
    items = []
    for number, (label, data) in enumerate(sorted(totals.items(), key=lambda pair: -pair[1]["seconds"])[:20]):
        minutes = int(data["seconds"] // 60)
        if minutes < 1:
            continue
        items.append({"id": f"activity_{number}", "kind": "observation", "text": f"My computer recorded about {minutes} minutes with {label} in the foreground during this period. This does not establish what I completed or why I used it.", "startAt": iso(data["start"]), "endAt": iso(data["end"]), "provenance": "desktop_activity", "status": "tentative"})
    return items


def context_items(path: Path, selected: list[str]) -> list[dict]:
    if not selected:
        return []
    if not path.is_file() or path.stat().st_size > 256_000:
        raise ValueError("Selected context.md is missing or larger than 256 KB.")
    current = None
    sections: dict[str, list[str]] = {key: [] for key in selected}
    for line in path.read_text(encoding="utf-8-sig").splitlines():
        if line.startswith("## "):
            heading = line[3:].strip().lower()
            current = next((key for key in selected if heading in HEADINGS[key]), None)
        elif line.startswith("#"):
            current = None
        elif current and line.strip():
            # Context can be maintained by both owner and agent; all remains tentative.
            sections[current].append(line.strip())
    result = []
    for key, lines in sections.items():
        if lines:
            content = redact("\n".join(lines))[:1_800]
            if content:
                result.append({"id": f"context_{key}", "kind": "background", "text": f"Selected Marglo context ({key.replace('_', ' ')}), date unknown; may be outdated or inferred:\n{content}", "startAt": None, "endAt": None, "provenance": "selected_context", "status": "tentative"})
    return result


def build_package(data_dir: Path | None, days: int, include_context: list[str], now: float | None = None) -> dict:
    if not 1 <= days <= 30:
        raise ValueError("Choose --days between 1 and 30.")
    if any(key not in HEADINGS for key in include_context):
        raise ValueError("Only current_projects and this_week context sections may be selected.")
    now = datetime.now(timezone.utc).timestamp() if now is None else now
    items = [] if data_dir is None else activity_items(data_dir / "store.db", now - days * 86_400, now) + context_items(data_dir / "context.md", include_context)
    return {"type": "mirrorville.marglo", "version": 1, "generatedAt": iso(now), "items": items}


def main() -> int:
    parser = argparse.ArgumentParser(description="Export a local Mirrorville Marglo package for owner review. No network, no raw titles/URLs, no source-data writes.")
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--data-dir", type=Path, help="Explicit Marglo data folder containing store.db")
    source.add_argument("--template", action="store_true", help="Write an empty versioned template instead of reading Marglo")
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--days", type=int, default=7)
    parser.add_argument("--include-context", choices=sorted(HEADINGS), nargs="+", default=[], help="Opt in only these context sections; all text remains tentative for review")
    args = parser.parse_args()
    try:
        if args.template and args.include_context:
            raise ValueError("--include-context requires --data-dir.")
        package = build_package(args.data_dir, args.days, args.include_context)
        # Exclusive creation avoids overwriting a user's package or source database.
        with args.out.open("x", encoding="utf-8", newline="\n") as output:
            json.dump(package, output, ensure_ascii=False, indent=2)
            output.write("\n")
        print(f"Created a local package with {len(package['items'])} pieces for review. Nothing was uploaded.")
        return 0
    except (OSError, sqlite3.Error, ValueError) as exc:
        # Do not print source paths, sqlite contents or raw private text.
        message = str(exc) if isinstance(exc, ValueError) else "Could not read the source or create the output. Check the input folder, supported SQLite schema, output parent folder and that the output does not already exist."
        print(message, file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
