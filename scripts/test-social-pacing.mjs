import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../spacetimedb/src/index.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('index.ts', source, ts.ScriptTarget.Latest, true);
const names = ['MINUTE', 'FIRST_CHAT_WAIT', 'CHAT_COOLDOWN', 'SOCIAL_WINDOW', 'MAX_CHATS_PER_WINDOW', 'socialHistory', 'readyToChat', 'hasNewConversationMaterial'];
const code = ast.statements.filter(node => names.includes(node.name?.text)
  || (ts.isVariableStatement(node) && names.includes(node.declarationList.declarations[0].name.text)))
  .map(node => node.getText(ast)).join('\n');
const exports = {};
runInNewContext(ts.transpileModule(`${code}\nexport { socialHistory, readyToChat, hasNewConversationMaterial };`, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports });
const minute = 60_000_000n;
const now = 3000n * minute;
const conversation = (minutesAgo, a = 1n, b = 2n) => ({ a, b, startedAt: { microsSinceUnixEpoch: now - BigInt(minutesAgo) * minute } });

test('new arrivals keep their first 45-second opportunity', () => {
  assert.equal(exports.readyToChat(now, now - 44_000_000n, undefined), false);
  assert.equal(exports.readyToChat(now, now - 45_000_000n, undefined), true);
});
test('established residents rest five minutes even when their history is old', () => {
  const count = exports.socialHistory([conversation(1441)], now).get(1n);
  assert.equal(count, 0);
  assert.equal(exports.readyToChat(now, now - 4n * minute, count), false);
  assert.equal(exports.readyToChat(now, now - 5n * minute, count), true);
});
test('three starts in a rolling 24 hours block more chats for both participants', () => {
  const counts = exports.socialHistory([conversation(5), conversation(12), conversation(25)], now);
  for (const id of [1n, 2n]) {
    assert.equal(counts.get(id), 3);
    assert.equal(exports.readyToChat(now, now - 5n * minute, counts.get(id)), false);
  }
});
test('window expiry releases capacity and does not affect unrelated residents', () => {
  const counts = exports.socialHistory([conversation(5), conversation(12), conversation(1440), conversation(1, 3n, 4n)], now);
  assert.equal(counts.get(1n), 2);
  assert.equal(counts.get(3n), 1);
  assert.equal(counts.get(9n), undefined);
  assert.equal(exports.readyToChat(now, now - 5n * minute, counts.get(1n)), true);
});

test('unchanged, removed, or reordered material cannot trigger another exchange', () => {
  const seen = ['1:robot project', '2:camera calibration'];
  assert.equal(exports.hasNewConversationMaterial(seen, seen), false);
  assert.equal(exports.hasNewConversationMaterial([...seen].reverse(), seen), false);
  assert.equal(exports.hasNewConversationMaterial([seen[0]], seen), false);
  assert.equal(exports.hasNewConversationMaterial([...seen, '1:grasp testing'], seen), true);
  assert.equal(exports.hasNewConversationMaterial([], []), false);
});
