import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function load(path, globals = {}, dependencies = {}) {
  const exports = {};
  const js = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  runInNewContext(js, { exports, AbortController, TextEncoder, setTimeout, clearTimeout, Date, ...globals, require(name) {
    if (name in dependencies) return dependencies[name];
    if (name.includes('/redact')) return load('../spacetimedb/src/redact.ts');
    if (name === './margloPackage') return load('../src/margloPackage.ts');
    return require(name);
  } });
  return exports;
}
const response = (value, status = 200) => ({ ok: status >= 200 && status < 300, status, headers: { get: () => null }, text: async () => JSON.stringify(value) });
const token = 'a'.repeat(43), at = new Date(Date.now() - 60_000).toISOString();
const packet = () => ({ type: 'mirrorville.marglo', version: 1, generatedAt: new Date().toISOString(), items: [{ id: 'editor_robot', kind: 'observation', text: 'Observed work in an editor on a robot project; this does not establish completion.', startAt: at, endAt: at, provenance: 'desktop_activity', status: 'tentative' }] });
const all = (node, check) => !node || typeof node !== 'object' ? [] : [...(check(node) ? [node] : []), ...[node.props?.children].flat(Infinity).flatMap(child => all(child, check))];
const tick = () => new Promise(resolve => setImmediate(resolve));

test('desktop client uses only fixed loopback, memory bearer header, no credentials or redirects', async () => {
  const calls = [];
  const api = load('../src/desktopObserver.ts', { fetch: async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/health')) return response({ service: 'mirrorville-desktop', version: 1 });
    if (url.endsWith('/pair')) return response({ token });
    if (url.endsWith('/status')) return response({ enabled: false, observations: 1, browserTopics: false });
    if (url.endsWith('/observations')) return response(packet());
    return response({ ok: true });
  } });
  await api.findDesktopObserver();
  assert.equal(await api.pairDesktopObserver('123456'), token);
  assert.equal((await api.desktopStatus(token)).enabled, false);
  assert.equal((await api.desktopObservations(token)).items.length, 1);
  await api.setDesktopCapture(token, true, false);
  await api.clearDesktopObservations(token);
  await api.disconnectDesktopObserver(token);
  for (const { url, options } of calls) {
    assert.match(url, /^http:\/\/127\.0\.0\.1:17358\/(health|pair|status|observations|capture|clear|disconnect)$/);
    assert.ok(!url.includes(token)); assert.equal(options.credentials, 'omit'); assert.equal(options.redirect, 'error');
    assert.equal(options.referrerPolicy, 'no-referrer'); assert.equal(options.cache, 'no-store');
  }
  assert.equal(calls[0].options.headers.Authorization, undefined);
  assert.equal(calls[2].options.headers.Authorization, `Bearer ${token}`);
  assert.deepEqual(JSON.parse(calls[4].options.body), { enabled: true, browserTopics: false });
});

test('unexpected services, pairing/session/status shapes and untrusted observations fail closed', async () => {
  let value = {}, requests = 0;
  const api = load('../src/desktopObserver.ts', { fetch: async () => { requests++; return response(value); } });
  await assert.rejects(api.findDesktopObserver(), /not a supported/);
  await assert.rejects(api.pairDesktopObserver('bad'), /pairing code/); assert.equal(requests, 1);
  await assert.rejects(api.pairDesktopObserver('123456'), /invalid pairing/);
  value = { enabled: 'true', observations: 1 }; await assert.rejects(api.desktopStatus(token), /invalid status/);
  value = { enabled: false, observations: -1 }; await assert.rejects(api.desktopStatus(token), /invalid status/);
  value = { enabled: true, observations: 4_999, browserTopics: false }; assert.equal((await api.desktopStatus(token)).observations, 4_999);
  value = packet(); value.items[0].status = 'confirmed'; await assert.rejects(api.desktopObservations(token), /invalid observations/);
});

