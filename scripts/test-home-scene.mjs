import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
const read = name => readFileSync(new URL(`../public/assets/home/${name}`, import.meta.url));
const scene = JSON.parse(read('scene.json'));

test('room delivery loads all shipped WebP files once, awaits decode and retries after errors', async () => {
  let fail = true, requests = 0, decoded = 0;
  class RoomImage {
    decode() { decoded++; return Promise.resolve(); }
    set src(url) {
      assert.equal(read(url.split('/').pop()).toString('ascii', 8, 12), 'WEBP');
      requests++;
      queueMicrotask(() => fail ? this.onerror() : this.onload());
    }
  }
  const mod = {};
  runInNewContext(ts.transpileModule(readFileSync(new URL('../src/roomArt.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, { exports: mod, require: () => scene, Image: RoomImage, setTimeout, clearTimeout });
  const failed = mod.loadRoomArt();
  assert.equal(mod.loadRoomArt(), failed);
  await assert.rejects(failed, /unavailable/);
  fail = false;
  await mod.loadRoomArt();
  await mod.loadRoomArt();
  assert.equal(requests, 10);
  assert.equal(decoded, 5);
});
test('all five room textures retain original bytes and PNG dimensions', () => {
  assert.equal(scene.nodes.length, 5);
  for (const node of scene.nodes) {
    const bytes = read(node.file);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), node.sha256);
    assert.deepEqual([bytes.readUInt32BE(16), bytes.readUInt32BE(20)], node.size);
  }
});
test('browser layout preserves every authored Home sprite transform and source order', () => {
  const source = read('Home.tscn').toString();
  const blocks = [...source.matchAll(/\[node name="([^"]+)" type="Sprite2D"[^\n]*\]([^]*?)(?=\n\[|$)/g)];
  assert.deepEqual(scene.nodes.map(n => n.name), blocks.map(m => m[1]));
  for (const [index, node] of scene.nodes.entries()) {
    for (const property of ['position', 'scale']) {
      assert.deepEqual(node[property], new RegExp(`${property} = Vector2\\(([^)]+)\\)`).exec(blocks[index][2])[1].split(',').map(Number));
    }
  }
  const runtime = JSON.parse(readFileSync(new URL('../src/homeScene.json', import.meta.url)));
  assert.deepEqual(runtime.nodes, scene.nodes.map(({ name, file, position, scale, size }) => ({ name, file, position, scale, size })));
});
