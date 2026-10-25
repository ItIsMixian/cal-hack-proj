import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Execute the actual module callbacks with an in-memory transactional context.
// This covers domain logic; live subscriptions and model output are checked separately.
class Timestamp { constructor(value) { this.microsSinceUnixEpoch = value; } }
const identity = value => ({ value, equals(other) { return value === other?.value; } });
const A = identity('a'), B = identity('b'), C = identity('c');
const builder = new Proxy({}, { get: () => () => builder });
const t = new Proxy({}, { get: () => () => builder });
let definitions;
const schema = tables => {
  definitions = tables;
  return Object.fromEntries(['reducer', 'procedure', 'view', 'init', 'clientConnected'].map(key => [key, (...args) => args.at(-1)]));
};
let verdict = null;
function load(path) {
  const exports = {};
  const require = name => {
    if (name === 'spacetimedb/server') return { schema, table: (options, columns) => ({ options, columns, rowType: builder }), t, SenderError: Error };
    if (name === 'spacetimedb') return { Timestamp, ScheduleAt: { time: x => x, interval: x => x } };
    if (name === './llm') return { judge: () => { if (verdict instanceof Error) throw verdict; return JSON.stringify(verdict); }, parseJsonObject: JSON.parse };
    return load(new URL(`../spacetimedb/src/${name.slice(2)}.ts`, import.meta.url));
  };
  const js = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInNewContext(js, { exports, require, console });
  return exports;
}
const mod = load(new URL('../spacetimedb/src/index.ts', import.meta.url));
function fixture(demo = false) {
  const db = {};
  for (const [name, def] of Object.entries(definitions)) {
    const rows = new Map(); let seq = 1n;
    const pk = ['worldSelection', 'mirrorPrototype'].includes(name) ? 'owner' : ['mirrorProfile', 'mirrorRest', 'mirrorSummary'].includes(name) ? 'mirrorId' : ['tickTimer', 'llmJob', 'importJob'].includes(name) ? 'scheduledId' : 'id';
    const equal = (a, b) => typeof a?.equals === 'function' ? a.equals(b) : a === b;
    const table = {
      iter: () => rows.values(), count: () => BigInt(rows.size),
      insert(row) { const value = { ...('worldId' in def.columns ? { worldId: 0n } : {}), ...row, [pk]: row[pk] === 0n && !['world', 'worldSimulation'].includes(name) ? seq++ : row[pk] }; rows.set(value[pk], value); return value; },
    };
    for (const col of Object.keys(def.columns)) table[col] = {
      find: value => [...rows.values()].find(row => equal(row[col], value)),
      filter: value => [...rows.values()].filter(row => equal(row[col], value)).values(),
      update: row => { const value = { ...row }; rows.set(row[pk], value); return value; }, delete: value => rows.delete(value),
    };
    for (const index of def.options.indexes ?? []) table[index.accessor] = {
      filter: values => [...rows.values()].filter(row => index.columns.every((col, i) => equal(row[col], values[i]))).values(),
    };
    db[name] = table;
  }
  db.mirror = db.mirrorStorage; db.conversation = db.conversationStorage; db.line = db.lineStorage;
  db.world.insert({ id: 0n, owner: A, name: 'Test world', maxMembers: 100, allowStrangers: true });
  for (const owner of [A, B, C]) {
    db.worldMember.insert({ id: 0n, owner, worldId: 0n, slot: 0 });
    db.worldSelection.insert({ owner, worldId: 0n });
  }
  const now = new Timestamp(1_000_000_000_000n);
  const random = () => 0.5; random.integerInRange = min => min;
  const ctx = sender => ({ sender, timestamp: now, db, random, withTx(fn) { return fn(this); } });
  for (const [id, owner, name] of [[10n, A, 'Alice'], [20n, B, 'Bob']]) {
    db.mirror.insert({ id, name, look: 2, extraversion: 0.6, demo: id === 20n && demo, intent: 'Build accessible charts together', activity: 'working', conversationId: 30n });
    db.mirrorProfile.insert({ mirrorId: id, owner, selfCard: 'I build accessible charts', contact: `${name}@example.test` });
  }
  db.config.insert({ id: 0, deepseekKey: 'test', anthropicKey: '' });
  db.conversation.insert({ id: 30n, a: 10n, b: 20n, turns: 2, active: true, maxTurns: 4, place: 'park' });
  const wrap = () => mod.runLlmJob(ctx(A), { job: { conversationId: 30n, kind: 'wrap' } });
  const entries = owner => mod.myDiary(ctx(owner));
  return { db, ctx, wrap, entries };
}
const diaryVerdict = connection => ({ noteForA: 'We talked about charts', noteForB: 'We met', diaryForA: 'I met Bob at the park. We talked about accessible charts.', diaryForB: 'I met Alice at the park. We talked about charts.', connection });
const connection = { kind: 'same_intent', evidenceA: 'Build accessible charts together', evidenceB: 'Build accessible charts together', why: 'Both want to build accessible charts together' };

