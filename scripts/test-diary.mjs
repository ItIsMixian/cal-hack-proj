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
  return Object.fromEntries(['reducer', 'procedure', 'view', 'init', 'clientConnected', 'clientDisconnected'].map(key => [key, (...args) => args.at(-1)]));
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
  const js = ts.transpileModule(readFileSync(path, 'utf8') + (String(path).endsWith('/index.ts') ? '\nexport { tickWorld as fixtureTickWorld };' : ''), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInNewContext(js, { exports, require, console });
  return exports;
}
const mod = load(new URL('../spacetimedb/src/index.ts', import.meta.url));
function fixture(demo = false) {
  const db = {};
  for (const [name, def] of Object.entries(definitions)) {
    const rows = new Map(); let seq = 1n;
    const pk = name === 'residentConnection' ? 'connectionId' : ['worldSelection','mirrorPrototype','residentSession'].includes(name) ? 'owner' : name === 'conversationMaterial' ? 'pair' : name === 'guestTransfer' ? 'owner' : ['mirrorProfile', 'mirrorRest', 'mirrorSummary', 'mirrorLearning', 'mirrorStyle'].includes(name) ? 'mirrorId' : ['tickTimer', 'llmJob', 'importJob'].includes(name) ? 'scheduledId' : 'id';
    const equal = (a, b) => typeof a?.equals === 'function' ? a.equals(b) : a === b;
    const table = {
      iter: () => rows.values(), count: () => BigInt(rows.size),
      insert(row) { const value = { ...(Object.hasOwn(def.columns,'worldId') ? {worldId:0n} : {}), ...row, [pk]: row[pk] === 0n && !['world','worldSimulation','demoControl'].includes(name) ? seq++ : row[pk] }; rows.set(value[pk], value); return value; },
    };
    for (const col of Object.keys(def.columns)) table[col] = {
      find: value => [...rows.values()].find(row => equal(row[col], value)),
      filter: value => [...rows.values()].filter(row => equal(row[col], value)).values(),
      update: row => { const value = { ...row }; rows.set(row[pk], value); return value; }, delete: value => rows.delete(value),
    };
    for (const index of def.options.indexes ?? []) table[index.accessor] = {
      filter: values => [...rows.values()].filter(row => (Array.isArray(values) ? values : [values]).every((value, i) => equal(row[index.columns[i]], value))).values(),
    };
    db[name] = table;
  }
  db.mirror = db.mirrorStorage; db.conversation = db.conversationStorage; db.line = db.lineStorage;
  db.world.insert({id:0n,owner:A,name:'Test world',maxMembers:100,allowStrangers:true});
  for(const owner of [A,B,C]) {db.worldMember.insert({id:0n,owner,worldId:0n,slot:0});db.worldSelection.insert({owner,worldId:0n});}
  const now = new Timestamp(1_000_000_000_000n);
  const ctx = sender => ({ sender, timestamp: now, db, senderAuth: { jwt: null }, withTx(fn) { return fn(this); } });
  for (const [id, owner, name] of [[10n, A, 'Alice'], [20n, B, 'Bob']]) {
    db.mirror.insert({ id, name, demo: id === 20n && demo, intent: 'Build accessible charts together', activity: 'working', conversationId: 30n });
    db.mirrorProfile.insert({ mirrorId: id, owner, selfCard: 'I build accessible charts', contact: `${name}@example.test` });
  }
  db.config.insert({ id: 0, deepseekKey: 'test', anthropicKey: '' });
  db.conversation.insert({ id: 30n, a: 10n, b: 20n, turns: 2, active: true, maxTurns: 4, place: 'park', startedAt: now });
  const wrap = () => mod.runLlmJob(ctx(A), { job: { conversationId: 30n, kind: 'wrap' } });
  const entries = owner => mod.myDiary(ctx(owner));
  return { db, ctx, wrap, entries };
}
const diaryVerdict = connection => ({ noteForA: 'We talked about charts', noteForB: 'We met', diaryForA: 'I met Bob at the park. We talked about accessible charts.', diaryForB: 'I met Alice at the park. We talked about charts.', connection });
const connection = { kind: 'same_intent', evidenceA: 'Build accessible charts together', evidenceB: 'Build accessible charts together', why: 'Both want to build accessible charts together' };

