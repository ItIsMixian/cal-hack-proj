import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function loadPure(path) {
  const exports = {};
  const js = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInNewContext(js, { exports, TextDecoder, Uint8Array, require: () => loadPure('../spacetimedb/src/redact.ts') });
  return exports;
}
const find = (node, check) => {
  if (!node || typeof node !== 'object') return;
  if (check(node)) return node;
  for (const child of [node.props?.children, node.props?.activity, node.props?.naming].flat(Infinity)) { const result = find(child, check); if (result) return result; }
};
function harness(file, name, props) {
  const states = []; let cursor = 0; const calls = []; const walks = [];
  const components = { WordOffering: () => null, RoomDialog: () => null, PixelRoom: () => null, RoomJourney: () => null, CharacterPicker: () => null };
  const mock = {
    useState(initial) { const index = cursor++; if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial; return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }]; },
    useRef(initial) { const i = cursor++; if (!(i in states)) states[i] = { current: initial }; return states[i]; }, useEffect() {},
  };
  const exports = {};
  const js = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8').replaceAll('import.meta.env', 'testEnv'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  runInNewContext(js, { exports, testEnv: {}, TextDecoder, Uint8Array, navigator: { clipboard: { readText: async () => { throw new Error('blocked'); } } }, require(module) {
    if (module === 'react') return mock;
    if (module === 'react/jsx-runtime') return require(module);
    if (module === './roomJourneyMath') return loadPure('../src/roomJourneyMath.ts');
    if (module === './roomTour') return { roomTourKey: () => 'test', readRoomTour: () => null, saveRoomTour() {} };
    if (module === 'spacetimedb/react') return { useSpacetimeDB: () => ({ identity: { toHexString: () => 'test' } }), useTable: () => [[]], useReducer: () => async payload => calls.push(payload) };
    if (module === './RoomJourney') return { default: components.RoomJourney, useRoomJourney: () => ({ pose: { x: 480, y: 675, moving: false }, walkTo: async station => { walks.push(station); return true; } }) };
    if (module === './module_bindings') return { reducers: {}, tables: {} };
    if (module === './onboarding') return { ASK_YOUR_AI: 'A safe prompt' };
    if (module === './importers') return loadPure('../src/importers.ts');
    if (module.includes('/redact')) return loadPure('../spacetimedb/src/redact.ts');
    if (module.includes('/world')) return { LOOK_COLORS: ['red','blue'] };
    return { default: components[module.slice(2)] ?? (() => null) };
  } });
  const render = () => { cursor = 0; return exports[name](props); };
  return { render, calls, walks, components, button: text => find(render(), node => node.type === 'button' && [node.props.children].flat(Infinity).includes(text)) };
}

