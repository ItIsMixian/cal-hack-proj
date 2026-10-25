import { useEffect, useRef, useState } from 'react';
import { githubLetter, readGitHub, type GitHubMaterial } from './github';
import type { WordGift } from './WordOffering';

export default function GitHubOffering({ onReady, onBack, busy }: { onReady: (gift: WordGift) => void; onBack: () => void; busy: boolean }) {
  const [username, setUsername] = useState('');
  const [ownAccount, setOwnAccount] = useState(false);
  const [material, setMaterial] = useState<GitHubMaterial | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null), mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); }; }, []);
  const letter = githubLetter((material?.pieces ?? []).filter(piece => selected.includes(piece.id)));
  const clear = () => { controller.current?.abort(); setMaterial(null); setSelected([]); setError(''); };
  const read = async () => {
    if (!ownAccount || working || busy) return;
    clear(); const next = new AbortController(); controller.current = next; setWorking(true);
    try {
      const value = await readGitHub(username, next.signal);
      if (mounted.current && !next.signal.aborted) { setMaterial(value); setSelected([]); }
    } catch (e) { if (mounted.current && !next.signal.aborted) setError(e instanceof Error ? e.message : 'GitHub could not be read.'); }
    finally { if (mounted.current && controller.current === next) setWorking(false); }
  };
  return <div className="github-offering">
    <p className="exchange-line">Bring your projects and public GitHub activity.</p>
    <p className="quiet-note">No GitHub app or token needed. This reads up to 50 owned non-fork repositories and 100 public events from the last 30 days. It may miss older or other activity; private projects stay private.</p>
    <label>GitHub username or profile URL<input aria-label="GitHub username or profile URL" value={username} maxLength={200} disabled={working || busy} onChange={event => { clear(); setUsername(event.target.value); setOwnAccount(false); }} placeholder="your-username" /></label>
    <label className="source-owner"><input type="checkbox" checked={ownAccount} disabled={working || busy} onChange={event => { clear(); setOwnAccount(event.target.checked); }} />This is my account and I want to bring my own project information.</label>
    <p className="quiet-note">Public lookup does not verify account ownership. No one else’s comments, PR text or commit messages are imported.</p>
    <button disabled={!ownAccount || !username.trim() || working || busy} onClick={() => void read()}>{working ? 'Reading public GitHub activity…' : 'Read my GitHub'}</button>
    {material?.pieces.length === 0 && <p role="status">No eligible public project or recent activity was found. You can bring a project description in your own words instead.</p>}
    {!!material?.pieces.length && <>
      <p className="quiet-note">Review your account {material.login}. Project ownership does not establish your role or skill. Edit your contribution and remove anything about other people before handing over.</p>
      <p role="status">Found {material.pieces.filter(p => p.kind === 'background').length} projects and {material.pieces.filter(p => p.kind === 'activity').length} public activity records. These are source records, not learned facts. Choose what matters to you.</p>
      <button disabled={working || busy} onClick={() => setSelected(material.pieces.filter(p => p.kind === 'background').map(p => p.id))}>Select project backgrounds</button>
      <button disabled={working || busy} onClick={() => setSelected([])}>Clear selection</button>
      <div className="github-records">{material.pieces.map(piece => <div key={piece.id} className="source-piece"><label><input type="checkbox" aria-label={`Include ${piece.kind} ${piece.id}`} checked={selected.includes(piece.id)} disabled={working || busy} onChange={event => setSelected(values => event.target.checked ? [...values, piece.id] : values.filter(id => id !== piece.id))} />{piece.kind === 'activity' ? 'Account action' : 'Project background'} · {piece.dateLabel}</label><details><summary>{piece.text.split('. ')[0].slice(0, 140)} — review / edit</summary><textarea aria-label={`Edit GitHub ${piece.kind} ${piece.id}`} rows={3} maxLength={2_000} value={piece.text} disabled={working || busy} onChange={event => setMaterial(value => value ? { ...value, pieces: value.pieces.map(item => item.id === piece.id ? { ...item, text: event.target.value } : item) } : null)} /></details></div>)}</div>
      <p className="quiet-note">This letter includes {letter.included} of {selected.length} selected records, up to 29,000 characters. Dates describe recorded actions or repository creation, not when a narrated life event happened.</p>
      <details className="quiet-note"><summary>Preview the exact letter</summary><pre className="source-letter">{letter.text || 'Choose at least one piece.'}</pre></details>
      <button className="exchange-primary" disabled={working || busy || !ownAccount || letter.characters < 40} onClick={() => onReady({ text: letter.text, latestAt: letter.latestAt, inputKind: 'facts', relation: 'other', source: 'GitHub · public projects & activity' })}>Hand over selected records ✉</button>
      {letter.characters < 40 && <p className="quiet-note">Bring at least 40 characters of your own information.</p>}
    </>}
    {error && <p role="alert" className="error">{error}</p>}
    <button className="exchange-back" disabled={busy} onClick={onBack}>← Back to sources</button>
  </div>;
}