test('owners can persist a new appearance without changing identity, position, conversation or private profile', () => {
  const f = fixture();
  const before = { ...f.db.mirror.id.find(10n), look: 1, x: 12, y: 14, targetX: 18, targetY: 16 };
  f.db.mirror.id.update(before);
  const profile = { ...f.db.mirrorProfile.mirrorId.find(10n) };
  mod.setAppearance(f.ctx(A), { mirrorId: 10n, look: 4 });
  assert.deepEqual(f.db.mirror.id.find(10n), { ...before, look: 4 });
  assert.deepEqual(f.db.mirrorProfile.mirrorId.find(10n), profile);
  assert.equal(mod.myMirrors(f.ctx(A)).find(row => row.id === 10n).look, 4);
  assert.equal(mod.myMirrors(f.ctx(B)).some(row => row.id === 10n), false);
  mod.setAppearance(f.ctx(A), { mirrorId: 10n, look: 4 });
  assert.equal(f.db.mirror.id.find(10n).look, 4);
});

test('appearance changes deny other owners, unknown IDs and demo mirrors', () => {
  const f = fixture(true);
  assert.throws(() => mod.setAppearance(f.ctx(B), { mirrorId: 10n, look: 2 }), /Not your mirror/);
  assert.throws(() => mod.setAppearance(f.ctx(A), { mirrorId: 999n, look: 2 }), /Not your mirror/);
  assert.throws(() => mod.setAppearance(f.ctx(B), { mirrorId: 20n, look: 2 }), /Not your mirror/);
  assert.equal(f.db.mirror.id.find(10n).look, undefined);
});

test('appearance changes reject unsupported looks without writing a row', () => {
  const f = fixture();
  for (const look of [-1, 5, 7, 256, 1.5, NaN]) {
    assert.throws(() => mod.setAppearance(f.ctx(A), { mirrorId: 10n, look }), /valid appearance/);
    assert.equal(f.db.mirror.id.find(10n).look, undefined);
  }
  for (const look of [0, 1, 2, 3, 4]) mod.setAppearance(f.ctx(A), { mirrorId: 10n, look });
  assert.equal(f.db.mirror.id.find(10n).look, 4);
});

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
  for (let i = 1; i <= 5; i++) mod.fixtureTickWorld({ ...f.ctx(A), random, timestamp: new Timestamp(BigInt(i) * 200_000n) }, 0n);
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
  const tickAt = seconds => mod.fixtureTickWorld({ ...f.ctx(A), random, timestamp: new Timestamp(BigInt(seconds) * 1_000_000n) }, 0n);
  tickAt(1); tickAt(120);
  assert.equal(f.db.mirror.id.find(40n).targetX, 5);
  assert.notEqual(f.db.mirror.id.find(40n).activity, 'walking');
  tickAt(121);
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

const transferToken = 'a'.repeat(64);
const accountContext = (f, sender = B) => ({ ...f.ctx(sender), senderAuth: { jwt: { issuer: 'https://auth.spacetimedb.com/oidc', fullPayload: { email: 'verified@example.test', email_verified: true } } } });

