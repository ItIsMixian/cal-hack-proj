import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

export class ObserverClient {
  constructor(command, args, onExit = () => {}) {
    this.sequence = 0; this.pending = new Map(); this.stopped = false;
    this.child = spawn(command, args, { windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'], env: { ...process.env, PYTHONUNBUFFERED: '1', PYTHONUTF8:'1' } });
    const fail = () => {
      this.stopped = true;
      for (const entry of this.pending.values()) { clearTimeout(entry.timer); entry.reject(new Error('Local observation is unavailable. Restart Mirrorville to retry.')); }
      this.pending.clear(); onExit();
    };
    this.child.on('error', fail); this.child.on('exit', fail);
    this.child.stdin.on('error', fail);
    createInterface({ input: this.child.stdout }).on('line', line => {
      // A bounded memory snapshot includes episodes plus evidence embedded in notes.
      // JSON's ASCII escapes can expand Chinese titles sixfold.
      if (line.length > 1_000_000) { this.stop(); return; }
      try {
        const reply = JSON.parse(line), entry = this.pending.get(reply.id);
        if (!entry) return;
        this.pending.delete(reply.id); clearTimeout(entry.timer);
        if (reply.error) entry.reject(new Error('The local observer could not complete that action.'));
        else entry.resolve(reply.value);
      } catch { this.stop(); }
    });
  }
  request(method, body = {}) {
    if (this.stopped) return Promise.reject(new Error('Local observation is unavailable. Restart Mirrorville to retry.'));
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error('The local observer timed out.')); this.stop(); }, 5000);
      this.pending.set(id, { resolve, reject, timer });
      this.child.stdin.write(JSON.stringify({ id, method, body }) + '\n', error => { if (error) this.stop(); });
    });
  }
  stop() { if (!this.stopped) { this.child.stdin.end(); this.child.kill(); } }
}
