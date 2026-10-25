import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function load(file, extra = {}) {
  const exports = {};
  const js = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInNewContext(js, { exports, setTimeout, clearTimeout, AbortController, URL, fetch, require: () => load('../spacetimedb/src/redact.ts'), ...extra });
  return exports;
}
const api = load('../src/github.ts');
const now = Date.parse('2026-10-24T18:00:00Z');
const user = { id: 12, login: 'owner', type: 'User' };
const repo = (changes = {}) => ({ id: 1, name: 'robot', owner: { id: 12, login: 'owner' }, private: false, fork: false, description: 'Small robot project contact person@example.test', language: 'TypeScript', created_at: '2020-01-01T00:00:00Z', pushed_at: '2026-10-24T18:00:00Z', ...changes });
const event = (changes = {}) => ({ id: 'e1', actor: { id: 12, login: 'owner' }, repo: { name: 'team/robot' }, public: true, type: 'PushEvent', payload: { commits: [{ message: 'DO_NOT_IMPORT_OTHER_COMMIT_TEXT' }] }, created_at: '2026-10-23T12:00:00Z', ...changes });
const response = (value, status = 200) => ({ ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(value) });

test('profile inputs reject arbitrary hosts, credentials, repository paths and invalid names', () => {
  assert.equal(api.githubUsername(' https://github.com/octocat/ '), 'octocat');
  assert.equal(api.githubUsername('Owner-Name'), 'Owner-Name');
  for (const input of ['https://evil.test/owner', 'http://github.com/owner', 'https://token@github.com/owner', 'https://github.com/owner/repo', 'https://github.com/owner?token=secret', '../x', 'bad--name', '-bad']) assert.throws(() => api.githubUsername(input));
});

test('only owned nonfork public background and own actor recent actions survive, without collaborator content', () => {
  const data = api.githubPieces(user, [repo(), repo({ id: 2, private: true }), repo({ id: 3, fork: true }), repo({ id: 4, owner: { id: 99, login: 'other' } }), repo()], [event(), event({ id: 'foreign', actor: { id: 99, login: 'other' } }), event({ id: 'old', created_at: '2020-01-01' }), event({ id: 'future', created_at: '2027-01-01' }), event({ id: 'private', public: false }), event({ id: 'comment', type: 'IssueCommentEvent', payload: { comment: { body: 'COMMENT_SECRET' } } }), event()], now);
  assert.equal(data.pieces.length, 2);
  const letter = api.githubLetter(data.pieces);
  assert.ok(!letter.text.includes('person@example.test'));
  assert.ok(!letter.text.includes('DO_NOT_IMPORT_OTHER_COMMIT_TEXT'));
  assert.ok(!letter.text.includes('COMMENT_SECRET'));
  assert.ok(letter.text.includes('January 1, 2020'));
  assert.ok(letter.text.includes('October 23, 2026'));
  assert.equal(letter.latestAt, '2026-10-23T12:00:00.000Z');
  assert.equal(api.githubLetter(data.pieces.filter(piece => piece.kind === 'background')).latestAt, '', 'pushed_at never promotes background to recent activity');
  data.pieces[0].text = 'Edited contact edited@example.test ' + 'a'.repeat(40);
  assert.ok(!api.githubLetter(data.pieces).text.includes('edited@example.test'));
});

test('whole-item letter cap, empty edits and bounded extraction are enforced', () => {
  const pieces = Array.from({ length: 160 }, (_, i) => ({ id: String(i), kind: 'background', text: 'x'.repeat(2000), at: '', dateLabel: 'Unknown' }));
  const letter = api.githubLetter(pieces);
  assert.ok(letter.text.length <= 29000);
  assert.ok(letter.included < pieces.length);
  assert.equal(api.githubLetter([{ ...pieces[0], text: ' ' }]).characters, 0);
  const manyRepos = Array.from({ length: 80 }, (_, i) => repo({ id: i }));
  assert.equal(api.githubPieces(user, manyRepos, [], now).pieces.length, 50);
  const dated = { id: 'recent', kind: 'activity', text: 'Recent account action', at: '2026-10-23T00:00:00.000Z', dateLabel: 'October 23, 2026' };
  assert.ok(api.githubLetter([...pieces, dated]).text.startsWith('[GitHub account action'));
});

test('lookup deadline aborts a hanging network request with a retryable message', async () => {
  let deadline;
  const timed = load('../src/github.ts', { setTimeout(callback) { deadline = callback; return 1; }, clearTimeout() {} });
  const pending = timed.readGitHub('owner', undefined, async (_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('RAW_ABORT_SECRET')), { once: true })), now);
  deadline();
  await assert.rejects(pending, /took too long/);
});