test('every conversation writes both diaries, with place/name and owner isolation; retry is idempotent', () => {
  const f = fixture(); verdict = diaryVerdict(null); f.wrap();
  assert.equal(f.db.diaryEntry.count(), 2n);
  assert.match(f.entries(A)[0].text, /^I met Bob/);
  assert.equal(f.entries(A)[0].place, 'park'); assert.equal(f.entries(A)[0].otherName, 'Bob');
  assert.equal(f.entries(A)[0].goodFit, false); assert.equal(f.entries(C).length, 0);
  f.wrap(); assert.equal(f.db.diaryEntry.count(), 2n);
});
test('visible one-sided interest hides contact; mutual interest unlocks both contacts; repeated clicks deduplicate', () => {
  const f = fixture(); verdict = diaryVerdict(null); f.wrap();
  const a = f.entries(A)[0], b = f.entries(B)[0];
  assert.equal(a.theirContact, '');
  mod.showInterest(f.ctx(A), { diaryEntryId: a.id });
  assert.equal(f.entries(B)[0].theyAreInterested, true); assert.equal(f.entries(B)[0].theirContact, '');
  assert.equal(f.entries(A)[0].mutual, false);
  mod.showInterest(f.ctx(B), { diaryEntryId: b.id });
  assert.equal(f.entries(A)[0].theirContact, 'Bob@example.test');
  assert.equal(f.entries(B)[0].theirContact, 'Alice@example.test');
  mod.showInterest(f.ctx(A), { diaryEntryId: a.id }); assert.equal(f.db.interest.count(), 2n);
});
test('demo reciprocates and can see visitor contact through its owner diary', () => {
  const f = fixture(true); verdict = diaryVerdict(null); f.wrap();
  mod.setContact(f.ctx(A), { mirrorId: 10n, contact: '@alice' });
  mod.showInterest(f.ctx(A), { diaryEntryId: f.entries(A)[0].id });
  assert.equal(f.entries(A)[0].mutual, true); assert.equal(f.entries(B)[0].theirContact, '@alice');
});
test('ownership, length limits, clearing contact, and unredacted sharing', () => {
  const f = fixture(); verdict = diaryVerdict(null); f.wrap();
  assert.throws(() => mod.showInterest(f.ctx(C), { diaryEntryId: f.entries(A)[0].id }), /Not your diary/);
  assert.throws(() => mod.setContact(f.ctx(B), { mirrorId: 10n, contact: 'stolen' }), /Not your mirror/);
  assert.throws(() => mod.setContact(f.ctx(A), { mirrorId: 10n, contact: 'x'.repeat(121) }), /120/);
  const contact = 'a'.repeat(107) + '@example.test';
  mod.setContact(f.ctx(A), { mirrorId: 10n, contact }); assert.equal(f.db.mirrorProfile.mirrorId.find(10n).contact, contact);
  mod.setContact(f.ctx(A), { mirrorId: 10n, contact: '' }); assert.equal(f.db.mirrorProfile.mirrorId.find(10n).contact, '');
});
test('good-fit evidence and repeat-conversation rules still reject unsupported connections without dropping diaries', () => {
  for (const c of [connection, { ...connection, evidenceA: 'invented evidence' }, { ...connection, kind: 'shared_interest' }]) {
    const f = fixture(); verdict = diaryVerdict(c); f.wrap();
    assert.equal(f.entries(A)[0].goodFit, c === connection); assert.equal(f.db.diaryEntry.count(), 2n);
  }
});
test('model failure records an unavailable summary without substituting simulation actions or a good-fit mark', () => {
  const f = fixture(); verdict = new Error('offline'); f.wrap();
  assert.equal(f.entries(A)[0].text, 'Conversation summary unavailable.'); assert.equal(f.entries(A)[0].goodFit, false);
});
test('newest first uses timestamps rather than auto-increment IDs; later contact edits propagate only to mutual pairs', () => {
  const f = fixture(); verdict = diaryVerdict(null); f.wrap();
  const a = f.entries(A)[0];
  f.db.diaryEntry.insert({ ...[...f.db.diaryEntry.iter()][0], id: 100n, createdAt: new Timestamp(1n) });
  assert.equal(f.entries(A)[0].id, a.id);
  mod.showInterest(f.ctx(A), { diaryEntryId: a.id });
  mod.setContact(f.ctx(B), { mirrorId: 20n, contact: '@newbob' });
  assert.equal(f.entries(A)[0].theirContact, '');
  mod.showInterest(f.ctx(B), { diaryEntryId: f.entries(B)[0].id });
  assert.equal(f.entries(A)[0].theirContact, '@newbob');
});
test('good-fit marks preserve pair deduplication and two-per-day owner cap while diaries continue', () => {
  for (const capped of [false, true]) {
    const f = fixture(); verdict = diaryVerdict(connection);
    if (capped) {
      for (const other of [40n, 50n]) f.db.diaryEntry.insert({ id: 0n, conversationId: other, mirrorId: 10n,
        owner: A, otherMirrorId: other, goodFit: true, createdAt: f.ctx(A).timestamp });
    }
    f.wrap(); assert.equal([...f.db.diaryEntry.iter()].find(e => e.conversationId === 30n && e.owner.equals(A)).goodFit, !capped);
    f.db.conversation.id.update({ ...f.db.conversation.id.find(30n), active: true, id: 31n });
    mod.runLlmJob(f.ctx(A), { job: { conversationId: 31n, kind: 'wrap' } });
    assert.equal([...f.db.diaryEntry.iter()].filter(e => e.conversationId === 31n).length, 2);
    assert.equal([...f.db.diaryEntry.iter()].find(e => e.conversationId === 31n).goodFit, false);
  }
});
test('private tables and retired postcard/chat API remain inaccessible to clients', () => {
  assert.equal(definitions.diaryEntry.options.public, undefined);
  assert.equal(definitions.interest.options.public, undefined);
  assert.equal(definitions.mirrorProfile.options.public, undefined);
  for (const name of ['wave', 'sendHumanMessage', 'myPostcards', 'myHumanMessages']) assert.equal(mod[name], undefined);
});
test('one conversation between two mirrors of the same owner consumes only one daily mark', () => {
  const f = fixture(); verdict = diaryVerdict(connection);
  const bob = f.db.mirrorProfile.mirrorId.find(20n);
  f.db.mirrorProfile.mirrorId.update({ ...bob, owner: A });
  f.wrap();
  for (const other of [40n, 50n]) {
    f.db.mirror.insert({ ...f.db.mirror.id.find(20n), id: other, name: `Visitor ${other}` });
    f.db.mirrorProfile.insert({ ...bob, mirrorId: other, owner: C });
    f.db.conversation.insert({ ...f.db.conversation.id.find(30n), id: other, b: other, active: true });
    mod.runLlmJob(f.ctx(A), { job: { conversationId: other, kind: 'wrap' } });
    const entry = [...f.db.diaryEntry.iter()].find(e => e.conversationId === other && e.mirrorId === 10n);
    assert.equal(entry.goodFit, other === 40n);
  }
});


