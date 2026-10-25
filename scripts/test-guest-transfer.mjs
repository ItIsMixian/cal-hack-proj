import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { webcrypto } from 'node:crypto';
import { test } from 'node:test';
import ts from 'typescript';

const code = ts.transpileModule(readFileSync(new URL('../src/guestTransfer.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function fixture({ guest = true, failure, blockedStorage = false } = {}) {
  const host = 'wss://share.example.test', db = 'mirrorville';
  const values = new Map(guest ? [[`${host}/${db}/auth_token`, 'saved-guest-token']] : []);
  const requests = [];
  const localStorage = { getItem: key => values.get(key) ?? null,
    setItem(key, value) { if (blockedStorage) throw Error('Storage unavailable'); values.set(key, value); },
    removeItem: key => values.delete(key) };
  const exports = {};
  runInNewContext(code, { exports, localStorage, crypto: webcrypto, Uint8Array,
    fetch: async (url, options) => { requests.push({ url, ...options }); if (failure === 'network') throw Error('offline'); return { ok: !failure }; } });
  return { values, requests, run: () => exports.prepareGuestTransfer(host, db), key: `${host}/${db}/guest_transfer` };
}

test('preparation proves the saved guest identity over HTTPS and persists only a random capability', async () => {
  const f = fixture(); await f.run();
  assert.equal(f.requests.length, 1);
  assert.equal(f.requests[0].url, 'https://share.example.test/v1/database/mirrorville/call/prepare_guest_transfer');
  assert.equal(f.requests[0].headers.Authorization, 'Bearer saved-guest-token');
  assert.match(f.values.get(f.key), /^[a-f0-9]{64}$/);
  assert.equal(JSON.parse(f.requests[0].body)[0], f.values.get(f.key));
  assert.equal(f.values.get('wss://share.example.test/mirrorville/auth_token'), 'saved-guest-token');
  const first = f.values.get(f.key); await f.run(); assert.notEqual(f.values.get(f.key), first);
});

test('no saved guest credential means no transfer request', async () => {
  const f = fixture({ guest: false }); await f.run(); assert.equal(f.requests.length, 0);
});

test('preparation failure cleans up the pending proof and never pretends sign-in can proceed', async () => {
  for (const failure of ['server', 'network']) {
    const f = fixture({ failure }); await assert.rejects(f.run(), /Could not prepare/);
    assert.equal(f.values.has(f.key), false);
  }
  const blocked = fixture({ blockedStorage: true });
  await assert.rejects(blocked.run(), /Storage unavailable/); assert.equal(blocked.requests.length, 0);
});
