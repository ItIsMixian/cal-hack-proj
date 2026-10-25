import {activityRequest,ACTIVITY_CHANGED,type ActivityEpisode,type ActivityTheme} from './activityMemory';
import type {WordGift} from './WordOffering';

export type ActivityReport={date:string;text:string;hash:string;latestAt:string;updated:number};
export type BackgroundState={enabled:boolean;scope:string;mirrorId:string;captureEnabled:boolean;browserTopics:boolean;busy:boolean;error:string;lastAt:number|null;startup:boolean;available:boolean};
export type ReportState={reports:ActivityReport[];deliveries:{date:string;mirrorId:string;hash:string}[];days:{date:string;hash:string;count:number}[];generation:number;codexEnabled:boolean;background?:BackgroundState};
type ReportConfig={enabled:boolean;mirrorId?:string};
export const reportJobs=new Map<string,{busy:boolean;error:string;lastAt?:number}>();
export function reportConfig(scope:string):ReportConfig {
  try {const v=JSON.parse(localStorage.getItem('mirrorville:period-reports:'+scope)??'{}');return {enabled:v.enabled===true,mirrorId:typeof v.mirrorId==='string'&&/^\d+$/.test(v.mirrorId)?v.mirrorId:undefined};}
  catch{return {enabled:false};}
}
export function setReportConfig(scope:string,value:ReportConfig) {
  localStorage.setItem('mirrorville:period-reports:'+scope,JSON.stringify(value));window.dispatchEvent(new Event(ACTIVITY_CHANGED));
}
export function reportLabel(value:string) {
  const m=/^(\d{4}-\d\d-\d\d)T(\d\d):00/.exec(value);
  return m?`${m[1]} · ${m[2]}:00–${String((Number(m[2])+1)%24).padStart(2,'0')}:00`:value;
}
export function reportGift(report:ActivityReport):WordGift {
  return {text:`[Recent summary · ${reportLabel(report.date)}]\n${report.text}`,inputKind:'ai_summary',relation:'other',source:'Desktop · time-period summary',latestAt:report.latestAt};
}
export async function reportState(scope:string):Promise<ReportState> {
  const raw=await activityRequest('dailyReports',{scope});
  if(!Array.isArray(raw.reports)||!Array.isArray(raw.days)||!Array.isArray(raw.deliveries)||!Number.isInteger(raw.generation))throw new Error('Could not read local summaries.');
  return raw as unknown as ReportState;
}
export async function deliverReport(scope:string,report:ActivityReport,mirrorId:bigint,deliver:(args:{mirrorId:bigint}&WordGift)=>Promise<unknown>,allowed:()=>boolean) {
  const state=await reportState(scope);
  if(!allowed()||!state.reports.some(r=>r.date===report.date&&r.hash===report.hash)||state.deliveries.some(row=>row.date===report.date&&row.mirrorId===String(mirrorId)&&row.hash===report.hash))return;
  await deliver({mirrorId,...reportGift(report)});
  // This is a local receipt for an already accepted import, even if the owner
  // leaves the room while the reducer acknowledgement is in flight.
  await activityRequest('dailyDelivered',{scope,date:report.date,hash:report.hash,mirrorId:String(mirrorId)});
}

