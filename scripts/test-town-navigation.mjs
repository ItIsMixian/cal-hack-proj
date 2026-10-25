import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';
const grid = JSON.parse(readFileSync(new URL('../src/townNavigation.json', import.meta.url)));
const mod = {};
runInNewContext(ts.transpileModule(readFileSync(new URL('../src/TownNavigation.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, { exports: mod, require: () => grid });
const venues = [[511, 307], [286, 385], [721, 424], [153, 574], [220, 237], [799, 484]].map(([x, y]) => ({ x: x / 24, y: y / 24 }));
test('every venue pair has a connected path entirely on collision-free terrain', () => {
  for (const from of venues) for (const to of venues) {
    const path = mod.findTownPath(from, to);
    assert.ok(path.length);
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1], b = path[i];
      const samples = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 48);
      for (let j = 0; j <= samples; j++) {
        assert.ok(mod.isWalkable({ x: a.x + (b.x - a.x) * j / samples, y: a.y + (b.y - a.y) * j / samples }));
      }
    }
  }
});
test('building centers, park water and off-map clouds are blocked', () => {
  for (const [x, y] of [[286, 300], [511, 230], [153, 440], [680, 540], [20, 650]]) {
    assert.equal(mod.isWalkable({ x: x / 24, y: y / 24 }), false, `${x},${y}`);
  }
});
test('walking consumes the same distance budget at corners and different frame rates', () => {
  const path = [{ x: 0.5, y: 0 }, { x: 0.5, y: 10 }];
  for (const fps of [30, 60, 120]) {
    let p = { x: 0, y: 0 }, index = 0;
    for (let i = 0; i < fps; i++) { const r = mod.walkTownPath(p, path, index, 1 / fps); p = r.position; index = r.index; }
    assert.ok(Math.abs(p.x - 0.5) < 1e-8 && Math.abs(p.y - 1.3) < 1e-8);
  }
});

