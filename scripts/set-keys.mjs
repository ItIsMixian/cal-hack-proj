// Stores model keys in the module's private config table. Run as the identity
// that published it. Keys come from .env.local if present there; otherwise
// they are asked for with hidden input and never written to a file.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { homedir } from 'node:os';

const env = existsSync('.env.local')
  ? Object.fromEntries(
      readFileSync('.env.local', 'utf8')
        .split(/\r?\n/)
        .map((line) => line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/))
        .filter(Boolean)
        .map(([, k, v]) => [k, v.replace(/^["']|["']$/g, '')]),
    )
  : {};

function askHidden(question) {
  return new Promise((resolve) => {
    const { stdin, stdout } = process;
    stdout.write(question);
    let value = '';
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') {
          stdin.setRawMode?.(false);
          stdin.pause();
          stdin.off('data', onData);
          stdout.write('\n');
          // Drop bracketed-paste markers and any other control characters.
          resolve(value.replace(/\u001b\[20[01]~/g, '').replace(/[\u0000-\u001f\u007f]/g, '').trim());
          return;
        }
        if (ch === '\u0003') process.exit(130); // Ctrl+C
        if (ch === '\u007f' || ch === '\b') value = value.slice(0, -1);
        else value += ch;
      }
    };
    stdin.on('data', onData);
  });
}

let deepseek = env.DEEPSEEK_API_KEY ?? '';
let anthropic = env.ANTHROPIC_API_KEY ?? '';
if (!deepseek && !anthropic) {
  console.log('Paste each key and press Enter. Nothing is shown or saved to a file. Leave blank to skip.');
  deepseek = await askHidden('DeepSeek API key: ');
  anthropic = await askHidden('Anthropic API key (optional): ');
}
if (!deepseek && !anthropic) {
  console.error('No keys given. If pasting showed nothing, try right-click to paste instead of Ctrl+V.');
  process.exit(1);
}
for (const [label, key] of [['DeepSeek', deepseek], ['Anthropic', anthropic]]) {
  if (key && !/^[\x21-\x7e]{20,}$/.test(key)) {
    console.error(`That doesn't look like a ${label} key (read ${key.length} characters). Try right-click to paste.`);
    process.exit(1);
  }
}

function findCli() {
  if (process.env.SPACETIME_CLI) return process.env.SPACETIME_CLI;
  const roots = [process.env.LOCALAPPDATA, join(homedir(), 'AppData', 'Local')].filter(Boolean);
  for (const root of roots) {
    const bin = join(root, 'SpacetimeDB', 'bin');
    if (!existsSync(bin)) continue;
    const versions = readdirSync(bin).filter((d) => /^\d+\.\d+\.\d+$/.test(d)).sort();
    for (const version of versions.reverse()) {
      const exe = join(bin, version, 'spacetimedb-cli.exe');
      if (existsSync(exe)) return exe;
    }
  }
  return 'spacetime';
}

const server = process.argv[2] ?? 'local';
const db = env.VITE_SPACETIMEDB_DB_NAME ?? 'mirrorville';

// With the publisher's token, call the reducer over HTTP; no CLI needed.
if (env.SPACETIMEDB_ADMIN_TOKEN) {
  const base = env.SPACETIMEDB_HTTP ?? 'http://127.0.0.1:3000';
  const res = await fetch(`${base}/v1/database/${db}/call/set_llm_config`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.SPACETIMEDB_ADMIN_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([deepseek, anthropic]),
  }).catch((e) => ({ ok: false, status: 0, text: async () => String(e) }));
  if (!res.ok) {
    console.error(`Could not store keys (${res.status}): ${(await res.text()).slice(0, 200)}`);
    process.exit(1);
  }
  console.log(`Keys stored on ${base}/${db}: DeepSeek ${deepseek ? 'set' : 'unchanged'}, Anthropic ${anthropic ? 'set' : 'unchanged'}.`);
  process.exit(0);
}

const result = spawnSync(
  findCli(),
  ['call', db, 'set_llm_config', JSON.stringify(deepseek), JSON.stringify(anthropic), '--server', server],
  { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' },
);
if (result.status !== 0) {
  console.error(result.error ? `Could not run the SpacetimeDB CLI: ${result.error.message}` : result.stderr || result.stdout);
  process.exit(result.status ?? 1);
}
console.log(`Keys stored on ${server}/${db}: DeepSeek ${deepseek ? 'set' : 'unchanged'}, Anthropic ${anthropic ? 'set' : 'unchanged'}.`);
