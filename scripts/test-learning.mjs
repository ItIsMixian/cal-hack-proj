import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Execute the actual module callbacks with an in-memory transactional context.
// This covers domain logic; live subscriptions and model output are checked separately.
class Timestamp { constructor(value) { this.microsSinceUnixEpoch = value; } toISOString() { return new Date(Number(this.microsSinceUnixEpoch / 1000n)).toISOString(); } }
const identity = value => ({ value, toHexString() { return value; }, equals(other) { return value === other?.value; } });
const A = identity('a'), B = identity('b'), C = identity('c');
const builder = new Proxy({}, { get: () => () => builder });
const t = new Proxy({}, { get: () => () => builder });
let definitions;
const schema = tables => {
  definitions = tables;
  return Object.fromEntries(['reducer', 'procedure', 'view', 'init'].map(key => [key, (...args) => args.at(-1)]));
};
let verdict = null; let capturedPrompt = ''; let linePrompt = ''; let duringJudge = null;
let activityResponse=null,activityPayload='',duringActivity=null;
function load(path) {
  const exports = {};
  const require = name => {
    if (name === 'spacetimedb/server') return { schema, table: (options, columns) => ({ options, columns, rowType: builder }), t, SenderError: Error };
    if (name === 'spacetimedb') return { Timestamp, ScheduleAt: { time: x => x, interval: x => x } };
    if (name === './llm') return { chatWithDeepSeek: (_ctx, _cfg, prompt,messages) => { linePrompt = prompt; if ((prompt.includes('desktop activity into private') || prompt.includes('近况总结生成器'))) {activityPayload=messages[0].content;duringActivity?.();return JSON.stringify(typeof activityResponse==='function'?activityResponse():activityResponse);} return 'Hello there.'; }, judge: (_ctx, _cfg, _system, prompt) => { capturedPrompt = prompt; duringJudge?.(); if (verdict instanceof Error) throw verdict; return JSON.stringify(verdict); }, parseJsonObject: text => { try { return JSON.parse(text); } catch { return null; } } };
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
    const pk = ['guestTransfer','activityBudget'].includes(name) ? 'owner' : ['mirrorProfile', 'mirrorRest', 'mirrorSummary', 'mirrorLearning', 'mirrorStyle'].includes(name) ? 'mirrorId' : ['tickTimer', 'llmJob', 'importJob'].includes(name) ? 'scheduledId' : 'id';
    const equal = (a, b) => typeof a?.equals === 'function' ? a.equals(b) : a === b;
    const table = {
      iter: () => rows.values(), count: () => BigInt(rows.size),
      insert(row) { const value = { ...row, [pk]: row[pk] === 0n ? seq++ : row[pk] }; rows.set(value[pk], value); return value; },
    };
    for (const col of Object.keys(def.columns)) table[col] = {
      find: value => [...rows.values()].find(row => equal(row[col], value)),
      filter: value => [...rows.values()].filter(row => equal(row[col], value)).values(),
      update: row => rows.set(row[pk], { ...row }), delete: value => rows.delete(value),
    };
    for (const index of def.options.indexes ?? []) table[index.accessor] = {
      filter: values => [...rows.values()].filter(row => index.columns.every((col, i) => equal(row[col], values[i]))).values(),
    };
    db[name] = table;
  }
  const now = new Timestamp(1_792_889_200_000_000n);
  const ctx = sender => ({ sender, timestamp: now, db, random: Object.assign(() => 0.5, { integerInRange: (lo) => lo }), senderAuth: { jwt: null }, withTx(fn) { return fn(this); } });
  for (const [id, owner, name] of [[10n, A, 'Alice'], [20n, B, 'Bob']]) {
    db.mirror.insert({ id, name, demo: id === 20n && demo, intent: 'Build accessible charts together', activity: 'working', conversationId: 30n });
    db.mirrorProfile.insert({ mirrorId: id, owner, selfCard: 'I build accessible charts', contact: `${name}@example.test` });
  }
  db.config.insert({ id: 0, deepseekKey: 'test', anthropicKey: '' });
  db.conversation.insert({ id: 30n, a: 10n, b: 20n, turns: 2, active: true, maxTurns: 4, place: 'park' });
  const wrap = () => mod.runLlmJob(ctx(A), { job: { conversationId: 30n, kind: 'wrap' } });
  const entries = owner => mod.myDiary(ctx(owner));
  return { db, ctx, wrap, entries };
}

