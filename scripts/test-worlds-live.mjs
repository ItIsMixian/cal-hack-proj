import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { build } from 'esbuild';

// Targets only the explicitly named local test database; no production credentials.
const host = process.env.MIRRORVILLE_TEST_HOST ?? 'http://127.0.0.1:3010', database = process.env.MIRRORVILLE_TEST_DB ?? 'mirrorville-worlds-test';
if (!['127.0.0.1','localhost'].includes(new URL(host).hostname)) throw new Error('Live tests require a local test database');
await mkdir('.local-backend', { recursive: true });
await build({ entryPoints: ['src/module_bindings/index.ts'], outfile: '.local-backend/test-bindings.mjs',
  bundle: true, platform: 'node', format: 'esm', packages: 'external', logLevel: 'silent' });
const { DbConnection } = await import('../.local-backend/test-bindings.mjs');
const clients = [];
const pause = () => new Promise(resolve => setTimeout(resolve, 40));
async function until(predicate, timeout = 10000) {
  const deadline = Date.now() + timeout;
  while (!predicate()) { if (Date.now() > deadline) throw new Error('Timed out waiting for live subscription'); await pause(); }
}
async function connect() {
  return await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Local test connection timed out')), 10000);
    DbConnection.builder().withUri(host).withDatabaseName(database).onConnect((conn, identity, token) => {
      const client = { conn, identity, token }; clients.push(client);
      conn.subscriptionBuilder().onApplied(() => { clearTimeout(timer); resolve(client); }).onError(reject).subscribe([
        'SELECT * FROM my_worlds', 'SELECT * FROM mirror', 'SELECT * FROM conversation',
        'SELECT * FROM line', 'SELECT * FROM my_mirrors', 'SELECT * FROM my_diary',
      ]);
    }).onConnectError((_ctx, error) => { clearTimeout(timer); reject(error); }).build();
  });
}
const worlds = c => [...c.conn.db.myWorlds.iter()];
const mirrors = c => [...c.conn.db.visibleMirrors.iter()];
const current = c => worlds(c).find(w => w.isCurrent);
const settings = { name: 'QA private world', description: 'Synthetic local integration test', allowStrangers: false, maxMembers: 2 };
const token = randomBytes(32).toString('hex');
const runTag = randomBytes(4).toString('hex');
const alice = `QA Alice ${runTag}`, bob = `QA Bob ${runTag}`, outside = `QA Outside ${runTag}`;
try {
  const [a, b, c, d] = await Promise.all([connect(), connect(), connect(), connect()]);
  assert.ok(clients.every(client => worlds(client).some(w => w.id === 0n)));
  await a.conn.reducers.createWorld({ ...settings, slot: 1, inviteToken: token });
  await until(() => current(a)?.id !== 0n);
  const id = current(a).id;
  assert.equal(current(a).isOwner, true);
  assert.equal(current(a).memberCount, 1);
  await assert.rejects(b.conn.reducers.enterWorld({ worldId: id }), /join.*first/i);
  await assert.rejects(b.conn.reducers.joinOpenWorld({ worldId: id, slot: 1 }), /invitation/i);
  await assert.rejects(c.conn.reducers.joinWorld({ slot: 1, inviteToken: '0'.repeat(64) }), /invalid|replaced/i);
  await b.conn.reducers.joinWorld({ slot: 1, inviteToken: token });
  await until(() => current(b)?.id === id && current(a)?.memberCount === 2);
  assert.equal(current(b).isOwner, false);
  assert.equal(current(b).inviteToken, '');
  await assert.rejects(b.conn.reducers.updateWorld({ ...settings, worldId: id }), /creator/i);
  await assert.rejects(c.conn.reducers.joinWorld({ slot: 1, inviteToken: token }), /full/i);
  await assert.rejects(a.conn.reducers.updateWorld({ ...settings, worldId: id, maxMembers: 1 }), /member count/i);
  console.log('PASS: owner authorization, private joining, invalid invitation, atomic member capacity');

  const create = (client, name) => client.conn.reducers.createMirror({ name, look: 0,
    tipi: Uint8Array.from(Array(10).fill(4)), onMind: '', intent: '' });
  await create(a, alice); await create(b, bob); await create(d, outside);
  await until(() => mirrors(a).length === 2 && mirrors(b).length === 2 && mirrors(d).some(m => m.name === outside));
  assert.ok(!mirrors(d).some(m => m.name === alice || m.name === bob));
  assert.ok(!mirrors(a).some(m => m.name === outside));
  for (const table of ['world', 'world_member', 'world_selection', 'mirror_storage', 'conversation_storage', 'line_storage', 'diary_entry', 'mirror_prototype']) {
    const response = await fetch(`${host}/v1/database/${database}/sql`, {
      method: 'POST', headers: { Authorization: `Bearer ${d.token}` }, body: `SELECT * FROM ${table}`,
    });
    assert.equal(response.ok, false, `Private ${table} must not be queryable`);
  }
  console.log('PASS: live world-scoped subscriptions and eight private-table SQL denials');

  await a.conn.reducers.updateWorld({ ...settings, worldId: id, allowStrangers: true, maxMembers: 3, name: 'QA open world' });
  await c.conn.reducers.joinOpenWorld({ worldId: id, slot: 1 });
  await until(() => current(c)?.id === id && current(a)?.memberCount === 3);
  assert.equal(current(c).name, 'QA open world');
  const replacement = randomBytes(32).toString('hex');
  await a.conn.reducers.rotateWorldInvite({ worldId: id, inviteToken: replacement });
  await assert.rejects(d.conn.reducers.joinWorld({ slot: 1, inviteToken: token }), /invalid|replaced/i);
  const original = mirrors(b).find(m => m.name === alice);
  await a.conn.reducers.setContact({ mirrorId: original.id, contact: '@world-one' });
  await a.conn.reducers.enterWorld({ worldId: 0n });
  await until(() => current(a)?.id === 0n && [...a.conn.db.myMirrors.iter()].length === 1);
  assert.equal(mirrors(b).find(m => m.name === alice)?.id, original.id);
  assert.ok(!mirrors(a).some(m => m.id === original.id || m.name === bob));
  await assert.rejects(a.conn.reducers.setContact({ mirrorId: original.id, contact: 'wrong world' }), /another world/i);
  const local = [...a.conn.db.myMirrors.iter()][0];
  assert.equal(local.name, alice);
  assert.equal(local.look, original.look);
  assert.equal(local.contact, '');
  await until(() => mirrors(d).some(m => m.id === local.id));
  const autoId = local.id;
  await a.conn.reducers.enterWorld({ worldId: 0n });
  await until(() => [...a.conn.db.myMirrors.iter()].length === 1);
  assert.equal([...a.conn.db.myMirrors.iter()][0].id, autoId);
  assert.notEqual(local.id, original.id);
  await a.conn.reducers.setContact({ mirrorId: local.id, contact: '@world-zero' });
  await a.conn.reducers.updateIntent({ mirrorId: local.id, intent: 'Independent world zero plan' });
  await a.conn.reducers.enterWorld({ worldId: id });
  await until(() => current(a)?.id === id && [...a.conn.db.myMirrors.iter()].some(m => m.id === original.id && m.contact === '@world-one'));
  assert.equal(mirrors(a).find(m => m.id === original.id).intent, '');
  assert.ok(!mirrors(a).some(m => m.id === local.id));
  assert.equal(mirrors(d).find(m => m.id === local.id)?.intent, 'Independent world zero plan');
  await a.conn.reducers.enterWorld({ worldId: 0n });
  await until(() => [...a.conn.db.myMirrors.iter()].some(m => m.id === local.id && m.contact === '@world-zero'));
  console.log('PASS: public admission, settings sync, revoked invitations, automatic independent mirrors, idempotent entry and contacts across round trips');
  // A is viewing world zero. B still observes the original, which must keep simulating.
  const before = mirrors(b).find(m => m.id === original.id);
  console.log('Checking movement while the owner is in another world (arrival rests can last 180 seconds)...');
  await until(() => {
    const resident = mirrors(b).find(m => m.id === original.id);
    return resident && Math.hypot(resident.x - before.x, resident.y - before.y) > 0.05;
  }, 195000);
  assert.equal(mirrors(b).find(m => m.id === original.id).worldId, id);
  console.log('PASS: the original world keeps moving while its owner views another world');

  const reconnect = await new Promise((resolve, reject) => {
    DbConnection.builder().withUri(host).withDatabaseName(database).withToken(b.token).onConnect(conn => {
      clients.push({ conn });
      conn.subscriptionBuilder().onApplied(() => resolve(conn)).onError(reject).subscribe(['SELECT * FROM my_worlds']);
    }).onConnectError((_ctx, error) => reject(error)).build();
  });
  assert.ok([...reconnect.db.myWorlds.iter()].some(w => w.id === id && w.isCurrent && !w.isOwner));
  console.log('PASS: membership and selected world survive reconnect');
  const freshInvite = randomBytes(32).toString('hex');
  await c.conn.reducers.createWorld({ ...settings, slot: 3, inviteToken: freshInvite });
  await until(() => current(c)?.slot === 3);
  const joinedId = current(c).id;
  await a.conn.reducers.joinWorld({ slot: 3, inviteToken: freshInvite });
  await until(() => current(a)?.id === joinedId && [...a.conn.db.myMirrors.iter()].length === 1);
  const invitedMirror = [...a.conn.db.myMirrors.iter()][0];
  assert.equal(invitedMirror.name, alice);
  assert.equal(invitedMirror.intent, ''); // Original prototype, not world-zero edits.
  assert.notEqual(invitedMirror.id, original.id);
  assert.notEqual(invitedMirror.id, local.id);
  await until(() => mirrors(c).some(m => m.id === invitedMirror.id));
  console.log('PASS: invitation joining creates a fresh resident from the stable prototype');
  const raceToken = randomBytes(32).toString('hex');
  await d.conn.reducers.createWorld({ ...settings, slot: 2, inviteToken: raceToken });
  await until(() => [...d.conn.db.myMirrors.iter()].some(m => m.name === outside));
  assert.notEqual([...d.conn.db.myMirrors.iter()][0].id, mirrors(a).find(m => m.name === outside)?.id);
  console.log('PASS: creating a new world also automatically spawns the owner prototype');
  const race = await Promise.allSettled([b, c].map(client => client.conn.reducers.joinWorld({ slot: 2, inviteToken: raceToken })));
  assert.equal(race.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(race.filter(result => result.status === 'rejected' && /full/i.test(result.reason.message)).length, 1);
  console.log('PASS: concurrent joins cannot overfill the last available place');
} finally {
  for (const { conn } of clients) conn.disconnect();
}
