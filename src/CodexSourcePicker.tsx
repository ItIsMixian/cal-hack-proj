import {useEffect, useState} from 'react';
import {ACTIVITY_CHANGED,activityRequest} from './activityMemory';

type Source={id:string;label:string;selected:boolean};
export default function CodexSourcePicker({busy,onChanging}:{busy:boolean;onChanging:()=>void}) {
  const [sources,setSources]=useState<Source[]>([]),[selected,setSelected]=useState<string[]>([]);
  const [error,setError]=useState(''),[working,setWorking]=useState(false),[loaded,setLoaded]=useState(false);
  const load=async()=>{
    const value=await activityRequest('codexSources',{});
    if(!Array.isArray(value.sources)) throw new Error();
    const rows=value.sources.filter((v):v is Source=>!!v && typeof v==='object' && typeof v.id==='string' && typeof v.label==='string');
    setSources(rows);setSelected(rows.filter(v=>v.selected).map(v=>v.id));setLoaded(true);
  };
  useEffect(()=>{let alive=true;activityRequest('codexSources',{}).then(value=>{
    if(!alive || !Array.isArray(value.sources))return;
    const rows=value.sources as Source[];setSources(rows);setSelected(rows.filter(v=>v.selected).map(v=>v.id));setLoaded(true);
  }).catch(()=>{if(alive)setError('Restart the updated desktop app to connect local Codex conversations.');});return()=>{alive=false;};},[]);
  const save=async()=>{
    setWorking(true);setError('');
    try {onChanging();await activityRequest('codexSelect',{threadIds:selected});await load();window.dispatchEvent(new Event(ACTIVITY_CHANGED));}
    catch {setError('Could not connect those conversations. Refresh the list and try again.');}
    finally {setWorking(false);}
  };
  return <details className="activity-input-preview" open={loaded&&!sources.some(v=>v.selected)}>
    <summary>Connect my Codex conversations ({sources.filter(v=>v.selected).length} connected)</summary>
    <p>Choose up to 10 local conversations. While observation is running, I read your own messages from the last 7 days and new messages as they arrive. AI replies, tool logs and system instructions are excluded. Selection resets when this app restarts.</p>
    <p>Changing this selection turns automatic understanding off. Review extracted excerpts, then ask DeepSeek or enable automatic understanding below. Disconnecting stops new reads; “Clear local activity and memories” also removes collected excerpts. Requests are not proof that work was completed.</p>
    {sources.map(row=><label className="activity-auto" key={row.id}><input type="checkbox" checked={selected.includes(row.id)} disabled={busy||working||(!selected.includes(row.id)&&selected.length>=10)} onChange={event=>setSelected(ids=>event.target.checked?[...ids,row.id]:ids.filter(id=>id!==row.id))}/>{row.label}</label>)}
    {loaded&&!sources.length&&<p>No readable local Codex conversations were found in this app’s Codex home.</p>}
    <div className="observation-controls"><button disabled={busy||working||!loaded} onClick={()=>void save()}>{working?'Connecting…':'Use these conversations'}</button><button disabled={busy||working} onClick={()=>void load().catch(()=>setError('Local Codex history is unavailable.'))}>Refresh conversations</button></div>
    <small>After choosing, start observation above. Review extracted messages under “What DeepSeek will receive”.</small>
    {error&&<p role="alert">{error}</p>}
  </details>;
}
