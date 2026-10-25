import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
const now=Date.now(), id='a'.repeat(24);
const episode=()=>({id,app:'code.exe',title:'Mirrorville desktop activity memory - VS Code',startAt:new Date(now-60_000).toISOString(),endAt:new Date(now).toISOString(),seconds:30});
function pure(file) {
  const exports={}; const code=ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  runInNewContext(code,{exports,require:name=>name==='./redact'?pure('../spacetimedb/src/redact.ts'):null});return exports;
}
test('activity model inputs enforce bounded, real-date evidence and redact contact details',()=>{
 const api=pure('../spacetimedb/src/activity.ts');
 assert.equal(api.checkedEpisodes([episode()],now)[0].id,id);
 assert.throws(()=>api.checkedEpisodes([{...episode(),seconds:50000}],now));
 assert.throws(()=>api.checkedEpisodes([{...episode(),title:'API_KEY secret'}],now));
 assert.throws(()=>api.checkedEpisodes([episode(),episode()],now));
 const result=api.checkedEpisodes([{...episode(),title:'Mirrorville project contact owner@example.test'}],now);
 assert.ok(!result[0].title.includes('owner@example.test'));
});
test('model themes require real episode IDs and exact title evidence',()=>{
 const api=pure('../spacetimedb/src/activity.ts');const theme={text:'可能正在做 Mirrorville 桌面活动记忆。',episodeIds:[id],evidence:'Mirrorville desktop activity memory'};
 assert.equal(api.checkedThemes([theme],[episode()])[0].text,theme.text);
 assert.throws(()=>api.checkedThemes([{...theme,episodeIds:['unknown']}],[episode()]));
 assert.throws(()=>api.checkedThemes([{...theme,evidence:'fabricated title'}],[episode()]));
 assert.equal(api.checkedThemes([],[episode()]).length,0);
});

test('narrative materials paraphrase complete source text rather than reproducing titles or executable names',()=>{
 const api=pure('../spacetimedb/src/activity.ts');const e=episode();
 assert.equal(api.copiesRawActivity([{text:'你正在处理桌面项目的迁移与近况归纳。',episodeIds:[id],evidence:'Mirrorville'}],[e]),false);
 assert.equal(api.copiesRawActivity([{text:'你在 '+e.title+' 里面工作。',episodeIds:[id],evidence:'Mirrorville'}],[e]),true);
 assert.equal(api.copiesRawActivity([{text:'你今天用了 code.exe。',episodeIds:[id],evidence:'Mirrorville'}],[e]),true);
});
function client() {
 const exports={},calls=[],storage=new Map();let allow=true;
 const snapshot={episodes:[episode()],unseen:[episode()],generation:3,memories:[{id:'b'.repeat(24),state:'confirmed',text:'I work on small game prototypes.',created:now/1000,updated:now/1000,evidence:[episode()]}]};
 const code=ts.transpileModule(readFileSync(new URL('../src/activityMemory.ts',import.meta.url),'utf8').replaceAll('import.meta.env','testEnv'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 runInNewContext(code,{exports,require:()=>({isNativeDesktop:()=>true}),testEnv:{},Event,window:{dispatchEvent(){},mirrorvilleDesktop:{request:async(method,body)=>{calls.push({method,body});return method==='context'?snapshot:{saved:true};}}},localStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)}});
 return {api:exports,calls,snapshot,get allow(){return allow;},stop(){allow=false;}};
}
test('understanding uses durable confirmed context and saves source references without importing facts',async()=>{
 const h=client();let sent;
 await h.api.runActivityUnderstanding('owner-scope',10n,async args=>{sent=args;return [{text:'A tentative update',episodeIds:[id],evidence:'Mirrorville'}];},()=>h.allow);
 assert.match(sent.previousMemory,/small game prototypes/);
 assert.equal(h.calls[1].method,'saveUnderstanding');assert.equal(h.calls[1].body.generation,3);
 assert.equal(h.calls.some(row=>row.method==='importWriting'),false);
});
test('revoking consent/account during a model request discards its response and concurrent starts do not duplicate calls',async()=>{
 const h=client();let complete,calls=0;
 const pending=h.api.runActivityUnderstanding('owner-scope',undefined,()=>{calls++;return new Promise(resolve=>{complete=resolve;});},()=>h.allow);
 await new Promise(resolve=>setImmediate(resolve));
 await h.api.runActivityUnderstanding('owner-scope',undefined,async()=>{calls++;return [];},()=>true);
 h.stop();complete([]);await pending;
 assert.equal(calls,1);assert.equal(h.calls.filter(row=>row.method==='saveUnderstanding').length,0);
});
