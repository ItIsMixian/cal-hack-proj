import {useEffect,useRef} from 'react';
import {useReducer,useSpacetimeDB,useTable} from 'spacetimedb/react';
import {reducers,tables} from './module_bindings';
import {isNativeDesktop} from './desktopObserver';
import {ACTIVITY_CHANGED,activityScope,activityRequest} from './activityMemory';
import {syncStoredReports,type BackgroundState} from './activityReports';

// Only the signed-in town window may synchronize material into an owned Mirror.
// Capture and model work belong entirely to the independent background process.
export function useActivityLearning(){
  const {identity,isActive}=useSpacetimeDB();
  const native=isNativeDesktop();
  const deliver=useReducer(reducers.importWriting);
  const [mine,mineReady]=useTable(tables.myMirrors,{enabled:native}),[imports,importsReady]=useTable(tables.myImports,{enabled:native});
  const latest=useRef({deliver,mine,imports});latest.current={deliver,mine,imports};
  const owner=identity?.toHexString()??'';
  useEffect(()=>{
    if(!isNativeDesktop()||!isActive||!owner||!mineReady||!importsReady)return;
    const scope=activityScope(owner);let alive=true,running=false;
    const poll=async()=>{
      if(!alive||running)return;running=true;
      try{
        const config=await activityRequest('backgroundStatus',{}) as unknown as BackgroundState;
        if(!alive||!config.enabled||config.scope!==scope||!/^\d+$/.test(config.mirrorId))return;
        const mirrorId=BigInt(config.mirrorId);
        const allowed=()=>alive&&latest.current.mine.some(m=>m.id===mirrorId);
        if(!allowed()||latest.current.imports.some(row=>row.mirrorId===mirrorId&&row.status==='processing'))return;
        await syncStoredReports(scope,mirrorId,async args=>{
          const current=await activityRequest('backgroundStatus',{}) as unknown as BackgroundState;
          if(!allowed()||!current.enabled||current.scope!==scope||current.mirrorId!==String(mirrorId))throw new Error('Notes remain on this computer until you return to their mirror.');
          return latest.current.deliver(args);
        },allowed,latest.current.imports);
      }catch{/* An absent background service never starts model work in the renderer. */}
      finally{running=false;}
    };
    const change=()=>void poll();void poll();const timer=setInterval(()=>void poll(),15_000);
    window.addEventListener(ACTIVITY_CHANGED,change);
    return()=>{alive=false;clearInterval(timer);window.removeEventListener(ACTIVITY_CHANGED,change);};
  },[owner,isActive,mineReady,importsReady]);
}