test('5Hz movement keeps one-unit-per-second speed and one-second social cadence', () => {
  const f = fixture();
  for (const m of [...f.db.mirror.iter()]) f.db.mirror.id.delete(m.id);
  f.db.mirror.insert({ id: 40n, name: 'Pacing fixture', intent: '', landmark: 'park', place: 'park',
    x: 0, y: 0, targetX: 10, targetY: 0, conversationId: 0n, activity: 'walking',
    lastChatAt: new Timestamp(0n), extraversion: 0.5 });
  const random = () => 0.5;
  random.integerInRange = (lo, hi) => Math.min(hi, Math.max(lo, 120));
  for (let i = 1; i <= 5; i++) mod.tick({ ...f.ctx(A), random, timestamp: new Timestamp(BigInt(i) * 200_000n) });
  assert.ok(Math.abs(f.db.mirror.id.find(40n).x - 1) < 1e-8);
  assert.equal(f.db.worldSimulation.id.find(0n).lastSocialAt, 200_000n);
});

test('arrival holds a destination for the chosen dwell period before moving again', () => {
  const f = fixture();
  for (const m of [...f.db.mirror.iter()]) f.db.mirror.id.delete(m.id);
  f.db.mirror.insert({ id: 40n, name: 'Rest fixture', intent: 'gym', landmark: 'gym', place: 'gym',
    x: 5, y: 5, targetX: 5, targetY: 5, conversationId: 0n, activity: 'walking',
    lastChatAt: new Timestamp(0n), extraversion: 0.5 });
  const random = () => 0.5;
  random.integerInRange = (lo, hi) => Math.min(hi, Math.max(lo, 120));
  const tickAt = seconds => mod.tick({ ...f.ctx(A), random, timestamp: new Timestamp(BigInt(seconds) * 1_000_000n) });
  tickAt(1);
  const departure = Number(f.db.mirrorRest.mirrorId.find(40n).until / 1_000_000n);
  assert.ok(departure >= 91 && departure <= 181);
  tickAt(departure - 1);
  assert.equal(f.db.mirror.id.find(40n).targetX, 5);
  assert.notEqual(f.db.mirror.id.find(40n).activity, 'walking');
  tickAt(departure);
  assert.notEqual(f.db.mirror.id.find(40n).targetX, 5);
  assert.equal(f.db.mirror.id.find(40n).activity, 'walking');
});