test('public lookup makes only fixed-host no-credential bounded requests and validates identity/list shapes', async () => {
  const calls = [];
  const mock = async (url, options) => { calls.push({ url, options }); return response(url.includes('/repos?') ? [repo()] : url.includes('/events/public?') ? [event()] : user); };
  const value = await api.readGitHub('owner', undefined, mock, now);
  assert.equal(value.pieces.length, 2);
  assert.equal(calls.length, 3);
  for (const call of calls) { assert.ok(call.url.startsWith('https://api.github.com/users/owner')); assert.equal(call.options.credentials, 'omit'); assert.equal(call.options.redirect, 'error'); assert.equal(call.options.headers.Authorization, undefined); }
  await assert.rejects(api.readGitHub('owner', undefined, async () => response({ ...user, login: 'other' }), now), /personal GitHub account/);
  await assert.rejects(api.readGitHub('owner', undefined, async url => response(url.endsWith('/owner') ? user : {}), now), /unreadable activity/);
  await assert.rejects(api.readGitHub('owner', undefined, async () => response({ ...user, type: 'Organization' }), now), /personal GitHub account/);
});

test('404, rate limits, malformed responses, network failures and cancellation fail without raw remote content', async () => {
  for (const [status, message] of [[404, /could not be found/], [403, /limited/], [429, /limited/], [500, /could not return/]]) await assert.rejects(api.readGitHub('owner', undefined, async () => response({ message: 'REMOTE_SECRET' }, status), now), message);
  await assert.rejects(api.readGitHub('owner', undefined, async () => ({ ok: true, status: 200, text: async () => 'RAW_SECRET invalid json' }), now), /unreadable response/);
  await assert.rejects(api.readGitHub('owner', undefined, async () => { throw new Error('REMOTE_SECRET'); }, now), error => !error.message.includes('REMOTE_SECRET') && error.message.includes('could not be reached'));
  const controller = new AbortController(); controller.abort();
  let calls = 0;
  await assert.rejects(api.readGitHub('owner', controller.signal, async () => { calls++; return response(user); }, now), /cancelled/);
  assert.equal(calls, 0);
});

const find = (node, check) => {
  if (!node || typeof node !== 'object') return;
  if (check(node)) return node;
  for (const child of [node.props?.children].flat(Infinity)) { const value = find(child, check); if (value) return value; }
};
const tick = () => new Promise(resolve => setImmediate(resolve));
function harness() {
  const states = []; let cursor = 0, emitted, calls = 0;
  const hooks = { useState(initial) { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; }, useRef(value) { const i = cursor++; if (!(i in states)) states[i] = { current: value }; return states[i]; }, useEffect() {} };
  const exports = {};
  const js = ts.transpileModule(readFileSync(new URL('../src/GitHubOffering.tsx', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  runInNewContext(js, { exports, AbortController, require(name) {
    if (name === 'react') return hooks;
    if (name === 'react/jsx-runtime') return require(name);
    if (name === './github') return { ...api, readGitHub: async () => { calls++; return api.githubPieces(user, [repo()], [event()], now); } };
    throw new Error(name);
  } });
  const render = () => { cursor = 0; return exports.default({ busy: false, onBack() {}, onReady(gift) { emitted = gift; } }); };
  const button = label => find(render(), node => node.type === 'button' && node.props.children === label);
  return { render, button, get calls() { return calls; }, get emitted() { return emitted; } };
}

test('UI requires owner declaration, edits exact redacted preview, sends only explicit handoff, clears on account change', async () => {
  const h = harness();
  assert.equal(h.button('Read my GitHub').props.disabled, true);
  find(h.render(), node => node.type === 'input' && node.props['aria-label']).props.onChange({ target: { value: 'owner' } });
  find(h.render(), node => node.type === 'input' && node.props.type === 'checkbox').props.onChange({ target: { checked: true } });
  await h.button('Read my GitHub').props.onClick(); await tick();
  assert.equal(h.calls, 1); assert.equal(h.emitted, undefined);
  find(h.render(), node => node.type === 'textarea').props.onChange({ target: { value: 'My robot project is a hobby. Contact edited@example.test for details.' } });
  const preview = find(h.render(), node => node.type === 'pre').props.children;
  assert.ok(!preview.includes('edited@example.test'));
  h.button('Hand over selected pieces ✉').props.onClick();
  assert.equal(h.emitted.text, preview); assert.equal(h.emitted.inputKind, 'facts');
  assert.equal(h.emitted.relation, 'other');
  find(h.render(), node => node.type === 'input' && node.props['aria-label'] === 'GitHub username or profile URL').props.onChange({ target: { value: 'other' } });
  assert.equal(h.button('Hand over selected pieces ✉'), undefined);
  assert.equal(h.button('Read my GitHub').props.disabled, true);
});