test('guest transfer preserves IDs, cards, diaries, imports, learning, style, relationships and contacts', () => {
  const f = fixture(); verdict = diaryVerdict(null); f.wrap();
  f.db.mirrorCard.insert({ id: 50n, mirrorId: 10n, owner: A, text: 'Protected card', editedByOwner: true });
  f.db.mirrorSummary.insert({ mirrorId: 10n, owner: A, text: 'You build charts.' });
  f.db.mirrorLearning.insert({ mirrorId: 10n, owner: A, reviewed: false });
  f.db.mirrorStyle.insert({ mirrorId: 10n, owner: A, text: 'Short sentences' });
  f.db.importStatus.insert({ id: 51n, mirrorId: 10n, owner: A, status: 'processing' });
  f.db.importJob.insert({ scheduledId: 52n, mirrorId: 10n, owner: A });
  f.db.interest.insert({ id: 53n, fromMirrorId: 10n, toMirrorId: 20n, fromOwner: A, toOwner: B });
  f.db.encounter.insert({ id: 54n, a: 10n, b: 20n, aOwner: A, bOwner: B });
  const mirrorBefore = { ...f.db.mirror.id.find(10n) };
  mod.prepareGuestTransfer(f.ctx(A), { token: transferToken });
  mod.claimGuestMirrors(accountContext(f), { token: transferToken });
  for (const table of ['mirrorProfile', 'mirrorSummary', 'mirrorLearning', 'mirrorStyle']) assert.ok(f.db[table].mirrorId.find(10n).owner.equals(B), table);
  for (const table of ['mirrorCard', 'diaryEntry', 'importStatus', 'importJob']) {
    for (const row of f.db[table].iter()) if (row.mirrorId === 10n) assert.ok(row.owner.equals(B), table);
  }
  assert.equal(f.entries(A).length, 0); assert.equal(f.entries(B).length, 2);
  assert.equal(f.db.mirrorProfile.mirrorId.find(10n).contact, 'Alice@example.test');
  assert.equal(f.db.mirrorCard.id.find(50n).editedByOwner, true);
  assert.ok(f.db.interest.id.find(53n).fromOwner.equals(B));
  assert.ok(f.db.encounter.id.find(54n).aOwner.equals(B));
  assert.deepEqual(f.db.mirror.id.find(10n), mirrorBefore);
  assert.equal(f.db.relation.count(), 1n);
  mod.claimGuestMirrors(accountContext(f), { token: transferToken });
  assert.throws(() => mod.claimGuestMirrors(accountContext(f, C), { token: transferToken }), /already used/);
  assert.throws(() => mod.setContact(f.ctx(A), { mirrorId: 10n, contact: 'stolen' }), /Not your mirror/);
});

test('transfer rejects unverified, anonymous, wrong-issuer, unknown, expired and revoked proofs', () => {
  const f = fixture();
  mod.prepareGuestTransfer(f.ctx(A), { token: transferToken });
  assert.throws(() => mod.claimGuestMirrors(f.ctx(B), { token: transferToken }), /verified email/);
  for (const jwt of [
    { issuer: 'https://other.example', fullPayload: { email: 'a@example.test' } },
    { issuer: 'https://auth.spacetimedb.com/oidc', fullPayload: {} },
    { issuer: 'https://auth.spacetimedb.com/oidc', fullPayload: { email: 'a@example.test', email_verified: false } },
  ]) assert.throws(() => mod.claimGuestMirrors({ ...f.ctx(B), senderAuth: { jwt } }, { token: transferToken }), /verified email/);
  assert.throws(() => mod.prepareGuestTransfer(accountContext(f), { token: transferToken }), /Only a guest/);
  assert.throws(() => mod.prepareGuestTransfer(f.ctx(A), { token: 'short' }), /Invalid/);
  assert.throws(() => mod.claimGuestMirrors(accountContext(f), { token: 'b'.repeat(64) }), /not found/);
  mod.prepareGuestTransfer(f.ctx(A), { token: 'c'.repeat(64) });
  assert.throws(() => mod.claimGuestMirrors(accountContext(f), { token: transferToken }), /not found/);
  const ticket = f.db.guestTransfer.owner.find(A);
  f.db.guestTransfer.owner.update({ ...ticket, expiresAt: 0n });
  assert.throws(() => mod.claimGuestMirrors(accountContext(f), { token: ticket.token }), /expired/);
  assert.ok(f.db.mirrorProfile.mirrorId.find(10n).owner.equals(A));
  assert.equal(definitions.guestTransfer.options.public, undefined);
});