test('resident exit is admin-only and reversible, retaining profile and ending live conversations', () => {
  const f = fixture(true);
  f.db.config.id.update({ ...f.db.config.id.find(0), admin: A });
  const profile = { ...f.db.mirrorProfile.mirrorId.find(20n) };
  assert.throws(() => mod.setResidentActive(f.ctx(B), { mirrorId: 20n, active: false }), /admin/);
  mod.setResidentActive(f.ctx(A), { mirrorId: 20n, active: false });
  assert.equal(f.db.mirror.id.find(20n).active, false);
  assert.equal(f.db.conversation.id.find(30n).active, false);
  assert.deepEqual(f.db.mirrorProfile.mirrorId.find(20n), profile);
  mod.setResidentActive(f.ctx(A), { mirrorId: 20n, active: true });
  assert.equal(f.db.mirror.id.find(20n).active, true);
});

test('diary views isolate the same owner history by the selected world', () => {
  const f = fixture(); verdict = diaryVerdict(null); f.wrap();
  const first = f.entries(A)[0];
  f.db.world.insert({ id: 1n, owner: A, name: 'Private world', maxMembers: 2 });
  f.db.worldMember.insert({ id: 0n, owner: A, worldId: 1n, slot: 1 });
  f.db.diaryEntry.insert({ ...f.db.diaryEntry.id.find(first.id), id: 99n, worldId: 1n, text: 'Private world only' });
  assert.equal(f.entries(A).length, 1);
  assert.notEqual(f.entries(A)[0].text, 'Private world only');
  f.db.worldSelection.owner.update({ owner: A, worldId: 1n });
  assert.equal(f.entries(A).length, 1);
  assert.equal(f.entries(A)[0].text, 'Private world only');
});

