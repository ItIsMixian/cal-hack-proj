import assert from 'node:assert/strict';
import {test} from 'node:test';
import {randomBytes} from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import {ReportEngine} from '../desktop/app/report-engine.mjs';
import {serveAgent,requestAgent,agentPipe} from '../desktop/app/agent-transport.mjs';
import {validOperation} from '../desktop/app/policy.mjs';

const scope='activity|ws://127.0.0.1:3000|mirrorville|'+'a'.repeat(64);
function fixture(){
 const calls=[],date='2026-10-25T09:00-0700',hash='a'.repeat(24),id='b'.repeat(24);
 let capture=true,clock=100_000,complete;
 const state={days:[{date,hash}],reports:[]};
 const observer={async request(method,body){calls.push({method,body});if(method==='status')return {enabled:capture,contextTitles:true};if(method==='dailyReports')return state;if(method==='dailyContext')return {hash,generation:0,episodes:[{id,title:'Synthetic desktop project',app:'code.exe',seconds:60,startAt:new Date().toISOString(),endAt:new Date().toISOString()}],overview:{moments:1},previousReports:[]};if(method==='saveDailyReport')state.reports.push({date,hash,text:body.themes[0].text});return {};}};
 const engine=new ReportEngine({observer,config:{scope,enabled:true,mirrorId:'9',background:'Owned cached background'},now:()=>clock,summarize:args=>{calls.push({method:'model',args});return new Promise(resolve=>{complete=resolve;});}});
 return {engine,calls,state,set capture(value){capture=value;},set clock(value){clock=value;},complete(){complete([{text:'A synthetic meaningful narrative summary.',episodeIds:[id],evidence:'Synthetic'}]);}};
}
test('independent engine completes after a town client leaves and never imports or sends account credentials',async()=>{
 const h=fixture();const run=h.engine.run();await new Promise(setImmediate);
 assert.equal(h.engine.busy,true);h.complete();await run;
 assert.equal(h.state.reports.length,1);assert.equal(h.calls.find(c=>c.method==='model').args.mirrorId,undefined);
 assert.match(h.calls.find(c=>c.method==='model').args.previousMemory,/Owned cached background/);
 assert.equal(h.calls.some(c=>c.method==='importWriting'||c.method==='dailyDelivered'),false);
 h.clock=110_000;await h.engine.run();assert.equal(h.calls.filter(c=>c.method==='model').length,1);
});
test('pausing/changing owner discards an in-flight background result; paused capture makes no model request',async()=>{
 const h=fixture();const run=h.engine.run();await new Promise(setImmediate);
 await h.engine.configure({enabled:false});h.complete();await run;assert.equal(h.state.reports.length,0);
 const other=fixture();other.capture=false;await other.engine.run();assert.equal(other.calls.some(c=>c.method==='model'),false);
});
test('local pipe authenticates both ends, keeps Chinese intact and survives short-lived town clients',async()=>{
 const key=randomBytes(32).toString('hex'),pipe=agentPipe(path.join(os.tmpdir(),'mirrorville-test-'+randomBytes(8).toString('hex')));
 let calls=0;
 const server=await serveAgent(pipe,key,validOperation,async method=>{calls++;return {message:'小镇关闭后，小记仍会继续整理。',method};});
 try{
  const first=await requestAgent(pipe,key,'status');assert.match(first.message,/继续整理/);
  await assert.rejects(requestAgent(pipe,randomBytes(32).toString('hex'),'status',{},2000));
  await assert.rejects(requestAgent(pipe,key,'exec',{cmd:'private'},2000));
  const second=await requestAgent(pipe,key,'backgroundStatus');assert.equal(second.method,'backgroundStatus');assert.equal(calls,2);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