test('an owner can reversibly move out a duplicate; another identity cannot; archived data stays private', () => {
  const f = fixture();
  assert.throws(() => mod.setOwnMirrorActive(f.ctx(C), { mirrorId: 10n, active: false }), /Not your mirror/);
  mod.setOwnMirrorActive(f.ctx(A), { mirrorId: 10n, active: false });
  assert.equal(f.db.conversation.id.find(30n).active, false);
  assert.equal(mod.myMirrors(f.ctx(A)).length, 0);
  assert.equal(mod.myArchivedMirrors(f.ctx(A))[0].id, 10n);
  assert.equal(mod.myArchivedMirrors(f.ctx(C)).length, 0);
  assert.equal(f.db.mirrorProfile.mirrorId.find(10n).contact, 'Alice@example.test');
  mod.setOwnMirrorActive(f.ctx(A), { mirrorId: 10n, active: true });
  assert.equal(mod.myMirrors(f.ctx(A))[0].id, 10n);
  assert.equal(mod.myArchivedMirrors(f.ctx(A)).length, 0);
});

test('both creation paths reject a duplicate owned name including archived mirrors', () => {
  const f = fixture();
  const args = { name: ' alice ', look: 0, tipi: [4,4,4,4,4,4,4,4,4,4], onMind: '', intent: '' };
  assert.throws(() => mod.createMirror(f.ctx(A), args), /already have a mirror with this name/);
  mod.setOwnMirrorActive(f.ctx(A), { mirrorId: 10n, active: false });
  assert.throws(() => mod.createMirrorOnboarding(f.ctx(A), { ...args, words: [], text: '' }), /already have a mirror with this name/);
});

test('a diary finishing during transfer belongs to the account, not the stale guest snapshot', () => {
  const f = fixture();
  mod.prepareGuestTransfer(f.ctx(A), { token: transferToken });
  verdict = { toJSON() { mod.claimGuestMirrors(accountContext(f), { token: transferToken }); return diaryVerdict(null); } };
  f.wrap();
  assert.equal(f.entries(A).length, 0);
  assert.equal(f.entries(B).length, 2);
  assert.ok([...f.db.diaryEntry.iter()].every(row => row.owner.equals(B)));
});


test('scheduled encounters enforce pair pacing and require changed shareable material', () => {
  const f = fixture();
  f.db.conversation.id.delete(30n);
  let time = 200_000_000_000n;
  for (const id of [10n,20n]) f.db.mirror.id.update({ ...f.db.mirror.id.find(id), x:10,y:10,targetX:10,targetY:10,
    place:'park',active:true,conversationId:0n,lastChatAt:new Timestamp(0n),extraversion:1 });
  const tick = () => {
    for (const id of [10n,20n]) {
      const row = {mirrorId:id,until:time+100_000_000n};
      if(f.db.mirrorRest.mirrorId.find(id)) f.db.mirrorRest.mirrorId.update(row); else f.db.mirrorRest.insert(row);
    }
    const random = Object.assign(() => 0, {integerInRange: () => 100});
    mod.fixtureTickWorld({...f.ctx(A),timestamp:new Timestamp(time),random}, 0n);
  };
  const release = () => { for(const id of [10n,20n]) f.db.mirror.id.update({...f.db.mirror.id.find(id),conversationId:0n,lastChatAt:new Timestamp(time)}); };
  tick();
  assert.equal([...f.db.conversation.iter()].length,1);
  assert.equal([...f.db.conversation.iter()][0].maxTurns,4);
  release();
  time += 25n*60n*60n*1_000_000n;
  tick();
  assert.equal([...f.db.conversation.iter()].length,1, 'same material stays quiet even after a day');
  f.db.mirrorCard.insert({id:1n,mirrorId:10n,owner:A,facet:'professional',text:'Built a camera calibration rig',personal:false,rooms:'',createdAt:new Timestamp(time)});
  time += 2_000_000n;
  tick();
  assert.equal([...f.db.conversation.iter()].length,2);
  release();
  f.db.mirrorCard.insert({id:2n,mirrorId:10n,owner:A,facet:'professional',text:'Tested the rig',personal:false,rooms:'',createdAt:new Timestamp(time)});
  time += 10n*60n*1_000_000n;
  tick();
  assert.equal([...f.db.conversation.iter()].length,2, 'new material cannot bypass the pair limit');
  assert.equal(definitions.conversationMaterial.options.public, undefined);
});


