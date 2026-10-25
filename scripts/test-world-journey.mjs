import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../src/DepartureScene.ts', import.meta.url), 'utf8');
function fixture({ reduced = false, fail = false, delayed = false } = {}) {
  let now = 100, nextFrame = 0;
  const frames = new Map(), images = [], draws = [], events = [];
  const exports = {};
  class Image {
    set src(value) { this.url = value; images.push(this); if (!delayed) queueMicrotask(() => fail ? this.onerror() : this.onload()); }
  }
  const context = new Proxy({}, { get: (_target, name) => name === 'drawImage'
    ? (...args) => draws.push(args) : () => {}, set: () => true });
  const js = ts.transpileModule(source.replace('import.meta.env.BASE_URL', "'/'"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(js, { exports, Image, performance: { now: () => now }, matchMedia: () => ({ matches: reduced }),
    document: { fonts: { ready: Promise.resolve() } },
    requestAnimationFrame: fn => { frames.set(++nextFrame, fn); return nextFrame; },
    cancelAnimationFrame: id => frames.delete(id),
  });
  const scene = exports.createDepartureScene({ getContext: () => context }, {
    onReady: () => events.push('ready'), onArrival: () => events.push('arrived'),
    onCaption: text => events.push(text), onError: () => events.push('error'),
  });
  return { scene, images, draws, events, frames,
    async load() { for (let i = 0; i < 8; i++) await Promise.resolve(); },
    step(time) { now = time; const batch = [...frames.values()]; frames.clear(); draws.length = 0; for (const fn of batch) fn(now); },
  };
}

test('boarding waits for the stopped shuttle, shows only a clipped head, then parks for selection', async () => {
  const f = fixture(); await f.load();
  f.step(2600);
  const bus = f.draws.find(args => args[0].url.endsWith('shuttle.png'));
  const passenger = f.draws.find(args => args[0].url.endsWith('character.png'));
  assert.ok(passenger[5] > bus[1] + bus[3], 'Waiting passenger stays beyond the approaching vehicle');
  f.step(6600);
  assert.equal(f.events.filter(value => value === 'ready').length, 1);
  const head = f.draws.find(args => args[0].url.endsWith('character.png'));
  assert.deepEqual(head.slice(3, 5), [16, 14]);
  assert.deepEqual(head.slice(7, 9), [12, 10]);
  f.step(60000);
  assert.equal(f.events.includes('arrived'), false, 'Time alone never enters a world');
});

test('skip and replay only change the scene; departure requires explicit confirmed destination', async () => {
  const f = fixture(); await f.load();
  f.scene.skip(); f.step(200);
  assert.equal(f.events.includes('arrived'), false);
  f.scene.replay(); f.step(400);
  assert.equal(f.events.includes('arrived'), false);
  f.scene.skip(); f.scene.depart('Confirmed world'); f.step(2700);
  assert.equal(f.events.filter(value => value === 'arrived').length, 1);
  f.step(9000);
  assert.equal(f.events.filter(value => value === 'arrived').length, 1);
});

test('reduced motion opens selection immediately but still waits for confirmation', async () => {
  const f = fixture({ reduced: true }); await f.load(); f.step(101);
  assert.ok(f.events.includes('ready')); assert.equal(f.events.includes('arrived'), false);
  f.scene.depart('Approved world'); f.step(102);
  assert.ok(f.events.includes('arrived'));
});

test('choosing before images load cannot reset an approved departure or strand the journey', async () => {
  const f = fixture({ delayed: true });
  f.scene.skip(); f.scene.depart('Approved early');
  for (const image of f.images) image.onload();
  await f.load(); f.step(2400);
  assert.ok(f.events.includes('arrived'));
});

test('image failure reports fallback; disposing prevents late callbacks and cancels animation', async () => {
  const failed = fixture({ fail: true }); await failed.load();
  assert.ok(failed.events.includes('error'));
  const delayed = fixture({ delayed: true }); delayed.scene.dispose();
  for (const image of delayed.images) image.onload();
  await delayed.load();
  assert.equal(delayed.frames.size, 0); assert.equal(delayed.events.length, 0);
  const running = fixture(); await running.load(); assert.equal(running.frames.size, 1);
  running.scene.dispose(); assert.equal(running.frames.size, 0);
});