test('unauthorized/rate-limit/network/oversized responses are actionable without leaking remote details', async () => {
  let status = 401;
  const api = load('../src/desktopObserver.ts', { fetch: async () => response({ secret: token }, status) });
  await assert.rejects(api.desktopStatus(token), error => error.unauthorized === true && !error.message.includes(token));
  status = 403; await assert.rejects(api.pairDesktopObserver('123456'), /did not allow/);
  status = 429; await assert.rejects(api.pairDesktopObserver('123456'), /Too many/);
  const large = load('../src/desktopObserver.ts', { fetch: async () => response({ blob: 'x'.repeat(256_001) }) });
  await assert.rejects(large.findDesktopObserver(), /too large/);
  const offline = load('../src/desktopObserver.ts', { fetch: async () => { throw new Error(`RAW_PRIVATE_${token}`); } });
  await assert.rejects(offline.findDesktopObserver(), error => /local-network access/.test(error.message) && !error.message.includes(token));
});

test('deadline and caller cancellation stop local requests', async () => {
  let timeout;
  const api = load('../src/desktopObserver.ts', { setTimeout: fn => { timeout = fn; return 1; }, clearTimeout() {}, fetch: async (_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })) });
  const hanging = api.findDesktopObserver(); timeout(); await assert.rejects(hanging, /Could not reach/);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(api.findDesktopObserver(controller.signal), /cancelled/);
});

function uiHarness() {
  const states = [], effects = [], intervals = new Map(), calls = []; let cursor = 0, nextInterval = 0, enabled = false, topics = false, contents = packet(), emitted;
  const mock = {
    useState(initial) { const i = cursor++; if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial; return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; },
    useRef(initial) { const i = cursor++; if (!(i in states)) states[i] = { current: initial }; return states[i]; },
    useEffect(fn, deps) { const i = cursor++; const old = states[i]; if (!old || deps?.some((v, j) => v !== old.deps[j])) { states[i] = { deps, cleanup: old?.cleanup }; effects.push(() => { old?.cleanup?.(); states[i].cleanup = fn(); }); } },
  };
  const realApi = load('../src/desktopObserver.ts');
  const api = {
    DesktopBridgeError: realApi.DesktopBridgeError,
    findDesktopObserver: async () => { calls.push('find'); },
    pairDesktopObserver: async code => { calls.push(['pair', code]); return token; },
    desktopStatus: async () => ({ enabled, browserTopics: topics, observations: contents.items.length }),
    desktopObservations: async () => contents,
    setDesktopCapture: async (_token, value, browserTopics) => { calls.push(['capture', value, browserTopics]); enabled = value; topics = browserTopics; },
    clearDesktopObservations: async () => { calls.push('clear'); contents = { ...packet(), items: [] }; enabled = false; },
    disconnectDesktopObserver: async () => { calls.push('disconnect'); enabled = false; },
  };
  const component = load('../src/DesktopObservationOffering.tsx', { window: { location: { origin: 'http://localhost:5173' } }, setInterval: fn => { const id = ++nextInterval; intervals.set(id, fn); return id; }, clearInterval: id => intervals.delete(id) }, { react: mock, './desktopObserver': api });
  const render = () => { cursor = 0; return component.default({ busy: false, onBack() {}, onReady: gift => { emitted = gift; } }); };
  const settle = async () => { render(); while (effects.length) effects.shift()(); await tick(); render(); };
  const button = text => all(render(), node => node.type === 'button' && node.props.children === text)[0];
  return { render, settle, button, calls, get emitted() { return emitted; }, async poll() { for (const fn of intervals.values()) await fn(); await tick(); }, next(value) { contents = value; }, close() { for (const state of states) state?.cleanup?.(); } };
}

