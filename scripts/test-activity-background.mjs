import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';import {test} from 'node:test';import ts from 'typescript';
const settle=async()=>{await new Promise(resolve=>setImmediate(resolve));await new Promise(resolve=>setImmediate(resolve));};
test('town reopening only synchronizes stored summaries for its owned target; no renderer model work',async()=>{
 let enabled=false,processing=false,owned=true,calls=0,cleanup,timer,listener;
 const callbacks=[],exports={};
 const code=ts.transpileModule(readFileSync(new URL('../src/useActivityLearning.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const myMirrors={},myImports={};
 runInNewContext(code,{exports,setInterval:fn=>{timer=fn;return 1;},clearInterval(){},window:{addEventListener:(_e,fn)=>{listener=fn;},removeEventListener(){}},require(name){
 if(name==='react')return {useRef:value=>({current:value}),useEffect:fn=>{cleanup=fn();}};
 if(name==='spacetimedb/react')return {useSpacetimeDB:()=>({isActive:true,identity:{toHexString:()=> 'owned-identity'}}),useReducer:()=>async()=>{},useTable:table=>[table===myMirrors?(owned?[{id:10n}]:[]):(processing?[{mirrorId:10n,status:'processing'}]:[]),true]};
 if(name==='./module_bindings')return {reducers:{importWriting:{}},tables:{myMirrors,myImports}};
 if(name==='./desktopObserver')return {isNativeDesktop:()=>true};
 if(name==='./activityMemory')return {ACTIVITY_CHANGED:'changed',activityScope:x=>x,activityRequest:async()=>({enabled,scope:'owned-identity',mirrorId:'10',captureEnabled:false})};
 if(name==='./activityReports')return {syncStoredReports:async(scope,id,_deliver,allowed)=>{calls++;assert.equal(scope,'owned-identity');assert.equal(id,10n);callbacks.push(allowed);assert.ok(allowed());}};
 }});
 exports.useActivityLearning();await settle();assert.equal(calls,0);
 enabled=true;listener();await settle();assert.equal(calls,1,'cached summaries sync even while observation is paused');
 cleanup();timer();await settle();assert.equal(calls,1);assert.equal(callbacks[0](),false,'closed town invalidates further imports');
 owned=false;exports.useActivityLearning();await settle();assert.equal(calls,1,'other-owned target cannot sync');cleanup();
 owned=true;processing=true;exports.useActivityLearning();await settle();assert.equal(calls,1,'wait for current import before next batch');cleanup();
});
