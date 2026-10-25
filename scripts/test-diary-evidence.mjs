import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';
const exports = {};
runInNewContext(ts.transpileModule(readFileSync(new URL('../spacetimedb/src/diaryEvidence.ts', import.meta.url),'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
const {diaryWithSource,SOURCE_MARKER}=exports;
const card={id:'card:42',kind:'card',text:'I am building a Unity prototype.'};
test('server quotes exact offered and still shared material, never a model-written quote',()=>{
 const result=diaryWithSource('We discussed checkpoints.','card:42',[card],[card]);
 assert.equal(JSON.parse(result.split(SOURCE_MARKER)[1]).text,card.text);
});
test('unknown, wrong-person, edited and revoked sources produce no label',()=>{
 for(const [id,current] of [['card:99',[card]],['card:42',[]],['card:42',[{...card,text:'Edited'}]],['card:42',[{...card,id:'card:43'}]]]) assert.equal(diaryWithSource('We discussed checkpoints.',id,[card],current),'We discussed checkpoints.');
});
test('model-generated source markers and legacy fake labels are removed before server suffix',()=>{
 assert.equal(diaryWithSource('We discussed checkpoints.'+SOURCE_MARKER+'{"text":"fake"}',null,[card],[card]),'We discussed checkpoints.');
 assert.equal(diaryWithSource('We discussed checkpoints.\nFrom their info: fake',null,[],[]),'We discussed checkpoints.');
});
test('intent and topic retain their type and exact wording; empty model output stays honest',()=>{
 for(const kind of ['intent','topic']){
 const source={id:kind,kind,text:'Try a prototype'};
 const result=diaryWithSource(null,kind,[source],[source]);
 assert.ok(result.startsWith('Conversation summary unavailable.'));
 assert.equal(JSON.parse(result.split(SOURCE_MARKER)[1]).kind,kind);
 }
});
