import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';
function load(path) {
  const exports = {};
  runInNewContext(ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    { exports, require: name => load(new URL(`${name}.ts`, path)), TextDecoder, Uint8Array });
  return exports;
}
const { mergePlan, recentAllowed, ownerWords } = load(new URL('../spacetimedb/src/fidelity.ts', import.meta.url));
const parsers = load(new URL('../src/importers.ts', import.meta.url));
const old = (id, facet = 'core', extra = {}) => ({ id: BigInt(id), facet, text: `They build board game ${id}`, source: 'WeChat · friends', personal: false, editedByOwner: false, ...extra });
const card = (id, facet = 'core', text = 'They build a chess teaching tool') => ({ id: id === null ? null : String(id), facet, text, personal: false });
test('full replacement merges, rewrites with existing ids, removes omitted and enforces two per facet', () => {
  const plan = mergePlan([old(1),old(2),old(3)], [card(1),card(null),card(null)], 'friends', 'WeChat · friends', true);
  assert.equal(plan.accepted.length,2); assert.deepEqual([...plan.remove], [2n,3n]);
  assert.match(plan.message, /3 cards merged into 2/); assert.match(plan.message,/1 new/); assert.match(plan.message,/1 rewritten/);
});
test('owner edits cannot be removed or overwritten and consume facet slots', () => {
  const cards = [old(1,'core',{editedByOwner:true}),old(2,'core',{editedByOwner:true}),old(3)];
  const plan = mergePlan(cards,[card(1,'humor'),card(null)],'friends','new',true);
  assert.equal(plan.accepted.length,0); assert.deepEqual([...plan.remove],[3n]);
});
test('AI input cannot create/rewrite humor or warmth; existing AI-only cards are removed', () => {
  const plan=mergePlan([old(1,'humor',{source:'AI assistant · ai'}),old(2,'warmth')],
    [card(1,'humor'),card(2,'warmth'),card(null,'humor'),card(null,'interests')],'ai','AI assistant · ai',true);
  assert.equal(plan.accepted.length,1); assert.equal(plan.accepted[0].facet,'interests');
  assert.deepEqual([...plan.remove],[1n,2n]);
});
test('unchanged human-sourced humor can survive an AI merge, owner-edited AI cards always survive', () => {
  const one=old(1,'humor'), two=old(2,'warmth',{editedByOwner:true,source:'AI assistant · ai'});
  const plan=mergePlan([one,two],[card(1,'humor',one.text)],'ai','AI assistant · ai',true);
  assert.equal(plan.accepted.length,1); assert.equal(plan.remove.length,0);
});
test('a later human chat may rewrite an AI-sourced work card into supported humor', () => {
  const plan=mergePlan([old(1,'core',{source:'AI assistant · ai'})],[card(1,'humor','They joke about chess blunders with friends')],'friends','WeChat · friends',true);
  assert.equal(plan.accepted.length,1); assert.equal(plan.accepted[0].source,'WeChat · friends');
});
test('stale or undated non-current imports cannot create/rewrite recent cards', () => {
  const now=Date.UTC(2026,9,24);
  assert.equal(recentAllowed('2025-08-24T00:00:00Z','currently',now),false);
  assert.equal(recentAllowed('','I used to play chess',now),false);
  assert.equal(recentAllowed('','I am currently building a chess tool',now),true);
  assert.equal(recentAllowed('2026-10-23T00:00:00Z','',now),true);
  assert.equal(recentAllowed('2027-10-23T00:00:00Z','',now),false);
  assert.equal(mergePlan([], [card(null,'recent')],'friends','old',false).accepted.length,0);
});
test('foreign ids, duplicate ids and malformed full collections reject before deletion', () => {
  for(const raw of [[card(99)],[card(1),card(1)],[{...card(1),facet:'invalid'}],[{...card(1),id:1}]])
    assert.throws(()=>mergePlan([old(1)],raw,'friends','test',true));
});
test('a model merge cannot silently declassify an existing private card', () => {
  const plan=mergePlan([old(1,'warmth',{personal:true})],[card(1,'warmth')],'friends','WeChat · friends',true);
  assert.equal(plan.accepted[0].personal,true);
});
test('view-only pronoun conversion uses word boundaries and preserves third-person storage', () => {
  const text='They teach their friends to challenge them and themselves; theme stays.';
  assert.equal(ownerWords(text),'You teach your friends to challenge you and yourself; theme stays.');
  assert.ok(text.startsWith('They'));
});
test('CSV newest date comes from kept sent plain text only', () => {
  const parsed=parsers.parseWeChatCsv('is_sender,type_name,msg,CreateTime\n1,文本,my words,2025-08-01 12:00:00\n0,文本,other,2026-10-24\n1,图片,media,2026-10-24');
  assert.equal(parsed.latestAt,'2025-08-01T00:00:00.000Z');
});
test('WhatsApp accepts two/four digit years and day-first when first number exceeds 12', () => {
  const chat=parsers.parseWhatsApp('31/12/23, 9:41 PM - Me: one\n12/30/2023, 9:42 PM - Me: two\n1/1/2024, 9:43 PM - Me: three');
  assert.equal(chat.latestAt,'2024-01-01T00:00:00.000Z');
  assert.equal(parsers.messageDate('31/02/24'),'');
});
test('scene markers and equal file budgets are explicit and bounded', () => {
  assert.equal(parsers.sourceScene('# Mirrorville scene: ai\nSome own words'),'ai');
  assert.equal(parsers.sourceScene('I talk with AI sometimes'),'other');
  const sampled=parsers.sampleFiles(['A'.repeat(30_000),'B'.repeat(30_000)]);
  assert.ok(sampled.length<=30_000); assert.equal(sampled.match(/A/g).length,sampled.match(/B/g).length);
});
