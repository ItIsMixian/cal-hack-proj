// Stores model keys in the module's private config table. Run as the identity
// that published it. Keys come from .env.local if present there; otherwise
// they are asked for with hidden input and never written to a file.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

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
          resolve(value.trim());
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
  console.error('No keys given.');
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