const learning = load(new URL('../spacetimedb/src/learning.ts', import.meta.url));
const sample = 'I build small games and tools. I keep messages short. Can we try a smaller version first? I would rather test it before adding more. That is enough for today. I like plain questions and direct replies.';
const response = () => ({ summary: 'You build small games.', cards: [{ id: null, facet: 'professional', text: 'Builds small games.', personal: false }], style: { text: 'Short, direct questions. No elaborate metaphors.', examples: ['Can we try it?', 'That seems fine.', 'What comes next?', 'Let us check first.', 'I need a moment.'] } });
function queue(f, kind = 'writing', extra = {}) {
  mod.importWriting(f.ctx(A), { mirrorId: 10n, relation: 'other', source: kind === 'ai_summary' ? "Your AI’s summary" : 'Your messages', text: sample, latestAt: '', inputKind: kind, ...extra });
  return [...f.db.importJob.iter()].at(-1);
}
function run(f, job) { verdict = response(); mod.runImport(f.ctx(A), { job }); }

test('three-word creation preserves legacy TIPI creation without fabricating facts', () => {
  const f = fixture();
  mod.createMirrorOnboarding(f.ctx(C), { name: 'New mirror', look: 0, words: ['slow to warm up', 'night owl', 'always tinkering'], outgoing: false, intent: '', topic: '', text: '', inputKind: 'facts', relation: 'other', latestAt: '' });
  const mirror = [...f.db.mirrorProfile.owner.filter(C)][0];
  assert.match(mirror.selfCard, /Nothing else is known/);
  assert.equal(f.db.mirrorLearning.mirrorId.find(mirror.mirrorId).words.split(', ').length, 3);
  assert.equal(f.db.mirror.id.find(mirror.mirrorId).extraversion, 0.25);
  assert.equal(f.db.importJob.count(), 0n);
  assert.throws(() => learning.starterCard(['night owl', 'night owl', 'unknown']));
  assert.equal(typeof mod.createMirror, 'function');
});

test('creation queues its own redacted import atomically with an explicit input kind', () => {
  const f = fixture();
  mod.createMirrorOnboarding(f.ctx(C), { name: 'Import test', look: 0, words: [], outgoing: false, intent: '', topic: '', text: sample + ' mail test@example.test', inputKind: 'ai_summary', relation: 'friends', latestAt: '' });
  const job = [...f.db.importJob.iter()][0];
  assert.equal(job.inputKind, 'ai_summary'); assert.equal(job.relation, 'other');
  assert.ok(!job.text.includes('test@example.test')); assert.equal(job.owner, C);
  assert.ok(f.db.mirrorProfile.mirrorId.find(job.mirrorId));
});

test('AI summaries and AI chats cannot write style, even if the model returns it', () => {
  for (const kind of ['ai_summary', 'ai_chat', 'facts']) {
    const f = fixture(); const job = queue(f, kind); run(f, job);
    assert.equal(f.db.importStatus.id.find(job.statusId).status, 'done');
    assert.equal(f.db.mirrorStyle.count(), 0n); assert.equal(f.db.mirrorCard.count(), 1n);
  }
  const f = fixture(); const job = queue(f, 'writing', { relation: 'ai' });
  assert.equal(job.inputKind, 'ai_chat');
});

test('own messages create a private style; owner corrections and votes survive a later import', () => {
  const f = fixture(); run(f, queue(f));
  let row = f.db.mirrorStyle.mirrorId.find(10n);
  assert.equal(learning.readExamples(row.examples).length, 5);
  mod.markStyleExample(f.ctx(A), { mirrorId: 10n, index: 0, expectedText: 'Can we try it?', verdict: 'yes' });
  mod.markStyleExample(f.ctx(A), { mirrorId: 10n, index: 1, expectedText: 'That seems fine.', verdict: 'no' });
  mod.editMirrorStyle(f.ctx(A), { mirrorId: 10n, text: 'Very plain. No jokes.' });
  const job = queue(f); verdict = response(); verdict.cards = [{ id: '1', facet: 'professional', text: 'Builds small games.', personal: false }];
  mod.runImport(f.ctx(A), { job }); row = f.db.mirrorStyle.mirrorId.find(10n);
  assert.equal(row.text, 'Very plain. No jokes.');
  assert.equal(learning.readExamples(row.examples).filter(r => r.verdict).length, 2);
  assert.equal(mod.myStyle(f.ctx(B)).length, 0); assert.equal(mod.myStyle(f.ctx(A)).length, 1);
  assert.equal(definitions.mirrorStyle.options.public, undefined);
  assert.throws(() => mod.markStyleExample(f.ctx(B), { mirrorId: 10n, index: 0, expectedText: 'Can we try it?', verdict: 'yes' }), /Not your mirror/);
  assert.throws(() => mod.markStyleExample(f.ctx(A), { mirrorId: 10n, index: 0, expectedText: 'stale example', verdict: 'yes' }), /Examples changed/);
});