test('simulation never starts a conversation across world boundaries', () => {
  const f = fixture();
  addSecondWorld(f);
  f.db.conversation.id.update({ ...f.db.conversation.id.find(30n), active: false });
  for (const [index, resident] of [...f.db.mirror.iter()].entries()) {
    f.db.mirror.id.update({ ...resident, worldId: BigInt(index), conversationId: 0n, place: 'park', landmark: 'park',
      x: 5, y: 5, targetX: 5, targetY: 5, lastChatAt: new Timestamp(0n), extraversion: 1 });
  }
  const random = () => 0; random.integerInRange = () => 90;
  mod.tick({ ...f.ctx(A), random });
  assert.equal([...f.db.conversation.iter()].filter(c => c.active).length, 0);
});

function addSecondWorld(f) {
  f.db.world.insert({ id: 1n, owner: A, name: 'Independent world', maxMembers: 20 });
  f.db.worldMember.insert({ id: 0n, owner: A, worldId: 1n, slot: 1 });
}
function createIn(f, worldId, name) {
  mod.enterWorld(f.ctx(A), { worldId });
  const random = () => 0.5; random.integerInRange = min => min;
  mod.createMirror({ ...f.ctx(A), random }, { name, look: 0, tipi: Array(10).fill(4), onMind: name, intent: '' });
  return mod.myMirrors(f.ctx(A)).find(m => m.name === name).id;
}

test('switching worlds preserves original residents, active conversations, rest and profiles', () => {
  const f = fixture(); addSecondWorld(f);
  f.db.mirrorRest.insert({ mirrorId: 10n, until: 999n });
  const resident = { ...f.db.mirror.id.find(10n) }, profile = { ...f.db.mirrorProfile.mirrorId.find(10n) };
  mod.enterWorld(f.ctx(A), { worldId: 1n });
  assert.deepEqual(f.db.mirror.id.find(10n), resident);
  assert.deepEqual(f.db.mirrorProfile.mirrorId.find(10n), profile);
  assert.equal(f.db.conversation.id.find(30n).active, true);
  assert.equal(f.db.mirrorRest.mirrorId.find(10n).until, 999n);
  assert.equal(mod.myMirrors(f.ctx(A)).length, 1);
  assert.notEqual(mod.myMirrors(f.ctx(A))[0].id, 10n);
  assert.throws(() => mod.setContact(f.ctx(A), { mirrorId: 10n, contact: 'wrong world' }), /another world/);
  mod.enterWorld(f.ctx(A), { worldId: 0n });
  assert.equal(mod.myMirrors(f.ctx(A))[0].id, 10n);
});

