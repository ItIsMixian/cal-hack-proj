"""Private stdio transport owned by the desktop app. No HTTP listener or pairing UI."""
import argparse
import json
from pathlib import Path
import sys
import threading

from observer import NativeSampler, ObserverService, secure_data_dir
from codex_source import CodexSource
from daily_reports import DailyReports


def dispatch(service, method, body):
    with service.lock:
        if method == "status" and not body:
            return service.status()
        if method == "observations" and not body:
            return service.store.package()
        if method == 'codexSources' and not body and service.codex:
            return service.codex.sources()
        if method == 'codexSelect' and set(body)=={'threadIds'} and service.codex:
            service.codex.select(body['threadIds'])
            service.memory.generation += 1  # Invalidate any result from a previous selection.
            return {'selected':True}
        if method=='codexAuto' and set(body)=={'enabled'} and service.codex:
            service.reports.set_codex(body['enabled'])
            service.codex.auto_recent=body['enabled']
            if not body['enabled']: service.codex.clear()
            service.memory.generation+=1
            return {'enabled':body['enabled']}
        if method == "capture" and set(body) in ({"enabled", "browserTopics"},{"enabled", "browserTopics", "contextTitles"}) and all(type(v) is bool for v in body.values()):
            # A conscious Start renews the local twelve-hour observation session.
            if body["enabled"] and not service.authorized("Bearer " + (service.token or "")):
                service.disconnect()
                service.pair(service.code)
            if service.enabled and not body['enabled']: service.memory.generation+=1
            service.enabled = body["enabled"]
            service.browser_topics = body["browserTopics"]
            service.context_titles = body.get('contextTitles',False)
            if service.sampler:
                service.sampler.read_titles = service.context_titles
            service.memory.previous = None
            service.previous = None
            service.last_state = "waiting"
            return {"enabled": service.enabled}
        if method in {"pause", "clear"} and not body:
            service.memory.generation+=1
            service.enabled = False
            service.previous = None
            if method == "clear":
                service.store.clear()
                service.memory.clear()
                if getattr(service,'reports',None): service.reports.clear()
                if service.codex: service.codex.clear()
            return {"enabled": False}
        if method in {'context','saveUnderstanding','reviseUnderstanding','dailyReports','dailyContext','saveDailyReport','dailyDelivered'}:
            scope=body.get('scope')
            if not isinstance(scope,str) or not 8<=len(scope)<=240:
                raise ValueError('Invalid local identity scope')
            if method=='context' and set(body)=={'scope'}:
                return service.memory.snapshot(scope)
            if method=='dailyReports' and set(body)=={'scope'}:
                return service.reports.list(scope)
            if method=='dailyContext' and set(body)=={'scope','date'}:
                return service.reports.context(scope,body['date'])
            if method=='saveDailyReport' and set(body)=={'scope','date','hash','generation','episodeIds','themes'}:
                service.reports.save(scope,body)
                return {'saved':True}
            if method=='dailyDelivered' and set(body)=={'scope','date','mirrorId','hash'}:
                service.reports.delivered(scope,body['date'],body['mirrorId'],body['hash'])
                return {'saved':True}
            if method=='saveUnderstanding' and set(body)=={'scope','episodeIds','themes','generation'}:
                service.memory.save(scope,body['episodeIds'],body['themes'],body['generation'])
                return {'saved':True}
            if method=='reviseUnderstanding' and set(body)=={'scope','id','text','state'}:
                service.memory.revise(scope,body['id'],body['text'],body['state'])
                return {'saved':True}
        raise ValueError("Unsupported operation")


def main():
    # Electron pipes are UTF-8 even on Chinese Windows using a legacy console code page.
    if hasattr(sys.stdin,'reconfigure'): sys.stdin.reconfigure(encoding='utf-8',errors='strict')
    if hasattr(sys.stdout,'reconfigure'): sys.stdout.reconfigure(encoding='utf-8',errors='strict')
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", type=Path, required=True)
    parser.add_argument('--test-no-sampling',action='store_true')
    args = parser.parse_args()
    service = None
    try:
        secure_data_dir(args.data_dir)
        service = ObserverService(args.data_dir, ["http://127.0.0.1:17431"], sampler=None if args.test_no_sampling else NativeSampler())
        service.codex = CodexSource(service.memory)
        service.reports=DailyReports(service.memory)
        service.codex.auto_recent=service.reports.settings()
        service.pair(service.code)  # Private pipe capability; does not enable capture.
        threading.Thread(target=service.loop, daemon=True).start()
        for line in sys.stdin:
            request_id = None
            try:
                if len(line) > 32768:
                    raise ValueError()
                value = json.loads(line)
                request_id = value.get("id")
                if type(request_id) is not int or type(value.get("body")) is not dict:
                    raise ValueError()
                result = dispatch(service, value.get("method"), value["body"])
                reply = {"id": request_id, "value": result}
            except Exception:
                reply = {"id": request_id, "error": "The local observer could not complete that action."}
            print(json.dumps(reply, ensure_ascii=True), flush=True)
        return 0
    except Exception:
        # No exception/native title/path content crosses into logs.
        return 1
    finally:
        if service:
            service.stopped.set()
            service.disconnect()


if __name__ == "__main__":
    raise SystemExit(main())
