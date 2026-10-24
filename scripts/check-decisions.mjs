// Lists decision, principle and design changes on every branch relative to main,
// so teammates can spot clashing ideas before anything is merged. Read-only
// apart from `git fetch`.
import { spawnSync } from 'node:child_process';

function git(...args) {
  const r = spawnSync('git', args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')}: ${r.stderr.trim()}`);
  return r.stdout.trim();
}
function tryGit(...args) {
  try {
    return git(...args);
  } catch {
    return '';
  }
}

const WATCHED = ['docs/decisions', 'docs/core', 'docs/design'];

if (tryGit('remote')) {
  const fetched = spawnSync('git', ['fetch', '--all', '--prune', '--quiet'], { encoding: 'utf8' });
  if (fetched.status !== 0) console.warn('Could not fetch; showing local branches only.');
}

const base = tryGit('rev-parse', '--verify', '--quiet', 'origin/main') ? 'origin/main' : 'main';

// Local and remote branches, one entry per name, preferring the remote copy.
const refs = new Map();
for (const ref of git('for-each-ref', '--format=%(refname:short)', 'refs/heads', 'refs/remotes').split('\n')) {
  if (!ref || ref.endsWith('/HEAD') || ref === 'origin') continue;
  const name = ref.replace(/^origin\//, '');
  if (name === 'main') continue;
  if (!refs.has(name) || ref.startsWith('origin/')) refs.set(name, ref);
}

const touchedBy = new Map();
const proposals = new Map();
let warnings = 0;
const warn = (msg) => {
  warnings++;
  console.log(`  ! ${msg}`);
};

console.log(`Comparing against ${base}\n`);
for (const [name, ref] of [...refs].sort()) {
  const changes = tryGit('diff', '--name-status', `${base}...${ref}`, '--', ...WATCHED)
    .split('\n')
    .filter(Boolean)
    .map((l) => l.split('\t'));
  const ahead = tryGit('rev-list', '--count', `${base}..${ref}`);
  console.log(`${name}  (${ref}, ${ahead || '?'} commits ahead)`);
  if (changes.length === 0) {
    console.log('  no decision/principle/design changes\n');
    continue;
  }
  for (const [status, path] of changes) {
    console.log(`  ${status}  ${path}`);
    touchedBy.set(path, [...(touchedBy.get(path) ?? []), name]);
    const file = path.split('/').pop();
    if (status === 'A' && /^\d{4}-/.test(file) && path.startsWith('docs/decisions/')) {
      warn(`${file} is numbered on a branch; numbers are only given on main`);
    }
    if (path.startsWith('docs/core/')) warn(`${path} changes the principles; agree on this together`);
    if (/^proposed-.*\.md$/.test(file) && status !== 'D') {
      const text = tryGit('show', `${ref}:${path}`);
      const title = (text.match(/^#\s+(.*)$/m) ?? [])[1] ?? file;
      const statusLine = (text.match(/^Status:\s*(.*)$/m) ?? [])[1] ?? 'no status line';
      console.log(`       "${title}" (${statusLine})`);
      proposals.set(file, [...(proposals.get(file) ?? []), name]);
    }
  }
  console.log('');
}

for (const [path, branches] of touchedBy) {
  if (branches.length > 1) warn(`${path} is changed on ${branches.join(', ')}; compare before merging`);
}
for (const [file, branches] of proposals) {
  if (branches.length > 1) warn(`${file} is drafted on ${branches.join(', ')}; settle it into one draft`);
}
console.log(warnings ? `${warnings} thing(s) to look at.` : 'No overlaps found. Still read new drafts for clashing ideas.');
