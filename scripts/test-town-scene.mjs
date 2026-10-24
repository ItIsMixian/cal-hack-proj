import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';

const asset = name => readFileSync(new URL(`../public/assets/town/${name}`, import.meta.url));
const scene = JSON.parse(asset('scene.json'));
const source = asset('Town-map.tscn').toString();
test('all authored sprites and packed TileMap cells survive conversion', () => {
  assert.deepEqual(scene.nodes.map(n => n.name), [...source.matchAll(/\[node name="([^"]+)"/g)].slice(1).map(m => m[1]));
  const layers = scene.nodes.filter(n => n.type === 'tiles');
  assert.deepEqual(layers.map(n => n.name), ['House', 'Decoration']);
  const buffers = [...source.matchAll(/PackedByteArray\("([^"]+)"\)/g)].map(m => Buffer.from(m[1], 'base64'));
  for (const [index, layer] of layers.entries()) {
    const bytes = buffers[index];
    assert.equal(layer.cells.length, (bytes.length - 2) / 12);
    for (const [i, cell] of layer.cells.entries()) {
      const offset = 2 + i * 12;
      assert.equal(cell.x, bytes.readInt16LE(offset));
      assert.equal(cell.y, bytes.readInt16LE(offset + 2));
      assert.equal(cell.ax, bytes.readUInt16LE(offset + 6));
      assert.equal(cell.ay, bytes.readUInt16LE(offset + 8));
    }
  }
  assert.equal(layers.reduce((n, layer) => n + layer.cells.length, 0), 220);
});
test('all texture copies retain original bytes', () => {
  const provenance = JSON.parse(asset('sources.json'));
  assert.equal(provenance.textures.length, 11);
  for (const file of provenance.textures) assert.equal(createHash('sha256').update(asset(file.file)).digest('hex'), file.sha256);
});

const world = readFileSync(new URL('../spacetimedb/src/world.ts', import.meta.url), 'utf8');
const projection = readFileSync(new URL('../src/AuthoredTown.ts', import.meta.url), 'utf8').replace(/import .*?;\r?\n/, '');
const exports = {};
runInNewContext(ts.transpileModule(`${world}\n${projection}`, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports });
test('projection remains finite, in view and continuous throughout the server world', () => {
  for (let x = 0; x <= 40; x += 0.2) for (let y = 0; y <= 28; y += 0.2) {
    const p = exports.projectTownPosition(x, y);
    assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
    assert.ok(p.x * 24 > 24 && p.x * 24 < 936 && p.y * 24 > 48 && p.y * 24 < 624);
    const next = exports.projectTownPosition(x + 0.001, y + 0.001);
    assert.ok(Math.hypot(next.x - p.x, next.y - p.y) * 24 < 2, 'no region-boundary jumps');
  }
});

const cameraExports = {};
runInNewContext(ts.transpileModule(readFileSync(new URL('../src/TownCamera.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: cameraExports });
test('follow camera centers its owner on desktop and portrait screens', () => {
  for (const [width, height] of [[1200, 675], [390, 844], [1920, 1080]]) {
    const frame = cameraExports.cameraTarget(width, height, 'follow', { x: 720, y: 420 });
    const center = cameraExports.screenToTown(width / 2, height / 2, frame);
    assert.equal(center.x, 720); assert.equal(center.y, 420);
    assert.ok(frame.zoom >= 1.7);
    const point = { x: 695, y: 435 };
    const inverse = cameraExports.screenToTown((point.x - frame.x) * frame.zoom + width / 2, (point.y - frame.y) * frame.zoom + height / 2, frame);
    assert.equal(inverse.x, point.x); assert.equal(inverse.y, point.y);
  }
});
test('general fits the whole town and is the fallback when there is no owner', () => {
  for (const [width, height] of [[1200, 675], [390, 844]]) {
    const frame = cameraExports.cameraTarget(width, height, 'general');
    assert.ok(960 * frame.zoom <= width + 1e-9 && 672 * frame.zoom <= height + 1e-9);
    assert.equal(JSON.stringify(cameraExports.cameraTarget(width, height, 'follow')), JSON.stringify(frame));
  }
});
