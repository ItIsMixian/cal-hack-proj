import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
const read = name => readFileSync(new URL(`../public/assets/home/${name}`, import.meta.url));
const scene = JSON.parse(read('scene.json'));
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
