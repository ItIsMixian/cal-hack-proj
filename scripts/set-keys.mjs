// Reads DEEPSEEK_API_KEY / ANTHROPIC_API_KEY from .env.local and stores them in
// the module's private config table. Run as the identity that published it.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/))
    .filter(Boolean)
    .map(([, k, v]) => [k, v.replace(/^["']|["']$/g, '')]),
);

const deepseek = env.DEEPSEEK_API_KEY ?? '';
const anthropic = env.ANTHROPIC_API_KEY ?? '';
if (!deepseek && !anthropic) {
  console.error('Add DEEPSEEK_API_KEY (and optionally ANTHROPIC_API_KEY) to .env.local first.');
  process.exit(1);
}

function findCli() {
  if (process.env.SPACETIME_CLI) return process.env.SPACETIME_CLI;
  const bin = process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'SpacetimeDB', 'bin');
  if (bin && existsSync(bin)) {
    const versions = readdirSync(bin).filter((d) => /^\d+\.\d+\.\d+$/.test(d)).sort();
    const exe = versions.length && join(bin, versions.at(-1), 'spacetimedb-cli.exe');
    if (exe && existsSync(exe)) return exe;
  }
  return 'spacetime';
}

const server = process.argv[2] ?? 'local';
const db = env.VITE_SPACETIMEDB_DB_NAME ?? 'mirrorville';
const result = spawnSync(
  findCli(),
  ['call', db, 'set_llm_config', JSON.stringify(deepseek), JSON.stringify(anthropic), '--server', server],
  { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' },
);
if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(result.status ?? 1);
}
console.log(`Keys stored on ${server}/${db}: DeepSeek ${deepseek ? 'set' : 'unchanged'}, Anthropic ${anthropic ? 'set' : 'unchanged'}.`);
