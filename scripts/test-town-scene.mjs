import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';

const assetRoot = fileURLToPath(new URL('../public/assets/town/', import.meta.url));
const asset = name => readFileSync(join(assetRoot, name));
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

test('authored loader uses shipped WebP files and never paints a partially failed map', async () => {
  const loaderCode = readFileSync(new URL('../src/AuthoredTown.ts', import.meta.url), 'utf8').replace(/import .*?;\r?\n/, '');
  const requested = [];
  let fail = false;
  class ImageStub {
    width = 192; height = 192;
    set src(url) {
      // Vite's static server decodes URI paths, retaining encoded reserved commas.
      const name = decodeURI(url.split('/').pop());
      const bytes = asset(name);
      assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
      requested.push(name);
      queueMicrotask(() => fail ? this.onerror() : this.onload());
    }
  }
  const loaded = {};
  runInNewContext(ts.transpileModule(loaderCode, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports: loaded, Image: ImageStub, setTimeout, clearTimeout, AbortSignal,
    fetch: async () => ({ ok: true, json: async () => scene }) });
  let paints = 0;
  const context = { save() {}, restore() {}, clearRect() {}, translate() {}, transform() {}, drawImage() { paints++; } };
  await loaded.loadAuthoredTown(context);
  assert.equal(new Set(requested).size, 11);
  assert.equal(paints, 231);
  paints = 0; fail = true;
  await assert.rejects(loaded.loadAuthoredTown(context), /Town texture:/);
  assert.equal(paints, 0);
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
test('general covers the viewport and is the fallback when there is no owner', () => {
  for (const [width, height] of [[1200, 675], [390, 844]]) {
    const frame = cameraExports.cameraTarget(width, height, 'general');
    assert.ok(960 * frame.zoom >= width - 1e-9 && 672 * frame.zoom >= height - 1e-9);
    assert.equal(JSON.stringify(cameraExports.cameraTarget(width, height, 'follow')), JSON.stringify(frame));
  }
});

const motionExports = {};
runInNewContext(ts.transpileModule(readFileSync(new URL('../src/TownMotion.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: motionExports });
const buildings = {};
runInNewContext(ts.transpileModule(world + '\n' + readFileSync(new URL('../src/TownBuildings.ts', import.meta.url), 'utf8').replace(/import .*?;\r?\n/, ''), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: buildings });
test('indoor pin requires server arrival and completed visual travel, and clears on departure', () => {
  const m = { place: 'cafe', x: 18, y: 4, targetX: 18, targetY: 4 };
  assert.equal(buildings.enteredBuilding(m, 0), 'cafe');
  assert.equal(buildings.enteredBuilding(m, 1), null);
  assert.equal(buildings.enteredBuilding({ ...m, targetX: 25 }, 0), null);
  assert.equal(buildings.enteredBuilding({ ...m, x: 1, targetX: 1 }, 0), null);
  assert.equal(buildings.enteredBuilding({ ...m, place: 'park', x: 20, y: 15, targetX: 20, targetY: 15 }, 0), null);
});
test('a distant or delayed snapshot cannot cause a burst of movement', () => {
  for (const dt of [1 / 60, 1 / 30, 5]) {
    const next = motionExports.advanceTownPosition({ x: 0, y: 0 }, { x: 300, y: 400 }, dt);
    assert.ok(Math.hypot(next.x, next.y) <= 1.8 * Math.min(dt, 0.05) + 1e-9);
  }
});
test('walking speed is stable across frame rates and stops exactly at its target', () => {
  for (const fps of [30, 60, 120]) {
    let point = { x: 0, y: 0 };
    for (let i = 0; i < fps; i++) point = motionExports.advanceTownPosition(point, { x: 20, y: 0 }, 1 / fps);
    assert.ok(Math.abs(point.x - 1.8) < 1e-9);
    point = motionExports.advanceTownPosition(point, { x: point.x + 0.001, y: 0 }, 1 / fps);
    const stopped = motionExports.advanceTownPosition(point, point, 1 / fps);
    assert.equal(stopped.x, point.x);
  }
});

test('small one-second updates keep moving between packets without overshooting or snapping on retarget', () => {
  const target = { x: 0.36, y: 0 };
  let point = { x: 0, y: 0 }, snapshot, movingFrames = 0;
  for (let i = 0; i <= 60; i++) {
    const sample = motionExports.sampleTownSnapshot(snapshot, point, target, i * 1000 / 60);
    snapshot = sample.snapshot;
    const next = motionExports.advanceTownPosition(point, sample.point, 1 / 60);
    if (next.x > point.x + 1e-9) movingFrames++;
    assert.ok(next.x <= target.x + 1e-9);
    point = next;
  }
  assert.ok(movingFrames >= 59, `only ${movingFrames} moving frames`);
  const before = point.x;
  const changed = motionExports.sampleTownSnapshot(snapshot, point, { x: -1, y: 0 }, 1100);
  assert.equal(changed.point.x, before);
  const stopped = motionExports.sampleTownSnapshot(changed.snapshot, point, { x: -1, y: 0 }, 4000);
  assert.equal(stopped.point.x, -1);
});
