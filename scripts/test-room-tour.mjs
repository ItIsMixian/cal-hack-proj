import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
const modules = new Map();
function load(name) {
  if (modules.has(name)) return modules.get(name);
  const exports = {};
  runInNewContext(ts.transpileModule(readFileSync(new URL(`../src/${name}.ts`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, require: id => load(id.replace('./', '')) });
  modules.set(name, exports); return exports;
}
const { roomTourKey, readRoomTour, saveRoomTour } = load('roomTour');
function storage() { const values = new Map(); return { getItem: k => values.get(k) ?? null, setItem: (k,v) => values.set(k,v), removeItem: k => values.delete(k) }; }
const draft = { version: 1, name: 'Preview', look: 2, station: 'cards', mirrorId: '9' };
test('a tour resumes its station and mirror identity across a fresh read; completion removes it', () => {
  const store = storage(), key = roomTourKey('alice', 'town');
  saveRoomTour(key, draft, store);
  assert.equal(readRoomTour(key, store).station, 'cards');
  assert.equal(readRoomTour(key, store).mirrorId, '9');
  assert.equal(readRoomTour(roomTourKey('bob', 'town'), store), null);
  assert.equal(readRoomTour(roomTourKey('alice', 'other-town'), store), null);
  saveRoomTour(key, null, store);
  assert.equal(readRoomTour(key, store), null);
});
test('invalid or unknown checkpoints cannot bypass the ordered tour', () => {
  const store = storage();
  for (const value of [{ ...draft, station: 'finished' }, { ...draft, version: 2 }, { ...draft, mirrorId: '-1' }, { ...draft, name: '' }, { ...draft, look: 99 }]) {
    store.setItem('key', JSON.stringify(value));
    assert.equal(readRoomTour('key', store), null);
  }
  store.setItem('key', '{'); assert.equal(readRoomTour('key', store), null);
});
test('missing identity and unavailable storage do not break the room', () => {
  const broken = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); }, removeItem() { throw Error('blocked'); } };
  assert.equal(roomTourKey('', 'town'), '');
  assert.equal(readRoomTour('key', broken), null);
  assert.doesNotThrow(() => saveRoomTour('key', draft, broken));
});