test('diary source IDs are scoped to the other person and cannot expose a private card', () => {
  const f=fixture();
  f.db.mirrorCard.insert({id:71n,mirrorId:20n,owner:B,facet:'background',text:'I build a Unity prototype.',personal:false,rooms:'{"venue":"on"}'});
  f.db.mirrorCard.insert({id:72n,mirrorId:20n,owner:B,facet:'background',text:'Private information',personal:true,rooms:'{"venue":"off"}'});
  verdict={...diaryVerdict(null),sourceForA:'card:71',sourceForB:'card:71'};
  f.wrap();
  assert.match(f.entries(A)[0].text,/mirrorville-source-v1/);
  assert.match(f.entries(A)[0].text,/Unity prototype/);
  assert.ok(!f.entries(B)[0].text.includes('mirrorville-source-v1'));
  f.db.conversation.id.update({...f.db.conversation.id.find(30n),id:31n,active:true});
  verdict={...diaryVerdict(null),sourceForA:'card:72'};
  mod.runLlmJob(f.ctx(A),{job:{conversationId:31n,kind:'wrap'}});
  const second=[...f.db.diaryEntry.iter()].find(e=>e.conversationId===31n&&e.mirrorId===10n);
  assert.ok(!second.text.includes('Private information'));
  assert.ok(!second.text.includes('mirrorville-source-v1'));
});


test('guests retire after their last tab closes; reconnects and verified accounts persist',()=>{
 const f=fixture(),guest=f.ctx(A);guest.connectionId=identity('tab-a');
 mod.connectWorld(guest);
 const tab2={...guest,connectionId:identity('tab-b')};mod.connectWorld(tab2);
 mod.disconnectWorld(guest);
 assert.equal(f.db.residentSession.owner.find(A).expiresAt,0n);
 mod.disconnectWorld(tab2);
 const expiry=f.db.residentSession.owner.find(A).expiresAt;
 assert.equal(expiry,guest.timestamp.microsSinceUnixEpoch+60_000_000n);
 mod.tick({...guest,timestamp:new Timestamp(expiry-1n)});
 assert.notEqual(f.db.mirror.id.find(10n).active,false);
 mod.connectWorld(guest);mod.tick({...guest,timestamp:new Timestamp(expiry+1n)});
 assert.notEqual(f.db.mirror.id.find(10n).active,false);
 mod.disconnectWorld(guest);mod.tick({...guest,timestamp:new Timestamp(expiry+1n)});
 assert.equal(f.db.mirror.id.find(10n).active,false);
 assert.ok(f.db.mirrorProfile.mirrorId.find(10n),'historical ownership retained');
 assert.equal(f.db.conversation.id.find(30n).active,false);
 const account=f.ctx(B);account.connectionId=identity('account-tab');
 account.senderAuth={jwt:{issuer:'https://auth.spacetimedb.com/oidc',fullPayload:{email:'test@example.test',email_verified:true}}};
 mod.connectWorld(account);mod.disconnectWorld(account);
 mod.tick({...guest,timestamp:new Timestamp(expiry+3600_000_000n)});
 assert.notEqual(f.db.mirror.id.find(20n).active,false);
});

test('unknown legacy owners are never classified by duplicate names',()=>{
 const f=fixture();mod.tick(f.ctx(A));
 assert.notEqual(f.db.mirror.id.find(10n).active,false);
 assert.notEqual(f.db.mirror.id.find(20n).active,false);
});