test('one owner gets independent mirrors, contacts, cards and creation limits in each world', () => {
  const f = fixture(); addSecondWorld(f);
  const first = createIn(f, 0n, 'First new mirror');
  createIn(f, 0n, 'Third home mirror'); // Existing Alice counts toward home limit.
  assert.throws(() => createIn(f, 0n, 'Over home limit'), /3 mirrors/);
  const second = createIn(f, 1n, 'Other world mirror');
  assert.notEqual(first, second);
  mod.setContact(f.ctx(A), { mirrorId: second, contact: '@second' });
  f.db.mirrorCard.insert({ id: 70n, mirrorId: first, owner: A });
  f.db.mirrorCard.insert({ id: 71n, mirrorId: second, owner: A });
  f.db.mirrorSummary.insert({ mirrorId: first, owner: A });
  f.db.mirrorSummary.insert({ mirrorId: second, owner: A });
  f.db.importStatus.insert({ id: 70n, mirrorId: first, owner: A });
  f.db.importStatus.insert({ id: 71n, mirrorId: second, owner: A });
  for (const view of ['myCards', 'mySummaries', 'myImports']) {
    assert.deepEqual(Array.from(mod[view](f.ctx(A)), row => row.mirrorId), [second]);
  }
  assert.throws(() => mod.deleteCard(f.ctx(A), { cardId: 70n }), /another world/);
  createIn(f, 1n, 'Second visitor mirror'); // Auto-created prototype already occupies one slot.
  assert.throws(() => createIn(f, 1n, 'Over visitor limit'), /3 mirrors/);
  mod.enterWorld(f.ctx(A), { worldId: 0n });
  assert.equal(mod.myMirrors(f.ctx(A)).length, 3);
  assert.equal(f.db.mirrorProfile.mirrorId.find(first).contact, '');
  assert.equal(f.db.mirrorProfile.mirrorId.find(second).contact, '@second');
});

test('unviewed worlds keep moving with separate clocks and random streams', () => {
  function run(extraHomeMirrors) {
    const f = fixture(); addSecondWorld(f);
    for (const m of [...f.db.mirror.iter()]) f.db.mirror.id.delete(m.id);
    const resident = { name: 'Autonomous', intent: 'gym', landmark: 'gym', place: 'gym', x: 5, y: 5,
      targetX: 5, targetY: 5, activity: 'working', conversationId: 0n, lastChatAt: new Timestamp(0n), extraversion: 0.5 };
    f.db.mirror.insert({ ...resident, id: 100n, worldId: 1n });
    f.db.mirrorRest.insert({ mirrorId: 100n, until: 0n });
    for (let i = 0; i < extraHomeMirrors; i++) f.db.mirror.insert({ ...resident, id: BigInt(200 + i), worldId: 0n });
    // Everyone's selected world is 0, yet world 1 chooses a destination and walks.
    mod.tick(f.ctx(A));
    const before = { ...f.db.mirror.id.find(100n) };
    mod.tick({ ...f.ctx(A), timestamp: new Timestamp(f.ctx(A).timestamp.microsSinceUnixEpoch + 200_000n) });
    const after = f.db.mirror.id.find(100n);
    assert.ok(Math.hypot(after.x - before.x, after.y - before.y) > 0);
    assert.equal(f.db.worldSimulation.count(), 2n);
    return after;
  }
  assert.deepEqual(run(0), run(12));
});

test('busy conversations in another world do not consume this world concurrency', () => {
  const f = fixture(); addSecondWorld(f);
  for (let i = 0; i < 6; i++) f.db.conversation.insert({ id: BigInt(100 + i), worldId: 1n, active: true });
  f.db.conversation.id.update({ ...f.db.conversation.id.find(30n), active: false });
  for (const resident of [...f.db.mirror.iter()]) f.db.mirror.id.update({ ...resident, conversationId: 0n,
    place: 'park', landmark: 'park', x: 5, y: 5, targetX: 5, targetY: 5, lastChatAt: new Timestamp(0n), extraversion: 1 });
  for (let i = 1; i <= 120 && ![...f.db.conversation.iter()].some(c => c.active && c.worldId === 0n); i++) {
    mod.tick({ ...f.ctx(A), timestamp: new Timestamp(f.ctx(A).timestamp.microsSinceUnixEpoch + BigInt(i) * 1_000_000n) });
  }
  assert.ok([...f.db.conversation.iter()].some(c => c.active && c.worldId === 0n));
});