test('daily questions skip without imports and allow only one answer or skip per venue day', () => {
  const f = fixture();
  mod.answerDailyQuestion(f.ctx(A), { mirrorId: 10n, text: '' });
  assert.equal(f.db.importJob.count(), 0n);
  assert.throws(() => mod.answerDailyQuestion(f.ctx(A), { mirrorId: 10n, text: 'I build games.' }), /already/);
  const tomorrow = { ...f.ctx(A), timestamp: new Timestamp(f.ctx(A).timestamp.microsSinceUnixEpoch + 86_400_000_000n) };
  mod.answerDailyQuestion(tomorrow, { mirrorId: 10n, text: 'I am building a garden game.' });
  assert.equal(f.db.importJob.count(), 1n);
  const job = [...f.db.importJob.iter()][0]; assert.equal(job.inputKind, 'writing');
  assert.equal(job.latestAt, tomorrow.timestamp.toISOString());
});

test('model failure preserves existing cards and records a retryable failure', () => {
  const f = fixture(); const job = queue(f); verdict = new Error('offline'); mod.runImport(f.ctx(A), { job });
  assert.equal(f.db.importStatus.id.find(job.statusId).status, 'failed'); assert.equal(f.db.mirrorStyle.count(), 0n);
  assert.equal(f.db.mirrorCard.count(), 0n);
});

test('venue calendar handles midnight and daylight saving independently of town days', () => {
  const date = iso => learning.venueDay(BigInt(Date.parse(iso)) * 1000n);
  assert.equal(date('2026-10-25T06:59:59Z'), '2026-10-24');
  assert.equal(date('2026-10-25T07:00:00Z'), '2026-10-25');
  assert.equal(date('2026-11-01T08:59:00Z'), date('2026-11-01T09:01:00Z'));
});

test('line writing includes only the speaker style and only today’s optional topic', () => {
  const f = fixture();
  f.db.mirrorStyle.insert({ mirrorId: 10n, owner: A, text: 'A_PRIVATE_STYLE', examples: '[{"text":"Plain hello","verdict":"yes"},{"text":"Fancy metaphor","verdict":"no"}]', editedByOwner: true });
  f.db.mirrorStyle.insert({ mirrorId: 20n, owner: B, text: 'B_PRIVATE_STYLE', examples: '[]', editedByOwner: true });
  const state = { mirrorId: 10n, owner: A, words: '', dailyDay: '', dailyCount: 0, topic: 'TODAY_TOPIC', topicDay: learning.venueDay(f.ctx(A).timestamp.microsSinceUnixEpoch), reviewed: true };
  f.db.mirrorLearning.insert(state);
  mod.runLlmJob(f.ctx(A), { job: { conversationId: 30n, kind: 'line' } });
  assert.match(linePrompt, /A_PRIVATE_STYLE/); assert.ok(!linePrompt.includes('B_PRIVATE_STYLE'));
  assert.match(linePrompt, /Plain hello/); assert.match(linePrompt, /Fancy metaphor/); assert.match(linePrompt, /TODAY_TOPIC/);
  f.db.mirrorLearning.mirrorId.update({ ...state, topicDay: '2000-01-01' });
  f.db.conversation.id.update({ ...f.db.conversation.id.find(30n), turns: 2 });
  mod.runLlmJob(f.ctx(A), { job: { conversationId: 30n, kind: 'line' } });
  assert.ok(!linePrompt.includes('TODAY_TOPIC'));
});


test('invalid style output fails before applying any card or summary changes', () => {
  const f = fixture(); const job = queue(f); verdict = response(); verdict.style.examples = ['Only one'];
  mod.runImport(f.ctx(A), { job });
  assert.equal(f.db.importStatus.id.find(job.statusId).status, 'failed');
  assert.equal(f.db.mirrorCard.count(), 0n); assert.equal(f.db.mirrorSummary.count(), 0n);
});

