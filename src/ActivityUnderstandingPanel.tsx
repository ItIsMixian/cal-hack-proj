import {useEffect,useRef,useState} from 'react';
import {useReducer,useSpacetimeDB,useTable} from 'spacetimedb/react';
import {reducers,tables} from './module_bindings';
import {ACTIVITY_CHANGED,activityRequest,activityScope} from './activityMemory';
import {reportState,reportJobs,reportLabel,reportGift,deliverReport,type ReportState} from './activityReports';
import type {WordGift} from './WordOffering';

export default function ActivityUnderstandingPanel({onReady,busy,mirrorId}:{onReady:(gift:WordGift)=>void;busy:boolean;mirrorId?:bigint}) {
  const {identity}=useSpacetimeDB(),send=useReducer(reducers.importWriting);
  const [mine]=useTable(tables.myMirrors);
  const scope=identity?activityScope(identity.toHexString()):'';
  const [state,setState]=useState<ReportState|null>(null),[selected,setSelected]=useState(''),[error,setError]=useState(''),[working,setWorking]=useState(false),[version,setVersion]=useState(0);
  const alive=useRef(true),current=useRef(scope);current.current=scope;
  const allowed=()=>alive.current&&current.current===scope;
  const refresh=async()=>{if(!scope)return;try{const value=await reportState(scope);if(allowed())setState(value);}catch{if(allowed())setError('Restart the updated desktop app to read recent summaries.');}};
  useEffect(()=>{
    alive.current=true;setState(null);setSelected('');setError('');
    const change=()=>{setVersion(v=>v+1);void refresh();};void refresh();
    const timer=setInterval(()=>void refresh(),5000);window.addEventListener(ACTIVITY_CHANGED,change);
    return()=>{alive.current=false;clearInterval(timer);window.removeEventListener(ACTIVITY_CHANGED,change);};
  },[scope]);
  void version;
  const background=state?.background,active=background?.scope===scope&&background.enabled,observing=active&&background.captureEnabled;
  const targetMatches=background?.mirrorId===(mirrorId===undefined?'':String(mirrorId));
  const job=reportJobs.get(scope),blocked=busy||working||!!job?.busy;
  const pending=(state?.reports??[]).filter(r=>!state?.deliveries.some(d=>d.date===r.date&&d.hash===r.hash&&d.mirrorId===String(mirrorId))).length;
  const reports=state?.reports??[],report=reports.find(r=>r.date===selected)??reports[0];
  const index=report?reports.findIndex(r=>r.date===report.date):0;
  const delivered=report&&mirrorId!==undefined&&state?.deliveries.some(d=>d.date===report.date&&d.hash===report.hash&&d.mirrorId===String(mirrorId));
  const toggle=async(enabled:boolean)=>{
    setWorking(true);setError('');
    try {
      const ownBackground=mine.find(m=>m.id===mirrorId)?.selfCard.slice(0,3000)??'';
      await activityRequest('backgroundConfigure',{scope,enabled,...(mirrorId===undefined?{}:{mirrorId:String(mirrorId)}),background:ownBackground});
      await refresh();
    }catch{setError('Could not start observation. Check the local observer connection.');}
    finally{if(allowed())setWorking(false);}
  };
  const make=async()=>{
    setWorking(true);setError('');
    try{await activityRequest('backgroundRun',{scope});await refresh();}
    catch{setError('Could not summarize. Your notes remain on this computer.');}
    finally{if(allowed())setWorking(false);}
  };
  const handOver=async()=>{
    if(!report)return;
    if(mirrorId===undefined){onReady(reportGift(report));return;}
    setWorking(true);setError('');
    try{await deliverReport(scope,report,mirrorId,args=>send(args),allowed);await refresh();}
    catch{setError('This note has not been shared yet. Please try again.');}
    finally{if(allowed())setWorking(false);}
  };
  return <section className="activity-understanding" aria-label="Recent activity summaries">
    <p className="exchange-line">Let recent moments become a letter.</p>
    <p className="quiet-note">Mirrorville can summarize recent activity in the background while you are away. Only the summaries are shared with your mirror when you return.</p>
    <button className="exchange-primary" disabled={!scope||blocked} onClick={()=>void toggle(!observing||!targetMatches)}>{active&&!targetMatches?'Send notes to this mirror':observing?'Pause observation':active?'Resume observation':'Start observation'}</button>
    <small>{observing?'One note per hour, checking every 15 minutes. It continues after the town closes; pause it anytime from the tray.':'Uses DeepSeek to summarize window topics and your own messages from recent Codex conversations.'}{mirrorId===undefined?' Before you create a mirror, notes stay on this computer.':''}</small>
    {pending>0&&<small role="status">{pending} notes ready. {active&&targetMatches?'They will be shared when you return.':'They remain on this computer until shared with this mirror.'}</small>}

    {reports.length>1&&<nav className="observation-controls" aria-label="Choose a time period"><button disabled={blocked||index>=reports.length-1} onClick={()=>setSelected(reports[index+1].date)}>← Previous</button><button disabled={blocked||index===0} onClick={()=>setSelected(reports[index-1].date)}>Next →</button></nav>}
    {report?<article className="activity-note"><small>{reportLabel(report.date)}</small><p className="activity-note-text">{report.text}</p><small>{delivered?'Shared with your mirror as recent context.':'Saved on this computer.'}</small>{!delivered&&<button disabled={blocked} onClick={()=>void handOver()}>{mirrorId===undefined?'Use this note to meet me':'Share with my mirror'}</button>}</article>:<p className="activity-empty">{background?.busy?'Writing a note about this time period…':'No recent notes yet. Use your computer normally and return to read a summary.'}</p>}
    <button disabled={blocked||!active||background?.busy||!state?.days.length} onClick={()=>void make()}>{background?.busy?'Summarizing…':'Summarize the latest period'}</button>
    <details className="quiet-note"><summary>Observation settings</summary><p>Closing the town leaves observation in the system tray. Pause observation stops collecting and summarizing; Quit observation in the tray stops it completely.</p><label className="activity-auto"><input type="checkbox" checked={state?.codexEnabled??false} disabled={blocked} onChange={event=>{void activityRequest('codexAuto',{enabled:event.target.checked}).then(()=>refresh()).catch(()=>setError('Could not change the Codex source setting.'));}}/>Include my own messages from recent Codex conversations</label><label className="activity-auto"><input type="checkbox" checked={background?.browserTopics??false} disabled={blocked||!background} onChange={event=>{void activityRequest('capture',{enabled:background?.captureEnabled===true,browserTopics:event.target.checked,contextTitles:true}).then(()=>refresh()).catch(()=>setError('Could not change the browser topics setting.'));}}/>Include current browser page topics (off by default)</label><label className="activity-auto"><input type="checkbox" checked={background?.startup??false} disabled={blocked||!background} onChange={event=>{void activityRequest('backgroundStartup',{enabled:event.target.checked}).then(()=>refresh()).catch(()=>setError('Could not change the startup setting.'));}}/>Resume observation when I sign in to Windows</label><p>Raw titles and messages are never shared with your mirror. No screenshots, clipboard or keystrokes are collected. Summaries are not used to imitate your voice or enable public sharing of personal cards.</p><button disabled={blocked} onClick={()=>{void activityRequest('clear',{}).then(()=>{window.dispatchEvent(new Event(ACTIVITY_CHANGED));return refresh();}).catch(()=>setError('Could not clear local records.'));}}>Clear local records and pause</button></details>
    {(error||job?.error||background?.error)&&<p role="alert">{error||job?.error||background?.error}</p>}
  </section>;
}