test('good-fit daily marks in another world do not cap this world', () => {
  const f = fixture(); addSecondWorld(f); verdict = diaryVerdict(connection);
  for (const id of [80n, 81n]) f.db.diaryEntry.insert({ id, worldId: 1n, conversationId: id,
    mirrorId: 10n, owner: A, otherMirrorId: id, goodFit: true, createdAt: f.ctx(A).timestamp });
  f.wrap();
  assert.equal(f.entries(A)[0].goodFit, true);
});


test('a full other world does not block creating a resident here', () => {
  const f = fixture(); addSecondWorld(f);
  for (let i = 0; i < 60; i++) f.db.mirror.insert({ id: BigInt(200 + i), worldId: 1n, active: true });
  assert.ok(createIn(f, 0n, 'Room for me'));
});

test('an import in another world does not block an independent import here', () => {
  const f = fixture(); addSecondWorld(f);
  const other = createIn(f, 1n, 'Other importer');
  f.db.importStatus.insert({ id: 80n, mirrorId: other, owner: A, status: 'processing' });
  mod.enterWorld(f.ctx(A), { worldId: 0n });
  const args = { mirrorId: 10n, relation: 'friends', source: 'Synthetic text',
    text: 'I enjoy building accessible charts and working on concrete problems.', latestAt: '' };
  mod.importText(f.ctx(A), args);
  assert.equal(f.db.importJob.count(), 1n);
  assert.throws(() => mod.importText(f.ctx(A), args), /Another import/);
});


test('entering seeds exactly one independent resident from a stable legacy prototype', () => {
  const f = fixture(); addSecondWorld(f);
  const original = { ...f.db.mirror.id.find(10n) };
  mod.enterWorld(f.ctx(A), { worldId: 1n });
  const spawned = mod.myMirrors(f.ctx(A))[0];
  assert.notEqual(spawned.id, original.id);
  assert.equal(spawned.name, original.name); assert.equal(spawned.look, original.look);
  assert.equal(spawned.selfCard, f.db.mirrorProfile.mirrorId.find(10n).selfCard);
  assert.equal(spawned.contact, '');
  assert.equal(f.db.mirror.id.find(spawned.id).conversationId, 0n);
  assert.deepEqual(f.db.mirror.id.find(10n), original);
  const count = f.db.mirror.count();
  mod.enterWorld(f.ctx(A), { worldId: 1n });
  mod.enterWorld(f.ctx(A), { worldId: 0n });
  mod.enterWorld(f.ctx(A), { worldId: 1n });
  assert.equal(f.db.mirror.count(), count);
  assert.equal(mod.myMirrors(f.ctx(A))[0].id, spawned.id);
  mod.updateIntent(f.ctx(A), { mirrorId: spawned.id, intent: 'World-specific new plan' });
  f.db.world.insert({ id: 2n, owner: A, name: 'Third world', maxMembers: 20 });
  f.db.worldMember.insert({ id: 0n, owner: A, worldId: 2n, slot: 2 });
  mod.enterWorld(f.ctx(A), { worldId: 2n });
  assert.equal(mod.myMirrors(f.ctx(A))[0].intent, original.intent);
  assert.equal(f.db.mirrorPrototype.owner.find(A).intent, original.intent);
});

test('new users stay in onboarding; first created mirror saves their own prototype only', () => {
  const f = fixture(); addSecondWorld(f);
  mod.enterWorld(f.ctx(C), { worldId: 0n });
  assert.equal(mod.myMirrors(f.ctx(C)).length, 0);
  assert.equal(f.db.mirrorPrototype.owner.find(C), undefined);
  mod.createMirror(f.ctx(C), { name: 'First prototype', look: 3, tipi: Array(10).fill(4), onMind: 'Learning', intent: '' });
  assert.equal(f.db.mirrorPrototype.owner.find(C).name, 'First prototype');
  assert.equal(f.db.mirrorPrototype.owner.find(C).look, 3);
  assert.equal(f.db.mirrorPrototype.owner.find(A), undefined);
  assert.equal(f.db.mirrorPrototype.owner.find(B), undefined);
});

