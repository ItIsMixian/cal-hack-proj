import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function load(path, globals = {}, dependencies = {}) {
  const exports = {};
  const js = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8').replaceAll('import.meta.env', 'testEnv'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  runInNewContext(js, { exports, URL, URLSearchParams, TextEncoder, TextDecoder, Uint8Array, atob, Date, ...globals, require(name) {
    if (name in dependencies) return dependencies[name];
    if (name.includes('/redact')) return load('../spacetimedb/src/redact.ts');
    if (name === './mobileShare') return load('../src/mobileShare.ts');
    if (name.endsWith('.css')) return {};
    return require(name);
  } }); return exports;
}
const api = load('../src/mobileShare.ts');
const now = Date.parse('2026-10-25T07:00:00Z');
const payload = (extra = {}) => ({ type: 'mirrorville.share', version: 1, kind: 'text', text: 'I have been making a small robot demo this week. Contact me@example.test.', source: 'iphone_share', createdAt: new Date(now).toISOString(), ...extra });
const fragment = value => '#mirrorville-share=' + Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
const store = () => { const map = new Map(); return { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key), map }; };
const all = (node, check) => !node || typeof node !== 'object' ? [] : [...(check(node) ? [node] : []), ...[node.props?.children].flat(Infinity).flatMap(child => all(child, check))];

test('native JSON and percent-encoded shortcut text decode as redacted drafts without fetching', () => {
  const draft = api.parseMobileShareFragment(fragment(payload()), now);
  assert.equal(draft.source, 'iphone_share'); assert.equal(draft.createdAt, payload().createdAt); assert.ok(!draft.text.includes('me@example.test'));
  const text = '我最近在做机械臂 + camera & calibration。';
  assert.equal(api.parseMobileShareFragment('#mirrorville-text=' + encodeURIComponent(text), now).text, text);
  assert.equal(api.parseMobileShareFragment('#mirrorville-text=A%2BB+C', now).text, 'A+B+C', 'plus is literal; URL encoding is not form encoding');
  const link = api.parseMobileShareFragment(fragment(payload({ kind: 'link', text: 'https://example.test/article?private=value#secret' })), now);
  assert.equal(link.kind, 'link'); assert.equal(link.linkHost, 'example.test'); assert.equal(link.text, '[link]');
});

test('malformed, oversized, unsupported, future-date and credential-link payloads reject', () => {
  for (const hash of ['#mirrorville-share=***', '#mirrorville-share=Z', '#mirrorville-share=_w', '#mirrorville-text=%E0%A4%A', fragment(payload({ version: 2 })), fragment(payload({ source: 'someone_else' })), fragment(payload({ text: 'x'.repeat(12_001) })), fragment(payload({ text: '你'.repeat(6_000) })), fragment(payload({ createdAt: '2026-02-31T07:00:00Z' })), fragment(payload({ createdAt: '2026-10-25T08:00:00Z' })), fragment(payload({ extra: 'unsupported' })), fragment(payload({ kind: 'link', text: 'javascript:alert(1)' })), fragment(payload({ kind: 'link', text: 'https://user:password@example.test/' }))]) {
    assert.throws(() => api.parseMobileShareFragment(hash, now), undefined, hash.slice(0, 40));
  }
});

test('only standalone own fragments are consumed, preserving OIDC query/hash and clearing invalid own payloads', () => {
  const changes = [], history = { replaceState: (...args) => changes.push(args[2]) };
  const location = { pathname: '/cal-hack-proj/callback', search: '?code=OIDC&state=STATE', hash: fragment(payload()) };
  assert.ok(api.consumeMobileShare(location, history, now)); assert.equal(changes[0], '/cal-hack-proj/callback?code=OIDC&state=STATE');
  for (const hash of ['#code=OIDC&state=STATE', '#state=STATE', '#mirrorville-share=abc&state=STATE', '#unknown=1']) assert.equal(api.consumeMobileShare({ ...location, hash }, history, now), null);
  assert.equal(changes.length, 1);
  assert.throws(() => api.consumeMobileShare({ ...location, hash: '#mirrorville-share=***' }, history, now)); assert.equal(changes.length, 2);
});

test('only redacted same-tab sign-in draft is cached temporarily, restored once, expired or discarded', () => {
  const storage = store(), draft = api.parseMobileShareFragment(fragment(payload()), now);
  api.rememberMobileShare(draft, storage, now);
  assert.ok(!storage.getItem(api.SHARE_DRAFT_KEY).includes('me@example.test'));
  assert.equal(api.restoreMobileShare(storage, now + 100).text, draft.text); assert.equal(storage.getItem(api.SHARE_DRAFT_KEY), null);
  api.rememberMobileShare(draft, storage, now); assert.equal(api.restoreMobileShare(storage, now + api.SHARE_DRAFT_TTL), null);
  api.rememberMobileShare(draft, storage, now); api.forgetMobileShare(storage); assert.equal(storage.getItem(api.SHARE_DRAFT_KEY), null);
  storage.setItem(api.SHARE_DRAFT_KEY, '{bad'); assert.equal(api.restoreMobileShare(storage, now), null);
});

