import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const all = (node, check) => {
  if (!node || typeof node !== 'object') return [];
  return [...(check(node) ? [node] : []), ...[node.props?.children].flat(Infinity).flatMap(child => all(child, check))];
};
function harness(props = {}) {
  const states = []; let cursor = 0; const gifts = []; let backs = 0;
  const components = Object.fromEntries(['WordOffering', 'GitHubOffering', 'DesktopObservationOffering'].map(name => [name, () => null]));
  const exports = {};
  const js = ts.transpileModule(readFileSync(new URL('../src/SourceOffering.tsx', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  runInNewContext(js, { exports, require(name) {
    if (name === 'react') return { useState(initial) { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; } };
    if (name === 'react/jsx-runtime') return require(name);
    return { default: components[name.slice(2)] };
  } });
  const render = () => { cursor = 0; return exports.default({ onReady: gift => gifts.push(gift), onBack: () => backs++, ...props }); };
  const button = text => all(render(), node => node.type === 'button' && all(node, n => n.type === 'span' && n.props.children === text).length)[0]
    ?? all(render(), node => node.type === 'button' && node.props.children === text)[0];
  const component = name => all(render(), node => node.type === components[name])[0];
  return { render, button, component, gifts, get backs() { return backs; } };
}

test('the same paper offers four sources without reading or handing over on selection', () => {
  const h = harness();
  for (const [title, component] of [['Observe my computer', 'DesktopObservationOffering'], ['GitHub projects', 'GitHubOffering'], ['My AI’s introduction', 'WordOffering'], ['My own update', 'WordOffering']]) {
    h.button(title).props.onClick();
    assert.ok(h.component(component), title);
    assert.equal(h.gifts.length, 0);
    h.component(component).props.onBack();
    assert.ok(h.button('GitHub projects'));
  }
  h.button('Put the letters away').props.onClick();
  assert.equal(h.backs, 1);
});

test('manual drafts remain mounted and separate while network adapters close on Back', () => {
  const h = harness();
  h.button('My own update').props.onClick();
  const writing = h.component('WordOffering');
  assert.equal(writing.props.kind, 'writing');
  writing.props.onBack();
  const hidden = all(h.render(), n => n.props?.className === 'source-panel')[0];
  assert.equal(hidden.props.hidden, true);
  assert.equal(h.component('WordOffering').type, writing.type);
  h.button('My AI’s introduction').props.onClick();
  const panels = all(h.render(), n => n.props?.className === 'source-panel');
  assert.equal(panels.length, 2);
  assert.equal(panels.filter(p => !p.props.hidden)[0].props.children.props.kind, 'ai_summary');
  panels.filter(p => !p.props.hidden)[0].props.children.props.onBack();
  h.button('GitHub projects').props.onClick();
  h.component('GitHubOffering').props.onBack();
  assert.equal(h.component('GitHubOffering'), undefined);
});

test('explicit adapter handoff preserves provenance, uncertainty text, dates and facts kind unchanged', () => {
  const h = harness();
  h.button('Observe my computer').props.onClick();
  const gift = { source: 'Desktop · reviewed observations', text: '[Observed October 24, 2026; owner reviewed]\nI spent time on my robot project; this does not prove it was finished.', latestAt: '2026-10-24T12:00:00.000Z', inputKind: 'facts', relation: 'other' };
  h.component('DesktopObservationOffering').props.onReady(gift);
  assert.equal(h.gifts.length, 1);
  assert.equal(h.gifts[0], gift);
  assert.equal(all(h.render(), n => n.type === 'pre')[0].props.children, gift.text);
  h.button('Hand over this letter ✉').props.onClick();
  assert.equal(h.gifts[1], gift, 'retry uses the same reviewed letter');
  h.button('Choose another source').props.onClick();
  assert.equal(all(h.render(), n => n.type === 'pre').length, 0);
  assert.ok(h.button('GitHub projects'));
});

test('a restored failed letter is explicit, retryable and never automatically submitted', () => {
  const gift = { source: 'GitHub · public projects & activity', text: '[Project background, created October 12, 2020]\nI own a public robot project.', latestAt: '', inputKind: 'facts', relation: 'other' };
  const h = harness({ initialGift: gift, busy: true });
  assert.equal(h.gifts.length, 0);
  assert.equal(h.button('Hand over this letter ✉').props.disabled, true);
  assert.equal(h.button('Choose another source').props.disabled, true);
  assert.equal(all(h.render(), n => n.type === 'pre')[0].props.children, gift.text);
});
