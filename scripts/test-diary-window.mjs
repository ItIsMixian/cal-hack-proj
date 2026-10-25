import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';

function load(path, globals = {}) {
  const exports = {};
  runInNewContext(ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, ...globals });
  return exports;
}
function storage() {
  const rows = new Map();
  return { getItem: key => rows.get(key) ?? null, setItem: (key, value) => rows.set(key, value) };
}

test('first visit shows history; persisted closes survive a fresh module and isolate owners/scopes', () => {
  const store = storage();
  const history = load('../src/DiaryHistory.ts');
  assert.equal(history.diaryCutoff(history.readDiaryHistory('alice', store), 1n), 0n);
  history.closeDiary('alice', 1n, 100n, store);
  const fresh = load('../src/DiaryHistory.ts');
  assert.equal(fresh.diaryCutoff(fresh.readDiaryHistory('alice', store), 1n), 100n);
  assert.equal(fresh.diaryCutoff(fresh.readDiaryHistory('alice', store), 2n), 0n);
  assert.equal(fresh.diaryCutoff(fresh.readDiaryHistory('bob', store), 1n), 0n);
  fresh.closeDiary('alice', undefined, 200n, store);
  assert.equal(fresh.diaryCutoff(fresh.readDiaryHistory('alice', store), 1n), 200n);
  assert.equal(fresh.diaryCutoff(fresh.readDiaryHistory('alice', store), 2n), 200n);
  fresh.closeDiary('alice', 1n, 150n, store);
  assert.equal(fresh.diaryCutoff(fresh.readDiaryHistory('alice', store), 1n), 200n);
});

test('invalid storage recovers and blocked storage retains a session-only close boundary', () => {
  const history = load('../src/DiaryHistory.ts');
  const corrupt = { getItem: () => '{broken', setItem: () => {} };
  assert.equal(history.readDiaryHistory('corrupt', corrupt).all, 0n);
  const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  history.closeDiary('blocked', undefined, 300n, blocked);
  assert.equal(history.readDiaryHistory('blocked', blocked).all, 300n);
});

function windowFixture() {
  const store = storage();
  const history = load('../src/DiaryHistory.ts', { localStorage: store });
  const window = new EventTarget();
  let now = 10, setup;
  const ref = { current: 0 };
  const hook = load('../src/useDiaryWindow.ts', { window, Event, queueMicrotask, Date: { now: () => now },
    require: name => {
      if (name === './DiaryHistory') return history;
      if (name === 'react') return { useMemo: fn => fn(), useRef: () => ref, useEffect: fn => { setup = fn; } };
      throw Error(`Unexpected import ${name}`);
    } });
  let events = 0;
  window.addEventListener(hook.DIARY_CLOSED_EVENT, () => events++);
  return { history, hook, window, setup: () => setup(), now: value => { now = value; }, events: () => events };
}

test('opening and StrictMode replay retain the window; real close saves once and reopening advances it', async () => {
  const f = windowFixture();
  const snapshot = f.hook.useDiaryWindow('owner', 1n);
  const replayCleanup = f.setup();
  replayCleanup();
  const realCleanup = f.setup();
  await Promise.resolve();
  assert.equal(f.history.readDiaryHistory('owner').mirrors.size, 0);
  assert.equal(snapshot.all, 0n);
  f.now(20);
  realCleanup();
  await Promise.resolve();
  assert.equal(f.history.diaryCutoff(f.history.readDiaryHistory('owner'), 1n), 20_000n);
  assert.equal(f.events(), 1);
  assert.equal(f.history.diaryCutoff(snapshot, 1n), 0n);
  const reopened = f.hook.useDiaryWindow('owner', 1n);
  assert.equal(f.history.diaryCutoff(reopened, 1n), 20_000n);
});

test('page close or refresh saves even an empty diary and unmount does not advance it again', async () => {
  const f = windowFixture();
  f.hook.useDiaryWindow('owner');
  const cleanup = f.setup();
  f.now(30);
  f.window.dispatchEvent(new Event('pagehide'));
  assert.equal(f.history.readDiaryHistory('owner').all, 30_000n);
  f.now(40);
  cleanup();
  await Promise.resolve();
  assert.equal(f.history.readDiaryHistory('owner').all, 30_000n);
  assert.equal(f.events(), 1);
});

test('changing account closes the old owner window without marking the new owner read', async () => {
  const f = windowFixture();
  f.hook.useDiaryWindow('alice', 1n);
  const cleanupAlice = f.setup();
  f.now(50);
  cleanupAlice();
  f.hook.useDiaryWindow('bob', 1n);
  const cleanupBob = f.setup();
  await Promise.resolve();
  assert.equal(f.history.diaryCutoff(f.history.readDiaryHistory('alice'), 1n), 50_000n);
  assert.equal(f.history.diaryCutoff(f.history.readDiaryHistory('bob'), 1n), 0n);
  cleanupBob();
  await Promise.resolve();
});
