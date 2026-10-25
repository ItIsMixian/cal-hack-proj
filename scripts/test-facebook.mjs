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
  runInNewContext(js, { exports, setTimeout, clearTimeout, AbortController, require: () => load('../spacetimedb/src/redact.ts'), ...extra });
  return exports;
}
const api = load('../src/facebook.ts');
const now = Date.parse('2026-10-24T18:00:00Z');
const row = (changes = {}) => ({ id: 'own_post', from: { id: 'owner' }, message: 'I finished building my small robot project this weekend.', created_time: '2026-10-23T12:00:00+0000', ...changes });
const tick = () => new Promise(resolve => setImmediate(resolve));
function sdkMock({ permission = true, login = true, page, errorPath, me = 'owner' } = {}) {
  const calls = [];
  return { calls, init() {}, login(callback, options) { calls.push({ path: 'login', options }); callback(login ? { authResponse: { accessToken: 'TOKEN_SECRET', userID: 'owner' } } : {}); },
    api(path, method, parameters, callback) {
      calls.push({ path, method, parameters });
      if (path === errorPath) return callback({ error: { code: 190, message: 'TOKEN_SECRET should never surface' } });
      if (path === '/me/permissions') return callback({ data: [{ permission: 'user_posts', status: permission ? 'granted' : 'declined' }] });
      if (path === '/me') return callback({ id: me });
      callback(page ? page(calls.filter(call => call.path === '/me/posts').length) : { data: [row()] });
    } };
}

test('only recent owner-authored plain text is kept; dates and contact redaction survive packing', () => {
  const rows = [row({ message: 'I built a robot. Contact me@example.test at https://example.test or @myhandle.' }),
    row({ id: 'foreign', from: { id: 'friend' }, message: 'FOREIGN_SECRET' }),
    row({ id: 'tag', message_tags: [{ id: 'friend' }], message: 'TAG_SECRET' }),
    row({ id: 'tagmap', message_tags: { 0: [{ id: 'friend' }] }, message: 'TAGMAP_SECRET' }),
    row({ id: 'photo', attachments: { data: [{ type: 'photo' }] }, message: 'PHOTO_SECRET' }),
    row({ id: 'story', story: 'Auto story', message: 'STORY_SECRET' }),
    row({ id: 'old', created_time: '2025-01-01', message: 'OLD_SECRET' }),
    row({ id: 'future', created_time: '2027-01-01', message: 'FUTURE_SECRET' }),
    row({ id: 'invalid', created_time: 'invalid', message: 'INVALID_SECRET' }),
    row({ id: 'noauthor', from: undefined, message: 'UNKNOWN_SECRET' })];
  const posts = api.ownFacebookPosts(rows, 'owner', now - 90 * 86400000, now);
  assert.equal(posts.length, 1);
  const letter = api.facebookLetter(posts);
  assert.match(letter.text, /October 23, 2026/);
  assert.equal(letter.latestAt, '2026-10-23T12:00:00.000Z');
  assert.ok(!/SECRET|me@example|https:|@myhandle/.test(letter.text));
  assert.match(letter.text, /\[email\]/);
  const redactor = load('../spacetimedb/src/redact.ts');
  assert.equal(redactor.redact(letter.text), letter.text, 'backend redaction preserves dated headers');
});

test('packing redacts owner edits, caps whole posts and dates only included posts', () => {
  const posts = api.ownFacebookPosts(Array.from({ length: 12 }, (_, i) => row({ id: String(i), message: 'a'.repeat(4000) })), 'owner', 0, now);
  posts[0].text = 'Edited address edited@example.test';
  const letter = api.facebookLetter(posts);
  assert.ok(letter.text.length <= 29000);
  assert.ok(letter.included < posts.length);
  assert.ok(!letter.text.includes('edited@example.test'));
  assert.equal(api.facebookLetter([{ ...posts[0], text: 'x' }]).characters, 1, 'headers do not count toward minimum writing');
  assert.equal(api.facebookLetter([]).latestAt, '');
});

test('login opens synchronously, verifies permission/account, bounds pages and ignores paging URLs', async () => {
  const sdk = sdkMock({ page: index => ({ data: [row({ id: String(index) })], paging: { next: 'https://evil.test/?access_token=TOKEN_SECRET', cursors: { after: String(index) } } }) });
  const pending = api.readFacebookPosts(sdk, undefined, now);
  assert.equal(sdk.calls[0].path, 'login');
  const posts = await pending;
  assert.equal(posts.length, 5);
  assert.equal(sdk.calls.filter(call => call.path === '/me/posts').length, 5);
  assert.ok(sdk.calls.every(call => !call.path.includes('evil')));
  assert.equal(sdk.calls[0].options.scope, 'public_profile,user_posts');
  assert.equal(sdk.calls.find(call => call.path === '/me/posts').parameters.since, Math.floor((now - 90 * 86400000) / 1000));
  assert.ok(!JSON.stringify(posts).includes('TOKEN_SECRET'));
});

test('cancel, denied permission, expired token, malformed page and changed account fail closed', async () => {
  for (const [options, pattern] of [[{ login: false }, /cancelled/], [{ permission: false }, /did not grant/], [{ errorPath: '/me/posts' }, /expired/], [{ me: 'another' }, /account changed/], [{ page: () => ({}) }, /unreadable/]]) {
    const sdk = sdkMock(options);
    await assert.rejects(api.readFacebookPosts(sdk, undefined, now), error => { assert.match(error.message, pattern); assert.ok(!error.message.includes('TOKEN_SECRET')); return true; });
    if (!options.permission && options.permission !== undefined) assert.ok(!sdk.calls.some(call => call.path === '/me/posts'));
  }
});