export async function syncStoredReports(scope:string,mirrorId:bigint,
  deliver:(args:{mirrorId:bigint}&WordGift)=>Promise<unknown>,allowed:()=>boolean,
  imports:readonly {mirrorId:bigint;source:string;status:string}[]=[]){
  if(reportJobs.get(scope)?.busy)return;
  reportJobs.set(scope,{busy:true,error:''});window.dispatchEvent(new Event(ACTIVITY_CHANGED));
  try{
    const state=await reportState(scope);
    if(!allowed())return;
    const waiting=state.reports.filter(r=>!state.deliveries.some(d=>d.date===r.date&&d.hash===r.hash&&d.mirrorId===String(mirrorId)))
      .sort((a,b)=>a.latestAt.localeCompare(b.latestAt)).slice(0,24);
    if(!waiting.length)return;
    const bytes=new TextEncoder().encode(JSON.stringify([scope,String(mirrorId),waiting.map(r=>[r.date,r.hash])]));
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(n=>n.toString(16).padStart(2,'0')).join('').slice(0,24);
    const source='Desktop summaries · '+hash;
    const previous=imports.find(row=>row.mirrorId===mirrorId&&row.source===source);
    if(previous?.status==='failed')throw new Error('The previous note is still being read. Retry its import in the town first.');
    if(!allowed())return;
    if(!previous)await deliver({mirrorId,inputKind:'ai_summary',relation:'other',source,text:waiting.map(r=>reportGift(r).text).join('\n\n'),latestAt:waiting[waiting.length-1].latestAt});
    // A deterministic source key also lets reopen recover a lost native receipt
    // from this owner's existing import status without duplicating the reducer.
    for(const report of waiting)await activityRequest('dailyDelivered',{scope,date:report.date,hash:report.hash,mirrorId:String(mirrorId)});
    reportJobs.set(scope,{busy:false,error:'',lastAt:Date.now()});return waiting.length;
  }catch(e){reportJobs.set(scope,{busy:false,error:e instanceof Error?e.message:'Your notes remain on this computer and will be shared later.'});}
  finally{const job=reportJobs.get(scope);if(job)job.busy=false;window.dispatchEvent(new Event(ACTIVITY_CHANGED));}
}
export async function runPeriodReport(scope:string,mirrorId:bigint|undefined,
  summarize:(args:{mirrorId:bigint|undefined;episodes:ActivityEpisode[];previousMemory:string})=>Promise<ActivityTheme[]>,
  allowed:()=>boolean,deliver?: (args:{mirrorId:bigint}&WordGift)=>Promise<unknown>,period?:string) {
  if(reportJobs.get(scope)?.busy)return;
  const old=reportJobs.get(scope);reportJobs.set(scope,{...old,busy:true,error:''});window.dispatchEvent(new Event(ACTIVITY_CHANGED));
  try {
    const state=await reportState(scope);if(!allowed())return;
    const skipKey='mirrorville:period-skips:'+scope+':'+String(mirrorId??'none');
    let skipped:Record<string,string>={};
    try{skipped=JSON.parse(localStorage.getItem(skipKey)??'{}');}catch{/* A missing checkpoint is harmless. */}
    if(deliver&&mirrorId!==undefined) {
      const waiting=state.reports.find(r=>!state.deliveries.some(d=>d.date===r.date&&d.hash===r.hash&&d.mirrorId===String(mirrorId)));
      if(waiting){await deliverReport(scope,waiting,mirrorId,deliver,allowed);if(!period)return waiting;}
    }
    const day=period?state.days.find(d=>d.date===period):state.days.find(d=>skipped[d.date]!==d.hash&&!state.reports.some(r=>r.date===d.date&&r.hash===d.hash));
    if(!day)return;
    const raw=await activityRequest('dailyContext',{scope,date:day.date});
    const context=raw as unknown as {episodes:ActivityEpisode[];hash:string;generation:number;overview:unknown;previousReports:unknown};
    if(!Array.isArray(context.episodes)||!context.episodes.length||!allowed())return;
    const themes=await summarize({mirrorId,episodes:context.episodes,previousMemory:JSON.stringify({mode:'period-report',period:reportLabel(day.date),overview:context.overview,previousReports:context.previousReports}).slice(0,6000)});
    if(!allowed())return;
    if(!themes.length){
      // Sparse current-hour material must not starve older, meaningful periods.
      skipped[day.date]=context.hash;
      const recent=Object.fromEntries(Object.entries(skipped).sort(([a],[b])=>b.localeCompare(a)).slice(0,168));
      localStorage.setItem(skipKey,JSON.stringify(recent));
      reportJobs.set(scope,{busy:false,error:'',lastAt:Date.now()});return;
    }
    if(themes.length!==1)throw new Error('The summary format was invalid. Please try again later.');
    await activityRequest('saveDailyReport',{scope,date:day.date,hash:context.hash,generation:context.generation,episodeIds:context.episodes.map(e=>e.id),themes});
    const next=await reportState(scope),report=next.reports.find(r=>r.date===day.date);
    if(report&&deliver&&mirrorId!==undefined&&allowed())await deliverReport(scope,report,mirrorId,deliver,allowed);
    reportJobs.set(scope,{busy:false,error:'',lastAt:Date.now()});return report;
  }catch(e){reportJobs.set(scope,{...old,busy:false,error:e instanceof Error?e.message:'The summary could not finish. Notes remain on this computer.'});}
  finally {const job=reportJobs.get(scope);if(job)job.busy=false;window.dispatchEvent(new Event(ACTIVITY_CHANGED));}
}