test('a card edit during model HTTP prevents stale full replacement', () => {
  const f = fixture(); const job = queue(f); verdict = response();
  duringJudge = () => f.db.mirrorCard.insert({ id: 99n, mirrorId: 10n, owner: A, facet: 'core', text: 'Owner wrote this', source: 'Written by you', personal: false, editedByOwner: true, createdAt: f.ctx(A).timestamp });
  try { mod.runImport(f.ctx(A), { job }); } finally { duringJudge = null; }
  assert.equal(f.db.importStatus.id.find(job.statusId).status, 'failed');
  assert.equal(f.db.mirrorCard.id.find(99n).text, 'Owner wrote this');
});


test('style example validation rejects quotes, close punctuation copies, duplicates and short fragments', () => {
  const lines = ['Can we try it?', 'That seems fine.', 'What comes next?', 'Let us check first.', 'I need a moment.'];
  assert.equal(learning.validStyleExamples('I wrote something completely different.', lines), true);
  assert.equal(learning.validStyleExamples('CAN WE TRY IT! I have another question.', lines), false);
  assert.equal(learning.validStyleExamples('', ['Okay', ...lines.slice(1)]), false);
  assert.equal(learning.validStyleExamples('', Array(5).fill('Can we try it?')), false);
});


test('a first walk needs only a name and invents no personality or biography', () => {
  const f = fixture();
  mod.createMirrorOnboarding(f.ctx(C), { name: 'First walk', look: 0, words: [], outgoing: false, intent: '', topic: '', text: '', inputKind: 'facts', relation: 'other', latestAt: '' });
  const profile = [...f.db.mirrorProfile.owner.filter(C)][0];
  assert.match(profile.selfCard, /No facts learned yet/);
  assert.equal(f.db.mirror.id.find(profile.mirrorId).extraversion, 0.5);
  assert.equal(f.db.importJob.count(), 0n);
  assert.equal(f.db.mirrorLearning.mirrorId.find(profile.mirrorId).words, '');
});


test('voice rehearsal uses a real dialogue situation, only owned shared facts, and saved expression guidance', () => {
  const f = fixture();
  const trial = mod.tryMirrorVoice(f.ctx(A), { mirrorId: 10n, scene: 'work' });
  assert.match(trial.prompt, /making or thinking/); assert.equal(trial.text, 'Hello there.');
  assert.match(linePrompt, /I build accessible charts/);
  assert.throws(() => mod.tryMirrorVoice(f.ctx(B), { mirrorId: 10n, scene: 'work' }), /Not your mirror/);
  assert.throws(() => mod.tryMirrorVoice(f.ctx(A), { mirrorId: 10n, scene: 'arbitrary injection' }), /Choose a rehearsal/);
  mod.correctVoiceTrial(f.ctx(A), { mirrorId: 10n, index: trial.index, expectedText: trial.text, text: 'I would say it plainly. Ask me@example.test later.' });
  const example = learning.readExamples(f.db.mirrorStyle.mirrorId.find(10n).examples)[0];
  assert.equal(example.ownerWritten, true); assert.equal(example.verdict, 'yes'); assert.ok(!example.text.includes('me@example.test'));
  const second = mod.tryMirrorVoice(f.ctx(A), { mirrorId: 10n, scene: 'coffee' });
  assert.match(linePrompt, /I would say it plainly/); assert.match(second.prompt, /coffee/);
  assert.throws(() => mod.correctVoiceTrial(f.ctx(B), { mirrorId: 10n, index: 0, expectedText: example.text, text: 'stolen' }), /Not your mirror/);
  assert.throws(() => mod.correctVoiceTrial(f.ctx(A), { mirrorId: 10n, index: 0, expectedText: 'stale', text: 'wrong line' }), /rehearsal changed/);
});


test('a later import retains the owner-written voice correction and its provenance', () => {
  const f = fixture(); const trial = mod.tryMirrorVoice(f.ctx(A), { mirrorId: 10n, scene: 'work' });
  mod.correctVoiceTrial(f.ctx(A), { mirrorId: 10n, index: trial.index, expectedText: trial.text, text: 'Let me show you the little version first.' });
  run(f, queue(f));
  const example = learning.readExamples(f.db.mirrorStyle.mirrorId.find(10n).examples).find(row => row.ownerWritten);
  assert.equal(example.text, 'Let me show you the little version first.');
  assert.equal(example.verdict, 'yes'); assert.match(example.prompt, /making or thinking/);
});