test('UI pairs paused, explicitly enables capture, reviews local edits, never uploads automatically', async () => {
  const h = uiHarness(); await h.settle(); assert.equal(h.calls.length, 0);
  h.button('Find my desktop companion').props.onClick(); await h.settle();
  all(h.render(), n => n.type === 'input' && n.props['aria-label'] === 'Desktop companion pairing code')[0].props.onChange({ target: { value: '123456' } });
  h.button('Pair this browser').props.onClick(); await h.settle(); await h.settle();
  assert.ok(all(h.render(), n => n.props?.role === 'status' && n.props.children === 'Connected · observation paused').length);
  assert.equal(h.emitted, undefined);
  assert.equal(h.button('Hand over reviewed clues ✉').props.disabled, true);
  h.button('Start observation').props.onClick(); await h.settle();
  assert.ok(h.calls.some(value => Array.isArray(value) && value[0] === 'capture' && value[1] === true && value[2] === false));
  const edit = all(h.render(), n => n.type === 'textarea')[0];
  edit.props.onChange({ target: { value: 'I spent time on my robot project. Email owner@example.test, but I have not finished.' } });
  all(h.render(), n => n.type === 'input' && n.props.type === 'checkbox')[1].props.onChange({ target: { checked: true } });
  const changed = packet(); changed.items[0].text = 'NEW_AUTOMATIC_OBSERVATION'; h.next(changed); await h.poll();
  assert.match(all(h.render(), n => n.type === 'textarea')[0].props.value, /I spent time/);
  h.button('Hand over reviewed clues ✉').props.onClick();
  assert.equal(h.emitted.source, 'Desktop · reviewed observations'); assert.equal(h.emitted.inputKind, 'facts');
  assert.ok(!h.emitted.text.includes('owner@example.test')); assert.ok(h.emitted.text.startsWith('[Mirrorville desktop ·'));
  h.close(); assert.ok(!h.calls.includes('disconnect'), 'closing the UI does not silently stop the opted-in helper');
});

test('UI clear/disconnect explicitly pause and discard displayed local candidates', async () => {
  const h = uiHarness(); await h.settle(); h.button('Find my desktop companion').props.onClick(); await h.settle();
  all(h.render(), n => n.type === 'input')[0].props.onChange({ target: { value: '123456' } });
  h.button('Pair this browser').props.onClick(); await h.settle(); await h.settle();
  h.button('Clear local clues & pause').props.onClick(); await h.settle();
  assert.equal(all(h.render(), n => n.type === 'textarea').length, 0); assert.ok(h.calls.includes('clear'));
  h.button('Disconnect & pause').props.onClick(); await h.settle();
  assert.ok(h.calls.includes('disconnect')); assert.ok(h.button('Find my desktop companion'));
  assert.equal(h.emitted, undefined); h.close();
});

test('live reordering with stable clue IDs never transfers review permission to a new clue', async () => {
  const h = uiHarness(); await h.settle(); h.button('Find my desktop companion').props.onClick(); await h.settle();
  all(h.render(), n => n.type === 'input')[0].props.onChange({ target: { value: '123456' } });
  h.button('Pair this browser').props.onClick(); await h.settle(); await h.settle();
  all(h.render(), n => n.type === 'input' && n.props.type === 'checkbox')[1].props.onChange({ target: { checked: true } });
  const next = packet(); next.items.unshift({ ...next.items[0], id: 'editor_other', text: 'UNREVIEWED_OTHER_CONTEXT' });
  next.items[1].text = 'AUTOMATIC_UPDATED_ROBOT_CONTEXT'; h.next(next); await h.poll();
  const checkboxes = all(h.render(), n => n.type === 'input' && n.props.type === 'checkbox');
  assert.equal(checkboxes[1].props.checked, false); assert.equal(checkboxes[2].props.checked, true);
  h.button('Hand over reviewed clues ✉').props.onClick();
  assert.ok(!h.emitted.text.includes('UNREVIEWED_OTHER_CONTEXT'));
  assert.ok(!h.emitted.text.includes('AUTOMATIC_UPDATED_ROBOT_CONTEXT'), 'already reviewed snapshot stays fixed');
  h.close();
});