test('empty data is honest; duplicate cursors stop; aborted login cannot continue', async () => {
  assert.equal((await api.readFacebookPosts(sdkMock({ page: () => ({ data: [] }) }), undefined, now)).length, 0);
  const sdk = sdkMock({ page: () => ({ data: [row()], paging: { next: 'anything', cursors: { after: 'same' } } }) });
  await api.readFacebookPosts(sdk, undefined, now);
  assert.equal(sdk.calls.filter(call => call.path === '/me/posts').length, 2);
  let callback;
  const controller = new AbortController();
  const delayed = api.readFacebookPosts({ login(cb) { callback = cb; }, api() { assert.fail('aborted login must not read'); } }, controller.signal, now);
  controller.abort();
  await assert.rejects(delayed, /cancelled/);
  callback({ authResponse: { accessToken: 'secret', userID: 'owner' } });
});

test('SDK lazy loader is single-flight, private by default, retries failure and times out', async () => {
  let appended = [], timers = [];
  const window = {};
  const module = load('../src/facebook.ts', { window, document: { createElement: () => ({ remove() {} }), head: { appendChild(script) { appended.push(script); } } }, setTimeout: fn => { timers.push(fn); return timers.length; }, clearTimeout() {} });
  await assert.rejects(module.loadFacebookSdk('', 'v23.0'), /not configured/);
  const first = module.loadFacebookSdk('123', 'v23.0');
  assert.equal(module.loadFacebookSdk('123', 'v23.0'), first);
  assert.equal(appended.length, 1);
  appended[0].onerror(); await assert.rejects(first, /could not load/);
  const retry = module.loadFacebookSdk('123', 'v23.0');
  assert.equal(appended.length, 2);
  let init;
  window.FB = { init(options) { init = options; } };
  appended[1].onload(); await retry;
  assert.equal(init.cookie, false); assert.equal(init.status, false); assert.equal(init.autoLogAppEvents, false);
  assert.equal(appended[1].src, 'https://connect.facebook.net/en_US/sdk.js');
  const timeoutModule = load('../src/facebook.ts', { window: {}, document: { createElement: () => ({ remove() {} }), head: { appendChild() {} } }, setTimeout: fn => { timers.push(fn); return timers.length; }, clearTimeout() {} });
  const timeout = timeoutModule.loadFacebookSdk('123', 'v23.0'); timers.at(-1)(); await assert.rejects(timeout, /could not load/);
});

const find = (node, check) => {
  if (!node || typeof node !== 'object') return;
  if (check(node)) return node;
  for (const child of [node.props?.children].flat(Infinity)) { const result = find(child, check); if (result) return result; }
};
function uiHarness(configured = true) {
  const states = []; let cursor = 0, failRead = false, emitted;
  let reads = 0, loads = 0;
  const mock = { useState(initial) { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; }, useRef(value) { const i = cursor++; if (!(i in states)) states[i] = { current: value }; return states[i]; }, useEffect() {} };
  const exports = {};
  const source = readFileSync(new URL('../src/FacebookOffering.tsx', import.meta.url), 'utf8').replaceAll('import.meta.env', `({ VITE_FACEBOOK_APP_ID: '${configured ? '123' : ''}' })`);
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  runInNewContext(js, { exports, AbortController, require(name) {
    if (name === 'react') return mock;
    if (name === 'react/jsx-runtime') return require(name);
    if (name === './facebook') return { ...api, loadFacebookSdk: async () => { loads++; return {}; }, readFacebookPosts: async () => { reads++; if (failRead) throw new Error('Permission denied'); return api.ownFacebookPosts([row()], 'owner', 0, now); } };
    throw new Error(name);
  } });
  const render = () => { cursor = 0; return exports.default({ busy: false, onBack() {}, onReady(gift) { emitted = gift; } }); };
  const button = label => find(render(), n => n.type === 'button' && n.props.children === label);
  return { render, button, get emitted() { return emitted; }, get loads() { return loads; }, get reads() { return reads; }, fail() { failRead = true; } };
}

test('unconfigured UI stays honest without SDK; configured preview edits/excludes then hands over facts', async () => {
  const unavailable = uiHarness(false);
  assert.ok(find(unavailable.render(), node => node.props?.role === 'status'));
  assert.equal(unavailable.loads, 0); assert.equal(unavailable.reads, 0);
  const h = uiHarness();
  await h.button('Prepare Facebook connection').props.onClick(); await tick();
  h.button('Connect Facebook & read my posts').props.onClick(); await tick();
  assert.equal(h.emitted, undefined, 'reading alone never uploads');
  find(h.render(), node => node.type === 'textarea').props.onChange({ target: { value: 'I finished my robot project. Contact edited@example.test for details.' } });
  const preview = find(h.render(), node => node.type === 'pre').props.children;
  assert.ok(!preview.includes('edited@example.test'));
  h.button('Hand over selected posts ✉').props.onClick();
  assert.equal(h.emitted.text, preview); assert.equal(h.emitted.inputKind, 'facts');
  assert.equal(h.emitted.source, 'Facebook · own posts');
  h.fail(); h.button('Read Facebook again').props.onClick(); await tick();
  assert.equal(h.button('Hand over selected posts ✉'), undefined, 'denied reconnect discards previous account draft');
});