const flush = () => new Promise(resolve => setImmediate(resolve));
async function startTour(h, name) {
  const room = () => find(h.render(), node => node.type === h.components.RoomJourney);
  find(room().props.naming, node => node.type === 'input').props.onChange({ target: { value: name } });
  find(room().props.naming, node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  await flush(); return room;
}
async function advance(room) {
  find(room().props.activity, node => node.type === 'button' && node.props.className === 'tour-next').props.onClick();
  await flush();
}
test('all four furniture visits precede creation; the door cannot bypass the tour', async () => {
  let created = '';
  const h = harness('../src/CreateMirror.tsx', 'default', { onClose() {}, onCreated: name => { created = name; } });
  const room = await startTour(h, 'First walk');
  assert.equal(h.walks[0], 'desk'); assert.ok(room().props.activity); assert.equal(h.calls.length, 0);
  room().props.onStation('door'); await flush();
  assert.equal(h.walks.length, 1, 'a premature door request does nothing');
  for (const station of ['cards', 'mirror', 'diary', 'door']) {
    await advance(room); assert.equal(room().props.station, station); assert.equal(h.calls.length, 0);
  }
  h.button('Step into town →').props.onClick(); await flush();
  assert.equal(h.calls.length, 1); assert.equal(h.calls[0].text, ''); assert.equal(h.calls[0].words.length, 0);
  assert.equal(created, 'First walk');
});
test('appearance is chosen at the mirror and reaches creation unchanged', async () => {
  const h = harness('../src/CreateMirror.tsx', 'default', { onClose() {}, onCreated() {} });
  const room = await startTour(h, 'Coral preview');
  assert.equal(h.button('Change appearance'), undefined);
  await advance(room); await advance(room);
  h.button('Change appearance').props.onClick();
  find(h.render(), node => node.type === h.components.CharacterPicker).props.onChange(4);
  assert.equal(room().props.look, 4);
  await advance(room); await advance(room);
  h.button('Step into town →').props.onClick(); await flush();
  assert.equal(h.calls[0].look, 4);
});
test('closing a partial tour does not create or activate a mirror', async () => {
  let closed = false;
  const h = harness('../src/CreateMirror.tsx', 'default', { onClose() { closed = true; }, onCreated() { throw Error('unexpected'); } });
  await startTour(h, 'Paused'); h.render().props.onClose();
  assert.equal(closed, true); assert.equal(h.calls.length, 0);
});

test('an AI letter has a redacted handoff; going back to edit retains its provenance', async () => {
  let gift;
  const h = harness('../src/WordOffering.tsx', 'default', { kind: 'ai_summary', onBack() {}, onReady: value => { gift = value; } });
  await h.button('I brought the answer').props.onClick();
  await new Promise(resolve => setImmediate(resolve));
  const paper = find(h.render(), node => node.type === 'textarea' && !node.props.readOnly);
  assert.ok(paper, 'manual paste is available when clipboard access is blocked');
  paper.props.onChange({ target: { value: 'I build small garden games. I like drawing paper maps. Email me@example.test' } });
  h.button('Fold this into a letter →').props.onClick();
  h.button('Give this to my mirror').props.onClick();
  assert.equal(gift.inputKind, 'ai_summary'); assert.equal(gift.relation, 'other'); assert.ok(!gift.text.includes('me@example.test'));
  const restored = harness('../src/WordOffering.tsx', 'default', { kind: 'ai_summary', initialGift: gift, onBack() {}, onReady() {} });
  restored.button('Change the letter').props.onClick();
  assert.equal(find(restored.render(), node => node.type === 'textarea' && !node.props.readOnly).props.value, gift.text);
});

test('chat files require speaker selection; an invalid CSV cannot leave a stale letter ready', async () => {
  let gift;
  const h = harness('../src/WordOffering.tsx', 'default', { kind: 'writing', onBack() {}, onReady: value => { gift = value; } });
  const file = (name, text) => { const bytes = new TextEncoder().encode(text); return { name, size: bytes.byteLength, arrayBuffer: async () => bytes.buffer }; };
  const choose = async files => { find(h.render(), node => node.type === 'input' && node.props.type === 'file').props.onChange({ target: { files, value: '' } }); await new Promise(resolve => setImmediate(resolve)); };
  await choose([file('chat.txt', '12/31/23, 9:41 PM - Me: I build small garden games and enjoy drawing paper maps.\n12/31/23, 9:42 PM - Them: PRIVATE_OTHER_WORDS\n12/31/23, 9:43 PM - Me: I test a small version first.')]);
  assert.equal(h.button('Fold this into a letter →').props.disabled, true);
  h.button('Me').props.onClick(); h.button('Fold this into a letter →').props.onClick(); h.button('Give this to my mirror').props.onClick();
  assert.equal(gift.inputKind, 'writing'); assert.ok(!gift.text.includes('PRIVATE_OTHER_WORDS'));
  h.button('Change the letter').props.onClick();
  await choose([file('bad.csv', 'sender,body\nother,SECRET')]);
  assert.equal(h.button('Fold this into a letter →').props.disabled, true);
});
