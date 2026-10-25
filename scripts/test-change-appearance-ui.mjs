import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const find = (node, predicate) => {
  if (!node || typeof node !== 'object') return;
  if (predicate(node)) return node;
  for (const child of [node.props?.children].flat(Infinity)) { const result = find(child, predicate); if (result) return result; }
};
function fixture(savedLook = 1) {
  const states = [], calls = [];
  let cursor = 0, closed = 0, next = Promise.resolve();
  const Picker = () => null, exports = {};
  const source = ts.transpileModule(readFileSync(new URL('../src/ChangeAppearanceDialog.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  runInNewContext(source, { exports, Error, require(name) {
    if (name === 'react') return { useState(value) { const i = cursor++; if (!(i in states)) states[i] = value; return [states[i], v => states[i] = v]; } };
    if (name === 'react/jsx-runtime') return require(name);
    if (name === 'spacetimedb/react') return { useReducer: () => args => { calls.push(args); return next; } };
    if (name === './module_bindings') return { reducers: { setAppearance: {} } };
    return { default: name === './CharacterPicker' ? Picker : () => null };
  } });
  const render = () => { cursor = 0; return exports.default({ mirrorId: 10n, name: 'Owner', savedLook, onClose: () => closed++ }); };
  return { render, calls, get closed() { return closed; },
    picker: () => find(render(), node => node.type === Picker),
    button: text => find(render(), node => node.type === 'button' && node.props.children === text),
    defer() { let resolve, reject; next = new Promise((a, b) => { resolve = a; reject = b; }); return { resolve, reject }; },
  };
}
const tick = () => new Promise(resolve => setImmediate(resolve));

test('appearance preview is local until save; cancel sends no reducer request', () => {
  const f = fixture();
  assert.equal(f.button('Save appearance').props.disabled, true);
  f.picker().props.onChange(4);
  assert.equal(f.picker().props.look, 4); assert.equal(f.calls.length, 0);
  f.button('Cancel').props.onClick();
  assert.equal(f.closed, 1); assert.equal(f.calls.length, 0);
});

test('save locks controls and closes only after acknowledgment with the exact owner mirror ID', async () => {
  const f = fixture(), pending = f.defer();
  f.picker().props.onChange(2); f.button('Save appearance').props.onClick();
  assert.equal(f.calls[0].mirrorId, 10n); assert.equal(f.calls[0].look, 2);
  assert.equal(f.picker().props.disabled, true); assert.equal(f.button('Cancel').props.disabled, true);
  f.render().props.onClose(); assert.equal(f.closed, 0);
  pending.resolve(); await tick(); assert.equal(f.closed, 1);
});

test('save errors preserve preview for retry; legacy looks display Original without silently saving', async () => {
  const f = fixture(7), pending = f.defer();
  assert.equal(f.picker().props.look, 0); assert.equal(f.button('Save appearance').props.disabled, true);
  f.picker().props.onChange(4); f.button('Save appearance').props.onClick();
  pending.reject(new Error('Connection lost')); await tick();
  assert.equal(f.closed, 0); assert.equal(f.picker().props.look, 4);
  assert.equal(find(f.render(), node => node.props?.role === 'alert').props.children, 'Connection lost');
  assert.equal(f.button('Save appearance').props.disabled, false);
  const retry = f.defer(); f.button('Save appearance').props.onClick(); retry.resolve(); await tick();
  assert.equal(f.calls.length, 2); assert.equal(f.closed, 1);
});
