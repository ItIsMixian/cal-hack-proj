import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';

function loader({ fail = false, invalid = false } = {}) {
  const exports = {};
  const images = [];
  class Image {
    naturalWidth = invalid ? 1 : 128;
    naturalHeight = 96;
    set src(value) { this.url = value; images.push(this); queueMicrotask(() => fail ? this.onerror() : this.onload()); }
    get src() { return this.url; }
  }
  const source = readFileSync(new URL('../src/characterSprites.ts', import.meta.url), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInNewContext(js.replaceAll('import.meta.env.BASE_URL', "'/cal-hack-proj/'"), { exports, Image });
  return { api: exports, images, recover() { fail = false; invalid = false; } };
}

test('all four approved atlases load under a hosted base path; legacy looks retain original fallback', async () => {
  const { api, images } = loader();
  const original = {};
  assert.equal(api.characterSheet(2, original), original);
  await Promise.all([api.loadCharacterSheets(), api.loadCharacterSheets()]);
  assert.equal(images.length, 4);
  for (let id = 1; id <= 4; id++) assert.equal(api.characterSheet(id, original), images[id - 1]);
  for (const id of [0, 5, 6, 7, 255]) assert.equal(api.characterSheet(id, original), original);
  assert.match(api.characterSheetUrl(4), /^\/cal-hack-proj\/assets\/characters\/mirrorville-coral.png$/);
  for (const name of ['rust', 'sage', 'honey', 'coral']) {
    const data = readFileSync(new URL(`../public/assets/characters/mirrorville-${name}.png`, import.meta.url));
    assert.equal(data.readUInt32BE(16), 128); assert.equal(data.readUInt32BE(20), 96);
    assert.ok(data.length < 12_000);
  }
});

for (const kind of ['fail', 'invalid']) test(`${kind} artwork keeps fallback and can retry successfully`, async () => {
  const { api, recover } = loader({ [kind]: true });
  await assert.rejects(api.loadCharacterSheets());
  const original = {};
  assert.equal(api.characterSheet(1, original), original);
  recover(); await api.loadCharacterSheets();
  assert.notEqual(api.characterSheet(1, original), original);
});
