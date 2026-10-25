import { useEffect, useRef, useState } from 'react';
import { useProcedure, useReducer, useTable } from 'spacetimedb/react';
import { procedures, reducers, tables } from './module_bindings';
import { readExamples, VOICE_SCENES } from '../spacetimedb/src/learning';

export default function VoiceRehearsal({ mirrorId, onDone, doneLabel = 'Back to the room' }: { mirrorId: bigint; onDone: () => void; doneLabel?: string }) {
  const tryLine = useProcedure(procedures.tryMirrorVoice);
  const mark = useReducer(reducers.markStyleExample);
  const correct = useReducer(reducers.correctVoiceTrial);
  const [styles] = useTable(tables.myStyle);
  const approved = readExamples(styles.find(row => row.mirrorId === mirrorId)?.examples ?? '[]').filter(row => row.verdict === 'yes').length;
  const [trial, setTrial] = useState<{ index: number; prompt: string; text: string } | null>(null);
  const [scene, setScene] = useState(0);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const started = useRef(false), alive = useRef(true);
  const request = async (next: number) => {
    setBusy(true); setError(''); setStatus(''); setEditing(false);
    try { const response = await tryLine({ mirrorId, scene: VOICE_SCENES[next % VOICE_SCENES.length].id }); if (alive.current) { setTrial(response); setScene(next % VOICE_SCENES.length); } }
    catch { if (alive.current) setError('I could not try that line. Tap the mirror to try again.'); }
    finally { if (alive.current) setBusy(false); }
  };
  useEffect(() => { alive.current = true; if (!started.current) { started.current = true; void request(0); } return () => { alive.current = false; }; }, []);
  const keep = async () => {
    if (!trial) return; setBusy(true); setError('');
    try {
      if (editing) { await correct({ mirrorId, index: trial.index, expectedText: trial.text, text: draft }); setTrial({ ...trial, text: draft }); setEditing(false); setStatus('Your wording is kept privately. I will use it as a guide.'); }
      else { await mark({ mirrorId, index: trial.index, expectedText: trial.text, verdict: 'yes' }); setStatus('Kept. Let me try another situation with that in mind.'); }
    } catch { setError('That correction did not reach me. Try once more?'); }
    finally { setBusy(false); }
  };
  return <section className="voice-rehearsal" aria-label="Rehearse a real reply">
    <p className="rehearsal-caption">{approved ? 'Your wording guides this rehearsal' : 'Still learning your voice'}</p>
    {busy && !trial ? <p role="status" className="rehearsal-thinking">Let me try a reply…</p> : trial && <>
      <p className="rehearsal-prompt"><span>Someone asks</span>{trial.prompt}</p>
      {editing ? <label className="rehearsal-edit">How would you actually say it?<textarea aria-label="How you would actually reply" autoFocus rows={4} maxLength={240} value={draft} onChange={event => setDraft(event.target.value)} /><small>Saved privately only when you keep this wording.</small></label> : <blockquote className="rehearsal-reply">{trial.text}</blockquote>}
      <div className="rehearsal-seals">
        <button disabled={busy || (editing && !draft.trim())} className="seal keep" aria-label={editing ? 'Keep my wording' : 'That reply sounds like me'} onClick={() => void keep()}><b>✓</b><span>{editing ? 'Keep my words' : 'Sounds like me'}</span></button>
        <button disabled={busy} className="seal change" aria-label={editing ? 'Keep the original reply' : 'I would say it differently'} onClick={() => { if (editing) setEditing(false); else { setDraft(trial.text); setEditing(true); } }}><b>✎</b><span>{editing ? 'Original' : "I'd say…"}</span></button>
      </div>
    </>}
    {status && <p role="status" className="rehearsal-status">{status}</p>}
    {error && <p role="alert" className="rehearsal-error">{error}</p>}
    <div className="rehearsal-foot"><button disabled={busy} onClick={() => void request(error ? scene : scene + 1)}>{busy ? 'Trying a reply…' : error ? 'Try again ↻' : 'Another situation ↻'}</button><button disabled={busy} onClick={onDone}>{doneLabel}</button></div>
  </section>;
}
