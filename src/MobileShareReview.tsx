import { useEffect, useState } from 'react';
import { useReducer, useSpacetimeDB, useTable } from 'spacetimedb/react';
import { reducers, tables } from './module_bindings';
import { redact } from '../spacetimedb/src/redact';
import type { MobileShareDraft } from './mobileShare';
import type { WordGift } from './WordOffering';

export function MobileShareLetter({ draft, onReady, onBack, busy = false }: { draft: MobileShareDraft; onReady: (gift: WordGift) => void; onBack: () => void; busy?: boolean }) {
  const [text, setText] = useState(draft.text), [checked, setChecked] = useState(false);
  const [mode, setMode] = useState<'mine' | 'reference' | ''>(draft.kind === 'link' ? 'reference' : '');
  const [meaning, setMeaning] = useState('');
  useEffect(() => { setText(draft.text); setChecked(false); setMode(draft.kind === 'link' ? 'reference' : ''); setMeaning(''); }, [draft]);
  const body = redact(text).trim();
  const ownMeaning = redact(meaning).trim();
  const date = new Date(draft.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' });
  const letter = `[iPhone shared ${draft.kind}${draft.linkHost ? ` from ${draft.linkHost}` : ''} · received ${date}; receipt is not event date. ${mode === 'mine' ? 'Owner declares these are their own words about themselves.' : 'Reference text remains local; only the owner meaning below is handed over. Shared content is not evidence of authorship, reading, endorsement or experience.'}]\n${mode === 'mine' ? body : ownMeaning}`;
  const ready = !!mode && checked && (mode === 'mine' ? body : ownMeaning).length >= 40;
  return <section className="mobile-share-letter">
    <p className="source-heading">A little piece you brought from your iPhone</p>
    <p className="source-note">{draft.kind === 'link' ? `A link${draft.linkHost ? ` from ${draft.linkHost}` : ''}. No page was fetched. Add what it means to you in your own words.` : 'Shared text can be yours or a quotation. Explain what is true about you and remove other people’s details.'}</p>
    <textarea aria-label="Review shared iPhone item" rows={5} maxLength={12_000} disabled={busy} value={text} onChange={event => { setText(event.target.value); setChecked(false); }} />
    {draft.kind === 'text' && <fieldset className="mobile-share-authorship"><legend>What did you share?</legend><label><input type="radio" name="shared-authorship" checked={mode === 'mine'} disabled={busy} onChange={() => { setMode('mine'); setChecked(false); }} />My own words about me</label><label><input type="radio" name="shared-authorship" checked={mode === 'reference'} disabled={busy} onChange={() => { setMode('reference'); setChecked(false); }} />A reference I want to discuss</label></fieldset>}
    {mode === 'reference' && <label>What should your mirror know about you from this?<textarea aria-label="My meaning for shared reference" rows={3} maxLength={8_000} disabled={busy} value={meaning} onChange={event => { setMeaning(event.target.value); setChecked(false); }} placeholder="Why you brought this, what you are exploring, or what you want to talk about…" /></label>}
    <label className="source-owner"><input type="checkbox" checked={checked} disabled={busy || !mode} onChange={event => setChecked(event.target.checked)} />Facts about me are true. Quoted experiences are not mine. I removed other people’s details and allow this letter to be handed over.</label>
    <details className="source-note"><summary>Preview the exact letter</summary><pre className="source-letter">{letter}</pre></details>
    <button className="exchange-primary" disabled={busy || !ready} onClick={() => onReady({ text: letter, latestAt: '', source: 'iPhone · shared item', inputKind: 'facts', relation: 'other' })}>Hand over reviewed item ✉</button>
    {(mode === 'mine' ? body : ownMeaning).length < 40 && <p className="source-note">Add a little context — at least 40 characters of your own words. A link alone is not a personal fact.</p>}
    <button className="exchange-back" disabled={busy} onClick={onBack}>Keep it for later</button>
  </section>;
}

export default function MobileShareReview({ draft, onClose, onDone, onCreate }: { draft: MobileShareDraft; onClose: () => void; onDone: () => void; onCreate: () => void }) {
  const [mirrors] = useTable(tables.myMirrors);
  const { isActive } = useSpacetimeDB();
  const read = useReducer(reducers.importWriting);
  const [selected, setSelected] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const owned = mirrors.find(mirror => String(mirror.id) === selected);
  const give = async (gift: WordGift) => {
    if (!owned || !isActive || busy) return;
    setBusy(true); setError('');
    try { await read({ mirrorId: owned.id, ...gift }); onDone(); }
    catch { setError('The shared letter did not reach your mirror. Your draft is still here.'); }
    finally { setBusy(false); }
  };
  return <div className="mobile-share-review">
    {mirrors.length ? <label>Give this to your mirror<select aria-label="Your mirror for shared item" value={selected} disabled={busy} onChange={event => setSelected(event.target.value)}><option value="">Choose your mirror</option>{mirrors.map(mirror => <option key={String(mirror.id)} value={String(mirror.id)}>{mirror.name}</option>)}</select></label> : <><p>Make your mirror first. Your shared draft will wait on its desk.</p><button onClick={onCreate}>Make my mirror with this item</button></>}
    <MobileShareLetter draft={draft} busy={busy || !owned || !isActive} onBack={onClose} onReady={gift => void give(gift)} />
    {error && <p role="alert">{error}</p>}
  </div>;
}