test('activity understanding authenticates selected profile, grounds output and leaves all facts untouched',()=>{
 const f=fixture(),ctx=f.ctx(A),at=Number(ctx.timestamp.microsSinceUnixEpoch/1000n);
 const episode={id:'a'.repeat(24),app:'code.exe',title:'Mirrorville desktop activity memory - VS Code',startAt:new Date(at-60_000).toISOString(),endAt:new Date(at).toISOString(),seconds:30};
 activityResponse={themes:[{text:'可能正在开发 Mirrorville 的桌面活动记忆。',episodeIds:[episode.id],evidence:'Mirrorville desktop activity memory'}]};
 assert.throws(()=>mod.understandActivity(f.ctx(B),{mirrorId:10n,episodes:[episode],previousMemory:''}),/Not your mirror/);
 const before=f.db.mirrorProfile.mirrorId.find(10n).selfCard;
 const result=mod.understandActivity(ctx,{mirrorId:10n,episodes:[episode],previousMemory:'Confirmed: I build game prototypes'});
 assert.equal(result.length,1);assert.match(activityPayload,/accessible charts/);assert.match(activityPayload,/game prototypes/);
 assert.equal(f.db.mirrorProfile.mirrorId.find(10n).selfCard,before);
 assert.equal(f.db.mirrorCard.count(),0n);
 assert.throws(()=>mod.understandActivity(ctx,{mirrorId:10n,episodes:[episode],previousMemory:''}),/wait/);
 activityResponse=null;
});

test('activity understanding rejects fabricated references and a changed owner after the model call',()=>{
 const make=()=>{const f=fixture(),ctx=f.ctx(A),at=Number(ctx.timestamp.microsSinceUnixEpoch/1000n);return {f,ctx,args:{mirrorId:10n,previousMemory:'',episodes:[{id:'a'.repeat(24),app:'code.exe',title:'Mirrorville activity memory - VS Code',startAt:new Date(at-60_000).toISOString(),endAt:new Date(at).toISOString(),seconds:30}]}};};
 let v=make();activityResponse={themes:[{text:'Some invented update',episodeIds:['forged'],evidence:'invented'}]};
 assert.throws(()=>mod.understandActivity(v.ctx,v.args),/evidence-based/);
 v=make();activityResponse={themes:[{text:'A supported tentative update',episodeIds:[v.args.episodes[0].id],evidence:'Mirrorville activity memory'}]};
 duringActivity=()=>{const old=v.f.db.mirrorProfile.mirrorId.find(10n);v.f.db.mirrorProfile.mirrorId.update({...old,owner:B});};
 try {assert.throws(()=>mod.understandActivity(v.ctx,v.args),/Ownership changed/);}finally {duringActivity=null;activityResponse=null;}
});

test('period summary rewrites copied raw titles once and rejects a second raw copy',()=>{
 const f=fixture(),ctx=f.ctx(A),at=Number(ctx.timestamp.microsSinceUnixEpoch/1000n);
 const episode={id:'f'.repeat(24),app:'code.exe',title:'Synthetic town - independent background narrative capture',startAt:new Date(at-60_000).toISOString(),endAt:new Date(at).toISOString(),seconds:30};
 const args={mirrorId:10n,episodes:[episode],previousMemory:JSON.stringify({mode:'period-report'})};
 const bad={themes:[{text:'你在 '+episode.title+' 里持续工作，讨论后台观察和近况整理。',episodeIds:[episode.id],evidence:'Synthetic town'}]};
 const good={themes:[{text:'你这个时段围绕桌面小镇的后台观察展开讨论，希望采集与近况归纳持续运行，打开小镇时再把这些材料带回角色。',episodeIds:[episode.id],evidence:'Synthetic town'}]};
 let calls=0;activityResponse=()=>++calls===1?bad:good;
 try{const result=mod.understandActivity(ctx,args);assert.equal(result[0].text,good.themes[0].text);assert.equal(calls,2);
  activityResponse=bad;const other=fixture();assert.throws(()=>mod.understandActivity(other.ctx(A),args),/evidence-based/);
 }finally{activityResponse=null;}
});
