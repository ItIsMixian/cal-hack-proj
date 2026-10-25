import { isNativeDesktop } from './desktopObserver';

export type ActivityEpisode = { id:string; app:string; title:string; startAt:string; endAt:string; seconds:number;source?:{threadId:string;label:string} };
export type ActivityTheme = {text:string;episodeIds:string[];evidence:string};
export type ActivityNote = {id:string;text:string;state:'draft'|'confirmed'|'dismissed';created:number;updated:number;evidence:ActivityEpisode[]};
export type ActivitySnapshot = {episodes:ActivityEpisode[];unseen:ActivityEpisode[];memories:ActivityNote[];generation:number};
export type LearningConfig = {enabled:boolean;mirrorId?:string};
export const ACTIVITY_CHANGED='mirrorville-activity-memory-changed';
export const learningJobs=new Map<string,{busy:boolean;error:string;lastAt?:number}>();

export function activityScope(identity:string) {
  return ['activity',import.meta.env.VITE_SPACETIMEDB_HOST??'ws://localhost:3000',import.meta.env.VITE_SPACETIMEDB_DB_NAME??'mirrorville',identity].join('|');
}
export function learningConfig(scope:string):LearningConfig {
  try { const value=JSON.parse(localStorage.getItem('mirrorville:activity:'+scope)??'{}'); return {enabled:value.enabled===true,mirrorId:typeof value.mirrorId==='string' && /^\d+$/.test(value.mirrorId)?value.mirrorId:undefined}; }
  catch { return {enabled:false}; }
}
export function setLearningConfig(scope:string,config:LearningConfig) {
  localStorage.setItem('mirrorville:activity:'+scope,JSON.stringify(config));
  window.dispatchEvent(new Event(ACTIVITY_CHANGED));
}
export async function activityRequest(method:string,body:object) {
  if (!isNativeDesktop()) throw new Error('Context memory is available in the desktop app.');
  return window.mirrorvilleDesktop!.request(method,body);
}
export async function activitySnapshot(scope:string):Promise<ActivitySnapshot> {
  const raw=await activityRequest('context',{scope});
  const validEpisode=(value:unknown):value is ActivityEpisode=>{
    if (!value || typeof value!=='object') return false;
    const row=value as ActivityEpisode;
    return (!row.source || (typeof row.source.label==='string' && row.source.label.length<=200 && /^[a-f0-9-]{36}$/.test(row.source.threadId))) && /^[a-f0-9]{24}$/.test(row.id) && typeof row.app==='string' && row.app.length<=80 && typeof row.title==='string' && row.title.length<=200
      && Number.isFinite(Date.parse(row.startAt)) && Number.isFinite(Date.parse(row.endAt)) && Number.isInteger(row.seconds) && row.seconds>=1;
  };
  if (!Array.isArray(raw.episodes) || raw.episodes.length>80 || !raw.episodes.every(validEpisode)
    || !Array.isArray(raw.unseen) || !raw.unseen.every(validEpisode) || !Array.isArray(raw.memories) || raw.memories.length>60
    || !Number.isInteger(raw.generation)) throw new Error('The local activity memory could not be read.');
  const ids=new Set(raw.episodes.map(row=>row.id));
  if (raw.unseen.some(row=>!ids.has(row.id))) throw new Error('Activity references changed.');
  for (const value of raw.memories) {
    const row=value as ActivityNote;
    if (!row || !/^[a-f0-9]{24}$/.test(row.id) || typeof row.text!=='string' || row.text.length>400 || !['draft','confirmed','dismissed'].includes(row.state)
      || !Array.isArray(row.evidence) || !row.evidence.every(validEpisode) || !Number.isFinite(row.created)) throw new Error('Invalid local understanding.');
  }
  return raw as unknown as ActivitySnapshot;
}

export async function runActivityUnderstanding(scope:string,mirrorId:bigint|undefined,
  summarize:(args:{mirrorId:bigint|undefined;episodes:ActivityEpisode[];previousMemory:string})=>Promise<ActivityTheme[]>,
  stillAllowed:()=>boolean) {
  if (learningJobs.get(scope)?.busy) return;
  const previousJob=learningJobs.get(scope);
  learningJobs.set(scope,{...previousJob,busy:true,error:''}); window.dispatchEvent(new Event(ACTIVITY_CHANGED));
  try {
    const snapshot=await activitySnapshot(scope);
    if (!stillAllowed()) return;
    const episodes=snapshot.unseen.slice(-40);
    if (!episodes.length) return;
    const previousMemory=JSON.stringify(snapshot.memories.filter(row=>row.state!=='draft').slice(0,10).map(row=>({text:row.text,state:row.state}))).slice(0,6000);
    const themes=await summarize({mirrorId,episodes,previousMemory});
    if (!stillAllowed()) return;
    await activityRequest('saveUnderstanding',{scope,episodeIds:episodes.map(row=>row.id),themes,generation:snapshot.generation});
    learningJobs.set(scope,{busy:false,error:'',lastAt:Date.now()});
  } catch (error) {
    learningJobs.set(scope,{...previousJob,busy:false,error:error instanceof Error?error.message:'Activity understanding could not finish. Local memory is retained.'});
  } finally {
    const job=learningJobs.get(scope); if (job) job.busy=false;
    window.dispatchEvent(new Event(ACTIVITY_CHANGED));
  }
}