test('automatic entry respects capacity, membership and inactive resident decisions', () => {
  const f = fixture(); addSecondWorld(f);
  assert.throws(() => mod.enterWorld(f.ctx(B), { worldId: 1n }), /Join this world/);
  assert.equal(f.db.mirrorPrototype.owner.find(B), undefined);
  for (let i = 0; i < 60; i++) f.db.mirror.insert({ id: BigInt(200 + i), worldId: 1n, active: true });
  assert.throws(() => mod.enterWorld(f.ctx(A), { worldId: 1n }), /full/);
  assert.equal(f.db.worldSelection.owner.find(A).worldId, 0n);
  f.db.mirror.insert({ id: 99n, worldId: 1n, active: false, demo: false });
  f.db.mirrorProfile.insert({ mirrorId: 99n, owner: A, selfCard: '', contact: '' });
  const count = f.db.mirror.count();
  mod.enterWorld(f.ctx(A), { worldId: 1n });
  assert.equal(f.db.mirror.count(), count);
  assert.equal(f.db.mirror.id.find(99n).active, false);
});


test('public discovery excludes private and already-joined towns and exposes only public metadata', () => {
  const f = fixture();
  for (const [id, allowStrangers] of [[1n, true], [2n, false], [3n, true]]) {
    f.db.world.insert({ id, owner: B, name: `Town ${id}`, description: 'Public introduction',
      allowStrangers, maxMembers: 2, inviteToken: 'sensitive invitation' });
    f.db.worldMember.insert({ id: 0n, owner: B, worldId: id, slot: Number(id) });
  }
  f.db.worldMember.insert({ id: 0n, owner: A, worldId: 3n, slot: 1 });
  const rows = mod.discoverableWorlds(f.ctx(A));
  assert.deepEqual(Array.from(rows, row => row.id), [1n]);
  assert.deepEqual(Object.keys(rows[0]).sort(), ['description', 'id', 'maxMembers', 'memberCount', 'name']);
  assert.equal(rows[0].memberCount, 1);
  assert.equal(rows[0].inviteToken, undefined);
  assert.equal(rows[0].owner, undefined);
  assert.equal(mod.discoverableWorlds(f.ctx(B)).length, 0);
});

test('public discovery follows owner openness, capacity and actual membership changes', () => {
  const f = fixture(); addSecondWorld(f);
  f.db.world.id.update({ ...f.db.world.id.find(1n), allowStrangers: false, maxMembers: 2 });
  assert.equal(mod.discoverableWorlds(f.ctx(C)).length, 0);
  assert.throws(() => mod.joinOpenWorld(f.ctx(C), { worldId: 1n, slot: 1 }), /invitation/);
  f.db.world.id.update({ ...f.db.world.id.find(1n), allowStrangers: true });
  assert.equal(mod.discoverableWorlds(f.ctx(C))[0].memberCount, 1);
  mod.joinOpenWorld(f.ctx(C), { worldId: 1n, slot: 1 });
  assert.equal(mod.discoverableWorlds(f.ctx(C)).length, 0);
  assert.equal(mod.discoverableWorlds(f.ctx(B)).length, 0, 'Full towns cannot be discovered as joinable');
  assert.throws(() => mod.joinOpenWorld(f.ctx(B), { worldId: 1n, slot: 1 }), /full/);
  assert.equal(f.db.worldSelection.owner.find(B).worldId, 0n);
  f.db.world.id.update({ ...f.db.world.id.find(1n), maxMembers: 3 });
  const reopened = mod.discoverableWorlds(f.ctx(B))[0];
  assert.equal(reopened.memberCount, 2);
  assert.equal(reopened.maxMembers, 3);
  assert.equal(mod.discoverableWorlds(f.ctx(C)).length, 0, 'Joined towns stay excluded after capacity increases');
});
