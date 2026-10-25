import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const code = ts.transpileModule(readFileSync(new URL('../src/WritingDesk.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function desk() {
  let cursor = 0;
  const state = [], writes = [], exports = {};
  function Source() {}
  function Daily() {}
  runInNewContext(code, { exports, require: id => {
    if (id === 'react') return { useState: initial => {
      const index = cursor++;
      if (!(index in state)) state[index] = initial;
      return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
    } };
    if (id === 'react/jsx-runtime') return require(id);
    if (id === 'spacetimedb/react') return { useReducer: () => async value => { writes.push(value); } };
    if (id === './module_bindings') return { reducers: { importWriting: 'import' } };
    if (id === './SourceOffering') return { default: Source };
    if (id === './MirrorExchanges') return { DailyConversation: Daily };
    throw new Error(id);
  } });
  const props = { mirrorId: 9n, dailyAvailable: true, dailyCount: 0, onReview() {}, status: { id: 10n, status: 'done', source: '', message: '' } };
  const render = () => { cursor = 0; return exports.default(props); };
  return { render, props, writes, Source, Daily };
}
function elements(tree) {
  if (Array.isArray(tree)) return tree.flatMap(elements);
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...elements(tree.props?.children)];
}
function text(tree) {
  if (Array.isArray(tree)) return tree.map(text).join(' ');
  if (tree == null || typeof tree === 'boolean') return '';
  return typeof tree === 'object' ? text(tree.props?.children) : String(tree);
}
const button = (tree, label) => elements(tree).find(el => el.type === 'button' && text(el).includes(label));
const gift = { text: 'Synthetic owner update for a component test; never sent to a server.', inputKind: 'facts', relation: 'other', source: 'test', latestAt: '' };

test('new desk import waits for its subscription result instead of showing the previous success', async () => {
  const d = desk();
  button(d.render(), 'Bring a letter').props.onClick();
  elements(d.render()).find(el => el.type === d.Source).props.onReady(gift);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(d.writes.length, 1);
  assert.match(text(d.render()), /Let me get to know/);
  assert.equal(button(d.render(), 'Show me what you learned'), undefined);
  d.props.status = { ...d.props.status, id: 11n, status: 'processing' };
  assert.match(text(d.render()), /Let me get to know/);
  d.props.status = { ...d.props.status, status: 'done' };
  assert.ok(button(d.render(), 'Show me what you learned'));
});

test('failed import retains the exact gift and retry waits for a new result', async () => {
  const d = desk();
  button(d.render(), 'Bring a letter').props.onClick();
  elements(d.render()).find(el => el.type === d.Source).props.onReady(gift);
  await new Promise(resolve => setImmediate(resolve));
  d.props.status = { ...d.props.status, id: 11n, status: 'failed' };
  button(d.render(), 'Try reading it again').props.onClick();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(d.writes[1], d.writes[0]);
  assert.match(text(d.render()), /Let me get to know/);
});

test('daily question remains reachable from the same desk and returns to its choices', () => {
  const d = desk();
  button(d.render(), 'Ask me something').props.onClick();
  const question = d.render();
  assert.equal(question.type, d.Daily);
  question.props.onDone();
  assert.ok(button(d.render(), 'Bring a letter'));
  d.props.dailyAvailable = false;
  assert.equal(button(d.render(), 'Ask me something'), undefined);
});
