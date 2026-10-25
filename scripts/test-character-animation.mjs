import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';
const exports = {};
runInNewContext(ts.transpileModule(readFileSync(new URL('../src/characterAnimation.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports });
const { characterWalkFrame, CHARACTER_FPS } = exports;

test('original 5fps animation uses stride A, idle, stride B, idle and loops', () => {
  assert.equal(CHARACTER_FPS, 5);
  assert.deepEqual([0, .2, .4, .6, .8, 1].map(t => characterWalkFrame(t, true)), [0, 1, 2, 1, 0, 1]);
  assert.equal(characterWalkFrame(.199, true), 0);
  assert.equal(characterWalkFrame(.201, true), 1);
});

test('stopping and reduced motion always hold the original idle pose', () => {
  for (const time of [0, .2, .4, .6, 8]) {
    assert.equal(characterWalkFrame(time, false), 1);
    assert.equal(characterWalkFrame(time, true, true), 1);
  }
});