function reviewHarness(props, owned = [{ id: 1n, name: 'Mine' }]) {
  const states = [], effects = [], calls = []; let cursor = 0, current = props;
  const react = {
    useState(initial) { const i = cursor++; if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial; return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; },
    useEffect(fn, deps) { const i = cursor++; if (!states[i] || deps.some((v, j) => v !== states[i][j])) { states[i] = deps; effects.push(fn); } },
  };
  const component = load('../src/MobileShareReview.tsx', {}, { react, 'spacetimedb/react': { useTable: () => [owned], useSpacetimeDB: () => ({ isActive: true }), useReducer: () => async gift => calls.push(gift) }, './module_bindings': { reducers: {}, tables: {} } });
  const render = name => { cursor = 0; const tree = component[name](current); while (effects.length) effects.shift()(); return tree; };
  return { render, calls, component, props(value) { current = value; } };
}

test('shared own text needs deliberate authorship/review, never learns voice or promotes receipt to event date', () => {
  let emitted, backs = 0;
  const draft = api.parseMobileShareFragment(fragment(payload()), now);
  const props = { draft, onReady: gift => { emitted = gift; }, onBack: () => backs++ };
  const h = reviewHarness(props); const tree = () => h.render('MobileShareLetter');
  const button = text => all(tree(), n => n.type === 'button' && n.props.children === text)[0];
  assert.equal(button('Hand over reviewed item ✉').props.disabled, true); assert.equal(emitted, undefined);
  all(tree(), n => n.type === 'input' && n.props.type === 'radio')[0].props.onChange();
  all(tree(), n => n.type === 'input' && n.props.type === 'checkbox')[0].props.onChange({ target: { checked: true } });
  button('Hand over reviewed item ✉').props.onClick();
  assert.equal(emitted.inputKind, 'facts'); assert.equal(emitted.latestAt, ''); assert.ok(!emitted.text.includes('me@example.test'));
  button('Keep it for later').props.onClick(); assert.equal(backs, 1);
  const next = api.parseMobileShareFragment(fragment(payload({ text: 'A different shared piece about my latest project and what I want to discuss.' })), now);
  h.props({ ...props, draft: next }); tree();
  assert.equal(button('Hand over reviewed item ✉').props.disabled, true, 'a new item must not inherit approval');
  assert.equal(all(tree(), n => n.type === 'textarea')[0].props.value, next.text);
});

test('reference quotations stay local; only separate owner meaning and link host are handed over', () => {
  let emitted;
  const draft = api.parseMobileShareFragment(fragment(payload({ kind: 'link', text: 'https://example.test/other-person-story' })), now);
  const h = reviewHarness({ draft, onReady: gift => { emitted = gift; }, onBack() {} }); const tree = () => h.render('MobileShareLetter');
  const meaning = all(tree(), n => n.type === 'textarea' && n.props['aria-label'] === 'My meaning for shared reference')[0];
  meaning.props.onChange({ target: { value: 'I am exploring robot grasping and want to discuss transparent object detection with my friends.' } });
  all(tree(), n => n.type === 'input' && n.props.type === 'checkbox')[0].props.onChange({ target: { checked: true } });
  all(tree(), n => n.type === 'button' && n.props.children === 'Hand over reviewed item ✉')[0].props.onClick();
  assert.ok(emitted.text.includes('example.test')); assert.ok(emitted.text.includes('I am exploring robot grasping'));
  assert.ok(!emitted.text.includes('other-person-story')); assert.equal(emitted.latestAt, '');
});

test('receiver imports only after selected mirror is in owner view; forged or absent selection cannot mutate', async () => {
  let completed = 0;
  const draft = api.parseMobileShareFragment(fragment(payload()), now);
  const h = reviewHarness({ draft, onDone: () => completed++, onClose() {}, onCreate() {} });
  const tree = () => h.render('default'); const gift = { text: draft.text, inputKind: 'facts', source: 'iPhone · shared item', latestAt: '', relation: 'other' };
  all(tree(), n => n.type === 'select')[0].props.onChange({ target: { value: '99' } });
  all(tree(), n => n.type === h.component.MobileShareLetter)[0].props.onReady(gift); await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.calls.length, 0);
  all(tree(), n => n.type === 'select')[0].props.onChange({ target: { value: '1' } });
  all(tree(), n => n.type === h.component.MobileShareLetter)[0].props.onReady(gift); await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.calls.length, 1); assert.equal(h.calls[0].mirrorId, 1n); assert.equal(completed, 1);
});

test('SessionRoot double initialization is pure and duplicate mount effect retains draft while removing only own fragment', () => {
  const states = [], effects = [], history = []; let cursor = 0;
  const location = { hostname: 'localhost', protocol: 'http:', host: 'localhost:5173', origin: 'http://localhost:5173', port: '5173', pathname: '/', search: '', hash: fragment(payload()) };
  const storage = store();
  const react = { useState(initial) { const i = cursor++; if (!(i in states)) { if (typeof initial === 'function') initial(); states[i] = typeof initial === 'function' ? initial() : initial; } return [states[i], v => { states[i] = typeof v === 'function' ? v(states[i]) : v; }]; }, useEffect(fn) { effects.push(fn); } };
  const root = load('../src/SessionRoot.tsx', { window: { location, history: { replaceState: (_data, _title, url) => { history.push(url); location.hash = ''; } }, addEventListener() {}, removeEventListener() {} }, sessionStorage: storage, testEnv: { BASE_URL: '/' } }, { react, 'react-oidc-context': {}, 'oidc-client-ts': {}, 'spacetimedb/react': {}, './module_bindings': {}, './guestTransfer': {}, './App': {}, './LoginScreen': {} });
  root.default(); assert.equal(history.length, 0, 'no render-time history mutation'); assert.ok(states[0].draft);
  effects[0](); effects[0](); assert.equal(history.length, 1); assert.ok(states[0].draft, 'second StrictMode effect must not discard first receive');
});
