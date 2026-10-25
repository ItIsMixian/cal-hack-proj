import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { build } from 'esbuild';

// Synthetic identities in the isolated local database only. No production credentials.
const host = 'http://127.0.0.1:3010', database = 'mirrorville-worlds-test';
await mkdir('.local-backend', { recursive: true });
await build({ entryPoints: ['src/module_bindings/index.ts'], outfile: '.local-backend/public-town-bindings.mjs',
  bundle: true, platform: 'node', format: 'esm', packages: 'external', logLevel: 'silent' });
const { DbConnection } = await import('../.local-backend/public-town-bindings.mjs');
const clients = [], created = [];
const tag = randomBytes(4).toString('hex');
async function until(predicate) {
  const deadline = Date.now() + 10000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error('Timed out waiting for discovery subscription');
    await new Promise(resolve => setTimeout(resolve, 40));
  }
}
async function connect() {
  return await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Local connection timed out')), 10000);
    DbConnection.builder().withUri(host).withDatabaseName(database).onConnect(conn => {
      clients.push(conn);
      conn.subscriptionBuilder().onApplied(() => { clearTimeout(timer); resolve(conn); })
        .onError(error => { clearTimeout(timer); reject(error); })
        .subscribe(['SELECT * FROM my_worlds', 'SELECT * FROM discoverable_worlds', 'SELECT * FROM my_mirrors']);
    }).onConnectError((_ctx, error) => { clearTimeout(timer); reject(error); }).build();
  });
}
const discovery = conn => [...conn.db.discoverableWorlds.iter()];
const memberships = conn => [...conn.db.myWorlds.iter()];
const residents = conn => [...conn.db.myMirrors.iter()];
const settings = { name: `QA discovery ${tag}`, description: 'Synthetic public discovery check', allowStrangers: false, maxMembers: 2 };
let owner;
async function createWorld(slot, overrides = {}) {
  const fields = { ...settings, ...overrides };
  await owner.reducers.createWorld({ ...fields, slot, inviteToken: randomBytes(32).toString('hex') });
  await until(() => memberships(owner).some(world => world.slot === slot));
  const id = memberships(owner).find(world => world.slot === slot).id;
  created.push({ id, fields });
  return id;
}
async function update(id, overrides = {}) {
  const record = created.find(world => world.id === id);
  const fields = { ...record.fields, ...overrides };
  await owner.reducers.updateWorld({ ...fields, worldId: id });
  record.fields = fields;
}
try {
  const connections = await Promise.all([connect(), connect(), connect()]);
  [owner] = connections;
  const [, a, b] = connections;
  const id = await createWorld(1);
  assert.ok(!discovery(a).some(world => world.id === id), 'Private towns are absent');
  await update(id, { allowStrangers: true });
  await until(() => discovery(a).some(world => world.id === id) && discovery(b).some(world => world.id === id));
  assert.ok(!discovery(owner).some(world => world.id === id), 'Joined towns are absent even for the owner');
  const row = discovery(a).find(world => world.id === id);
  assert.deepEqual(Object.keys(row).sort(), ['description', 'id', 'maxMembers', 'memberCount', 'name']);
  assert.equal(row.memberCount, 1);
  console.log('PASS: private and joined towns excluded; discovery exposes only five safe summary fields');

  await update(id, { name: `QA renamed ${tag}`, description: 'Updated public summary' });
  await until(() => discovery(a).some(world => world.id === id && world.description === 'Updated public summary'));
  await update(id, { allowStrangers: false });
  await until(() => !discovery(a).some(world => world.id === id));
  await assert.rejects(a.reducers.joinOpenWorld({ worldId: id, slot: 1 }), /invitation/i);
  assert.ok(!memberships(a).some(world => world.id === id));
  console.log('PASS: live summary/settings updates and server refusal after strangers are disabled');

  for (const [index, client] of [a, b].entries()) {
    await client.reducers.createMirror({ name: `QA discoverer ${index} ${tag}`, look: 0,
      tipi: Uint8Array.from(Array(10).fill(4)), onMind: '', intent: '' });
  }
  const originalIds = [residents(a)[0].id, residents(b)[0].id];
  await update(id, { allowStrangers: true });
  await until(() => discovery(a).some(world => world.id === id));
  const race = await Promise.allSettled([a, b].map(client => client.reducers.joinOpenWorld({ worldId: id, slot: 1 })));
  assert.equal(race.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(race.filter(result => result.status === 'rejected' && /full/i.test(result.reason.message)).length, 1);
  const winnerIndex = race.findIndex(result => result.status === 'fulfilled');
  const winner = [a, b][winnerIndex], loser = [a, b][1 - winnerIndex];
  await until(() => !discovery(a).some(world => world.id === id) && !discovery(b).some(world => world.id === id)
    && memberships(winner).some(world => world.id === id && world.isCurrent) && residents(winner).length === 1);
  assert.notEqual(residents(winner)[0].id, originalIds[winnerIndex]);
  assert.equal(memberships(winner).find(world => world.id === id).inviteToken, '');
  assert.ok(!memberships(loser).some(world => world.id === id), 'Failed join rolls back membership');
  const mirrorId = residents(winner)[0].id;
  await winner.reducers.joinOpenWorld({ worldId: id, slot: 2 });
  assert.equal(residents(winner)[0].id, mirrorId);
  assert.equal(memberships(winner).filter(world => world.id === id).length, 1);
  await update(id, { maxMembers: 3 });
  await until(() => discovery(loser).some(world => world.id === id && world.memberCount === 2));
  assert.ok(!discovery(winner).some(world => world.id === id));
  console.log('PASS: concurrent last-place joins, full-town removal, capacity reopening, automatic independent mirror and repeat-join reuse');

  if (process.argv.includes('--browser-fixture')) {
    const fixtureId = await createWorld(2, { name: `QA Welcome Garden ${tag}`,
      description: 'A quiet garden for meeting new people. This is a temporary local UI test town.', allowStrangers: true, maxMembers: 8 });
    await update(id, { allowStrangers: false });
    console.log(`BROWSER FIXTURE READY: QA Welcome Garden ${tag} (id ${fixtureId}). Send a newline to close synthetic towns to strangers.`);
    await new Promise(resolve => {
      const timer = setTimeout(resolve, 3 * 60 * 1000);
      const finish = () => { clearTimeout(timer); resolve(); };
      process.stdin.once('data', finish);
      process.stdin.once('end', finish);
      process.stdin.resume();
    });
    process.stdin.pause();
  }
} finally {
  try {
    for (const record of created) await update(record.id, { allowStrangers: false });
    await until(() => clients.every(conn => discovery(conn).every(world => !created.some(record => record.id === world.id))));
  } finally { for (const conn of clients) conn.disconnect(); }
  console.log('Cleanup: synthetic test towns closed to strangers; existing towns and data preserved.');
}
