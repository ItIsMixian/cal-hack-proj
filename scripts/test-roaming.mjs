import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Run the actual private selector and helpers, without exporting test-only API
// from the database module or reimplementing its destination policy.
const source = readFileSync(new URL('../spacetimedb/src/index.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('index.ts', source, ts.ScriptTarget.Latest, true);
const helpers = ['micros', 'pick', 'choosePlace'].map(name => {
  const node = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === name);
  assert.ok(node, `Missing module function ${name}`);
  return node.getText(ast);
}).join('\n');
const world = readFileSync(new URL('../spacetimedb/src/world.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(`${world}\n${helpers}\nexport { choosePlace };`, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports = {};
runInNewContext(js, { exports });
const me = { id: 1n, intent: '', landmark: 'park', extraversion: 0.5, place: 'park', activity: 'sitting on a bench' };
function context(rows, { hour = 14, roll = 0.5, pick = 0 } = {}) {
  const random = () => roll;
  random.integerInRange = (min, max) => Math.min(max, Math.max(min, pick));
  return { random, db: { mirror: { iter: () => rows.values() } },
    timestamp: { microsSinceUnixEpoch: exports.GAME_EPOCH_MICROS + BigInt(Math.round(((hour - 8 + 24) % 24) * exports.GAME_DAY_SECONDS / 24)) * 1_000_000n } };
}
test('empty intent leaves an isolated park for an occupied destination without inventing an intent', () => {
  const rows = [me, { id: 2n, place: 'cafe', activity: 'reading' }];
  assert.equal(exports.choosePlace(context(rows), me), 'cafe');
  assert.equal(me.intent, '');
});
test('whitespace intent also explores occupied destinations', () => {
  assert.equal(exports.choosePlace(context([me, { id: 2n, place: 'food', activity: 'eating noodles' }]), { ...me, intent: '  ' }), 'food');
});
test('self and mirrors still walking to a destination are not treated as company there', () => {
  const rows = [me, { id: 2n, place: 'food', activity: 'walking' }, { id: 3n, place: 'gym', activity: 'stretching' }];
  assert.equal(exports.choosePlace(context(rows), me), 'gym');
});
test('a lone mirror can explore another landmark rather than selecting itself', () => {
  assert.equal(exports.choosePlace(context([me], { pick: 1 }), me), 'cafe');
});
test('explicit intent retains its existing home-place preference', () => {
  assert.equal(exports.choosePlace(context([me], { roll: 0.2 }), { ...me, intent: 'Go to the gym', landmark: 'gym' }), 'gym');
});
test('daily event attraction still applies to mirrors with no intent', () => {
  assert.equal(exports.choosePlace(context([me], { hour: 15, roll: 0 }), me), 'cafe');
});


test('town clock advances independently through a 45-minute shared day', () => {
  assert.equal(exports.townHour(exports.GAME_EPOCH_MICROS), 8);
  assert.equal(exports.townHour(exports.GAME_EPOCH_MICROS + BigInt(exports.GAME_DAY_SECONDS / 2) * 1_000_000n), 20);
  assert.equal(exports.townHour(exports.GAME_EPOCH_MICROS + BigInt(exports.GAME_DAY_SECONDS) * 1_000_000n), 8);
});