test('email claim revives auto-expired guests and makes them persistent without touching manually retired data',()=>{
 const f=fixture(),guest=f.ctx(A);guest.connectionId=identity('transfer-tab');
 mod.connectWorld(guest);mod.prepareGuestTransfer(guest,{token:transferToken});mod.disconnectWorld(guest);
 const expiry=f.db.residentSession.owner.find(A).expiresAt;
 mod.tick({...guest,timestamp:new Timestamp(expiry+1n)});
 assert.equal(f.db.mirror.id.find(10n).active,false);
 mod.claimGuestMirrors(accountContext(f),{token:transferToken});
 assert.equal(f.db.mirror.id.find(10n).active,true);
 assert.equal(f.db.mirrorProfile.mirrorId.find(10n).owner,B);
 assert.equal(f.db.residentSession.owner.find(B).verified,true);
 mod.tick({...guest,timestamp:new Timestamp(expiry+1000_000_000n)});
 assert.equal(f.db.mirror.id.find(10n).active,true);
});


test('demo toggle is host-only, world-scoped, reversible and expires after five minutes',()=>{
 const f=fixture();
 const row=f.db.mirror.id.find(10n);f.db.mirror.id.update({...row,worldId:0n,active:true,lastChatAt:new Timestamp(0n),place:'park',x:10,y:10,targetX:10,targetY:10,conversationId:0n});
 f.db.mirror.id.update({...f.db.mirror.id.find(20n),worldId:0n,active:true,lastChatAt:new Timestamp(0n),place:'park',x:12,y:10,targetX:12,targetY:10,conversationId:0n});
 const host=f.ctx(A);host.random=()=>.5;host.random.integerInRange=()=>90;
 assert.throws(()=>mod.setDemoMode(f.ctx(B),{enabled:true}),/world host/);
 mod.setDemoMode(host,{enabled:true});
 assert.equal(mod.myDemoSettings(host)[0].enabled,true);
 assert.equal(mod.myDemoSettings(f.ctx(B))[0].canManage,false);
 assert.equal(f.db.demoControl.worldId.find(0n).until,host.timestamp.microsSinceUnixEpoch+300_000_000n);
 assert.equal(f.db.mirror.id.find(10n).activity,'walking');
 assert.equal(f.db.mirror.id.find(10n).x,10,'switch never teleports');
 mod.setDemoMode(host,{enabled:false});assert.equal(mod.myDemoSettings(host)[0].enabled,false);
 mod.setDemoMode(host,{enabled:true});
 mod.tick({...host,timestamp:new Timestamp(host.timestamp.microsSinceUnixEpoch+300_000_001n)});
 assert.equal(mod.myDemoSettings(host)[0].enabled,false);
});


test('demo starts only one real encounter while skipping pacing, not evidence validation',()=>{
 const f=fixture(),ctx=f.ctx(A);ctx.random=()=>.5;ctx.random.integerInRange=()=>90;
 f.db.conversation.id.delete(30n);
 for(const id of [10n,20n])f.db.mirror.id.update({...f.db.mirror.id.find(id),active:true,worldId:0n,conversationId:0n,place:'park',x:10,y:10,targetX:10,targetY:10,activity:'resting',lastChatAt:ctx.timestamp});
 f.db.demoControl.insert({worldId:0n,operator:A,enabled:true,until:ctx.timestamp.microsSinceUnixEpoch+300_000_000n,lastEncounterAt:0n});
 mod.fixtureTickWorld(ctx,0n);
 assert.equal([...f.db.conversation.iter()].filter(c=>c.active).length,1);
 mod.fixtureTickWorld({...ctx,timestamp:new Timestamp(ctx.timestamp.microsSinceUnixEpoch+1_000_000n)},0n);
 assert.equal([...f.db.conversation.iter()].filter(c=>c.active).length,1);
 assert.equal([...f.db.llmJob.iter()].length,1);
});
