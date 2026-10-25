import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import ts from 'typescript';
import {webcrypto} from 'node:crypto';
function harness(){
 const scope='owner-scope',date='2026-10-25T09:00-0700',id='a'.repeat(24),hash='b'.repeat(24),storage=new Map(),calls=[];
 const state={reports:[],deliveries:[],days:[{date,hash,count:2}],generation:0,codexEnabled:true};
 const episode={id,app:'Codex conversation',title:'需要把 Marglo 的近况整理接入 Mirrorville。',startAt:new Date().toISOString(),endAt:new Date().toISOString(),seconds:1};
 const request=async(method,body)=>{
  calls.push({method,body});
  if(method==='dailyReports')return structuredClone(state);
  if(method==='dailyContext')return {episodes:[episode],hash,generation:0,overview:{moments:2},previousReports:[]};
  if(method==='saveDailyReport')state.reports=[{date,hash,text:body.themes[0].text,latestAt:episode.endAt,updated:Date.now()/1000}];
  if(method==='dailyDelivered')state.deliveries.push({date:body.date,hash:body.hash,mirrorId:body.mirrorId});
  return {saved:true};
 };
 const exports={},code=ts.transpileModule(readFileSync(new URL('../src/activityReports.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 runInNewContext(code,{exports,Date,Event,Error,TextEncoder,crypto:webcrypto,window:{dispatchEvent(){}},localStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)},require:()=>({activityRequest:request,ACTIVITY_CHANGED:'changed'})});
 return {api:exports,scope,date,id,hash,state,calls};
}
test('time-period narrative alone becomes AI-summary material, with no excerpt or verification UI payload',async()=>{
 const h=harness(),sent=[];let modelInput;
 const summary='你这段时间围绕桌面小镇的近况整理展开讨论，希望延续原有日报的叙述方式，把整理后的背景材料提供给角色，而不是逐条核对窗口和会话。';
 await h.api.runPeriodReport(h.scope,9n,async input=>{modelInput=input;return [{text:summary,episodeIds:[h.id],evidence:'Marglo'}];},()=>true,async args=>sent.push(args));
 assert.equal(JSON.parse(modelInput.previousMemory).mode,'period-report');assert.match(modelInput.previousMemory,/09:00–10:00/);
 assert.equal(sent.length,1);assert.equal(sent[0].inputKind,'ai_summary');assert.equal(sent[0].relation,'other');assert.match(sent[0].text,new RegExp(summary));
 assert.doesNotMatch(sent[0].text,/需要把 Marglo/);assert.equal(h.state.deliveries.length,1);
 await h.api.runPeriodReport(h.scope,9n,async()=>{throw new Error('must not regenerate unchanged period');},()=>true,async args=>sent.push(args));
 assert.equal(sent.length,1);
});
test('consent revoked during model call does not save or deliver a summary',async()=>{
 const h=harness();let allowed=true;
 await h.api.runPeriodReport(h.scope,9n,async()=>{allowed=false;return [{text:'Model text',episodeIds:[h.id],evidence:'Marglo'}];},()=>allowed,async()=>assert.fail('must not deliver'));
 assert.equal(h.calls.some(c=>c.method==='saveDailyReport'),false);
});
test('failed material submission is retryable and is never marked delivered',async()=>{
 const h=harness();h.state.reports=[{date:h.date,hash:h.hash,text:'A saved summary',latestAt:new Date().toISOString(),updated:1}];
 await h.api.runPeriodReport(h.scope,9n,async()=>assert.fail('must deliver waiting report first'),()=>true,async()=>{throw new Error('server unavailable');});
 assert.equal(h.state.deliveries.length,0);assert.match(h.api.reportJobs.get(h.scope).error,/server unavailable/);
 h.state.reports=[];
 await h.api.deliverReport(h.scope,{date:h.date,hash:h.hash,text:'cleared',latestAt:new Date().toISOString(),updated:1},9n,async()=>assert.fail('cleared report must not be sent'),()=>true);
});

test('an empty current period is checkpointed so older periods can still be summarized',async()=>{
 const h=harness();
 h.state.days.push({date:'2026-10-25T08:00-0700',hash:'c'.repeat(24),count:5});
 await h.api.runPeriodReport(h.scope,undefined,async()=>[],()=>true);
 await h.api.runPeriodReport(h.scope,undefined,async()=>[],()=>true);
 const periods=h.calls.filter(c=>c.method==='dailyContext').map(c=>c.body.date);
 assert.deepEqual(periods,[h.date,'2026-10-25T08:00-0700']);
});

test('reopening batches only narrative material and recovers a lost receipt without a duplicate import',async()=>{
 const h=harness(),sent=[];
 h.state.reports=[{date:h.date,hash:h.hash,text:'A narrative update, not raw source.',latestAt:new Date().toISOString(),updated:1}];
 await h.api.syncStoredReports(h.scope,9n,async args=>sent.push(args),()=>true,[]);
 assert.equal(sent.length,1);assert.match(sent[0].source,/Desktop summaries · [a-f0-9]{24}/);assert.equal(sent[0].inputKind,'ai_summary');
 assert.doesNotMatch(sent[0].text,/需要把 Marglo/);assert.equal(h.state.deliveries.length,1);
 h.state.deliveries=[];
 await h.api.syncStoredReports(h.scope,9n,async()=>assert.fail('accepted import must not repeat'),()=>true,[{mirrorId:9n,source:sent[0].source,status:'processing'}]);
 assert.equal(h.state.deliveries.length,1);
});
