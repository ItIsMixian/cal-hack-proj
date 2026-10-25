import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function load(file) {
  const exports = {};
  const js = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInNewContext(js, { exports, TextEncoder, require: () => load('../spacetimedb/src/redact.ts') });
  return exports;
}
const api = load('../src/margloPackage.ts');
const now = Date.parse('2026-10-24T18:00:00Z');
const item = (changes = {}) => ({ id: 'activity_1', kind: 'observation', text: 'My computer recorded about 120 minutes with a code editor. Contact me@example.test.', startAt: '2026-10-23T10:00:00Z', endAt: '2026-10-23T12:00:00Z', provenance: 'desktop_activity', status: 'tentative', ...changes });
const pack = (items = [item()], changes = {}) => ({ type: 'mirrorville.marglo', version: 1, generatedAt: '2026-10-24T12:00:00Z', items, ...changes });

test('package parser validates provenance, bounds, times and strips contact details', () => {
  const p = api.parseMargloPackage(JSON.stringify(pack()), now);
  assert.ok(!p.items[0].text.includes('me@example.test'));
  for (const value of [pack([], { version: 2 }), pack([], { generatedAt: '2027-01-01T00:00:00Z' }), pack([item({ startAt: '2026-10-24T00:00:00Z' })]), pack([item(), item()]), pack([item({ status: 'confirmed' })]), pack([item({ title: 'RAW_PRIVATE_TITLE' })]), pack(Array.from({ length: 61 }, (_, i) => item({ id: `a_${i}` })))]) assert.throws(() => api.parseMargloPackage(JSON.stringify(value), now));
  assert.throws(() => api.parseMargloPackage('not JSON', now));
  assert.throws(() => api.parseMargloPackage(JSON.stringify(pack([item({ startAt: '2026-02-31T00:00:00Z' })])), now));
  assert.throws(() => api.parseMargloPackage(' '.repeat(256001), now));
});

test('only owner-checked items leave; edits are re-redacted and undated context stays undated', () => {
  const context = item({ id: 'context_projects', kind: 'background', provenance: 'selected_context', startAt: null, endAt: null, text: 'I am building a small robot project and preparing a demonstration.' });
  assert.equal(api.margloLetter([context, item()], []).text, '');
  const onlyContext = api.margloLetter([context, item()], [context.id]);
  assert.equal(onlyContext.latestAt, '');
  assert.match(onlyContext.text, /Date unknown/);
  const updated = item({ text: 'I used my editor to work on a robot. Reach me at updated@example.test.' });
  const letter = api.margloLetter([context, updated], [context.id, updated.id]);
  assert.ok(!letter.text.includes('updated@example.test'));
  assert.match(letter.text, /October 23, 2026/);
  assert.equal(letter.latestAt, updated.endAt);
  assert.equal(letter.included, 2);
});

test('letter limit keeps whole pieces and counts real body instead of headers', () => {
  const many = Array.from({ length: 60 }, (_, i) => item({ id: `a_${i}`, text: 'x'.repeat(2000) }));
  const letter = api.margloLetter(many, many.map(i => i.id));
  assert.ok(letter.text.length <= 29000);
  assert.ok(letter.included < 60);
  assert.equal(letter.characters, letter.included * 2000);
  assert.equal(api.margloLetter([item({ text: 'x' })], ['activity_1']).characters, 1);
});

test('component never auto-submits; explicit confirmation required and edits clear it', async () => {
  const states = []; let cursor = 0, emitted;
  const react = { useState(initial) { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], v => { states[i] = typeof v === 'function' ? v(states[i]) : v; }]; } };
  const exports = {};
  const js = ts.transpileModule(readFileSync(new URL('../src/MargloOffering.tsx', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  runInNewContext(js, { exports, require(name) { if (name === 'react') return react; if (name === './margloPackage') return api; if (name === 'react/jsx-runtime') return require(name); throw new Error(name); } });
  const render = () => { cursor = 0; return exports.default({ busy: false, onBack() {}, onReady(gift) { emitted = gift; } }); };
  const find = (node, check) => { if (!node || typeof node !== 'object') return; if (check(node)) return node; for (const child of [node.props?.children].flat(Infinity)) { const r = find(child, check); if (r) return r; } };
  const fileInput = find(render(), node => node.type === 'input' && node.props.type === 'file');
  fileInput.props.onChange({ target: { value: '', files: [{ size: 500, text: async () => JSON.stringify({ ...pack(), generatedAt: '2020-01-01T00:00:00Z', items: [item({ startAt: '2020-01-01T00:00:00Z', endAt: '2020-01-01T01:00:00Z' })] }) }] } });
  await new Promise(resolve => setImmediate(resolve));
  const send = () => find(render(), node => node.type === 'button' && node.props.children === 'Hand over reviewed pieces ✉');
  assert.equal(emitted, undefined);
  assert.equal(send().props.disabled, true);
  const check = () => find(render(), node => node.type === 'input' && node.props.type === 'checkbox');
  check().props.onChange({ target: { checked: true } });
  assert.equal(send().props.disabled, false);
  find(render(), node => node.type === 'textarea').props.onChange({ target: { value: 'I worked on my robot project and would like to share the progress with friends.' } });
  assert.equal(send().props.disabled, true);
  check().props.onChange({ target: { checked: true } });
  send().props.onClick();
  assert.equal(emitted.inputKind, 'facts');
  assert.equal(emitted.source, 'Marglo · reviewed package');
});
