import { useState } from 'react';
import { useReducer, useTable } from 'spacetimedb/react';
import { reducers, tables } from './module_bindings';
import type { MirrorCard } from './module_bindings/types';
import CharacterAvatar from './CharacterAvatar';
import { DAILY_QUESTIONS, readExamples } from '../spacetimedb/src/learning';
import { ownerWords } from '../spacetimedb/src/fidelity';
import { isVisibleIn, ROOM_LABELS, ROOMS, FACET_LABELS, type Facet } from '../spacetimedb/src/redact';
import { TIPI_ITEMS } from '../spacetimedb/src/tipi';

export function MirrorSpeaker({ name, look }: { name: string; look: number }) {
  return <div className="exchange-portrait"><CharacterAvatar look={look} name={name} /><span>{name}</span><span aria-hidden="true" className="speaking-mark">···</span></div>;
}

export function FactConversation({ mirrorId, cards, onDone, onBringWords }: { mirrorId: bigint; cards: MirrorCard[]; onDone: () => void; onBringWords: () => void }) {
  const rewrite = useReducer(reducers.rewriteCard);
  const confirm = useReducer(reducers.confirmMirrorFacts);
  const setRoom = useReducer(reducers.setCardRoom);
  const [index, setIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [finished, setFinished] = useState(false);
  const card = cards[Math.min(index, cards.length - 1)];
  const next = async () => {
    setBusy(true); setError('');
    try {
      if (editing) { await rewrite({ cardId: card.id, text: draft }); setEditing(false); }
      if (index >= cards.length - 1) { await confirm({ mirrorId }); setFinished(true); }
      else setIndex(current => current + 1);
    } catch { setError('I could not keep that correction. Try once more?'); }
    finally { setBusy(false); }
  };
  if (!card) return <div className="mirror-exchange"><p className="exchange-line">I do not have much to go on yet. Bring me a little of your world?</p><button className="exchange-primary" onClick={onBringWords}>Bring my words →</button></div>;
  if (finished) return <div className="mirror-exchange"><div className="kept-cards" aria-hidden="true">▱ ▱ ▱</div><p className="exchange-line">A few pieces of you, a little clearer now. You can change any of them whenever you like.</p><button className="exchange-primary" onClick={onDone}>Put them away →</button></div>;
  return <section className="mirror-exchange" aria-label="Check what your mirror learned">
    <p className="exchange-line">I picked this up from your words.<br />Does it feel right?</p>
    <article className="discovery-card" key={String(card.id)}><span className="paper-caption">{FACET_LABELS[card.facet as Facet] ?? 'A little piece of you'} · {Math.min(index + 1, cards.length)} / {cards.length}</span>
      {editing ? <textarea className="writing-paper" autoFocus aria-label="Tell your mirror what is true instead" rows={3} maxLength={200} value={draft} onChange={event => setDraft(event.target.value)} /> : <p>{ownerWords(card.text)}</p>}
      <small>{card.personal ? 'Kept private unless you choose to share it' : isVisibleIn(card, 'venue') ? 'Comes along in town' : 'Stays in your room'}</small>
    </article>
    <div className="exchange-choices"><button className="exchange-primary" disabled={busy || (editing && !draft.trim())} onClick={() => void next()}>{busy ? 'Keeping that…' : editing ? 'That is more like me →' : 'Yes, that fits →'}</button>
      <button disabled={busy} onClick={() => { if (editing) setEditing(false); else { setDraft(card.text); setEditing(true); } }}>{editing ? 'Keep the original' : 'Not quite. Let me change it.'}</button></div>
    <details className="quiet-note"><summary>Choose where this side of me shows</summary><div className="exchange-choices">{ROOMS.map(room => <button key={room} aria-pressed={isVisibleIn(card, room)} disabled={busy} onClick={async () => {
      setBusy(true); setError('');
      try { const visible = isVisibleIn(card, room); const defaultVisible = isVisibleIn({ ...card, rooms: '' }, room); await setRoom({ cardId: card.id, room, state: !visible === defaultVisible ? 'default' : visible ? 'off' : 'on' }); }
      catch { setError('I could not change sharing. Try again?'); } finally { setBusy(false); }
    }}>{isVisibleIn(card, room) ? '✓' : '✗'} {ROOM_LABELS[room]}</button>)}</div></details>
    {error && <p role="alert">{error}</p>}
    <div className="exchange-choices"><button className="exchange-back" disabled={busy || index === 0} onClick={() => { setEditing(false); setIndex(current => current - 1); }}>← Previous piece</button><button className="exchange-back" disabled={busy} onClick={onDone}>We'll come back to this</button></div>
  </section>;
}

export function VoiceConversation({ mirrorId, onBringWords, onDone }: { mirrorId: bigint; onBringWords: () => void; onDone: () => void }) {
  const [styles] = useTable(tables.myStyle);
  const style = styles.find(row => row.mirrorId === mirrorId);
  const mark = useReducer(reducers.markStyleExample);
  const edit = useReducer(reducers.editMirrorStyle);
  const [index, setIndex] = useState(0);
  const [tuning, setTuning] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const examples = readExamples(style?.examples ?? '[]');
  const example = examples[index];
  const speak = async (verdict: string) => {
    if (!example) return; setBusy(true); setError('');
    try { await mark({ mirrorId, index, expectedText: example.text, verdict }); setIndex(current => current + 1); }
    catch { setError('That choice did not reach me. Try again?'); }
    finally { setBusy(false); }
  };
  if (!style || !examples.length) return <div className="mirror-exchange"><p className="exchange-line">To sound like you, I need some words you actually wrote.</p><div className="exchange-choices"><button className="exchange-primary" onClick={onBringWords}>I brought my messages →</button><button onClick={onDone}>Another time</button></div></div>;
  return <section className="mirror-exchange" aria-label="Try your mirror's voice">
    {tuning ? <><p className="exchange-line">What should I sound more like?</p><textarea className="writing-paper" autoFocus aria-label="Guide your mirror's voice" rows={3} maxLength={800} value={draft} onChange={event => setDraft(event.target.value)} /><div className="exchange-choices"><button disabled={busy || !draft.trim()} className="exchange-primary" onClick={async () => {
      setBusy(true); setError(''); try { await edit({ mirrorId, text: draft }); setTuning(false); } catch { setError('I could not keep that direction. Try again?'); } finally { setBusy(false); }
    }}>Keep that in mind →</button><button disabled={busy} onClick={() => setTuning(false)}>Leave it as it was</button></div></> : example ? <>
      <p className="exchange-line">Let me try a line.<br />Would you say it like this?</p>
      <div className="voice-bubble" key={`${index}/${example.text}`}><blockquote>{example.text}</blockquote><small>Made up for this rehearsal · {index + 1} / {examples.length}</small></div>
      {example.verdict && <p className="quiet-note">Last time: {example.verdict === 'yes' ? '✓ That sounded like you' : '✗ That did not sound like you'}</p>}
      <div className="exchange-choices"><button className="exchange-primary" disabled={busy} onClick={() => void speak('yes')}>Yes, that's me</button><button disabled={busy} onClick={() => void speak('no')}>No, I wouldn't say that</button></div>
      <div className="exchange-choices"><button className="exchange-back" disabled={busy || index === 0} onClick={() => setIndex(current => current - 1)}>← Hear the last one</button><button className="exchange-back" disabled={busy} onClick={() => setIndex(current => current + 1)}>Pass on this one →</button></div>
    </> : <><div className="kept-cards" aria-hidden="true">“ ”</div><p className="exchange-line">I'll keep your choices in mind when I talk. If something still feels off, come back and tell me.</p><div className="exchange-choices"><button className="exchange-primary" onClick={onDone}>Back to our room →</button><button onClick={() => setIndex(0)}>Hear them again</button></div></>}
    {!tuning && <button className="exchange-back" disabled={busy} onClick={() => { setDraft(style.text); setTuning(true); }}>Let me give you a little direction</button>}
    {error && <p role="alert">{error}</p>}
  </section>;
}

export function DailyConversation({ mirrorId, count, onDone }: { mirrorId: bigint; count: number; onDone: () => void }) {
  const answer = useReducer(reducers.answerDailyQuestion);
  const [text, setText] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const send = async (skip: boolean) => { setBusy(true); setError(''); try { await answer({ mirrorId, text: skip ? '' : text }); onDone(); } catch { setError('Your answer did not reach me. Try again?'); } finally { setBusy(false); } };
  return <div className="mirror-exchange"><p className="exchange-line">{DAILY_QUESTIONS[count % DAILY_QUESTIONS.length]}</p><textarea className="writing-paper" autoFocus aria-label="Your answer for today" rows={3} maxLength={600} value={text} onChange={event => setText(event.target.value)} placeholder="A thought or two is enough…" /><div className="exchange-choices"><button className="exchange-primary" disabled={busy || !text.trim()} onClick={() => void send(false)}>That's what's on my mind →</button><button disabled={busy} onClick={() => void send(true)}>Let's leave that for today</button></div>{error && <p role="alert">{error}</p>}</div>;
}

export function PersonalityConversation({ mirrorId, onDone }: { mirrorId: bigint; onDone: () => void }) {
  const save = useReducer(reducers.refinePersonality);
  const [answers, setAnswers] = useState<number[]>([]); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const pick = async (value: number) => { const next = [...answers, value]; if (next.length < TIPI_ITEMS.length) { setAnswers(next); return; } setBusy(true); try { await save({ mirrorId, tipi: Uint8Array.from(next) }); onDone(); } catch { setError('I could not keep the check. Try the last answer again?'); } finally { setBusy(false); } };
  return <div className="mirror-exchange"><p className="quiet-note">A short check, if you feel like it · {answers.length + 1} / {TIPI_ITEMS.length}</p><p className="exchange-line">Do you see yourself as…</p><div className="voice-bubble" key={answers.length}><p>{TIPI_ITEMS[answers.length]}?</p></div><div className="personality-scale" role="group" aria-label="How much does that sound like you?">{[1,2,3,4,5,6,7].map(value => <button key={value} disabled={busy} aria-label={`${value} of 7`} onClick={() => void pick(value)}>{value}</button>)}</div><div className="scale-ends"><span>Not much</span><span>Very much</span></div><div className="exchange-choices"><button className="exchange-back" disabled={busy || !answers.length} onClick={() => setAnswers(current => current.slice(0, -1))}>← Last question</button><button className="exchange-back" disabled={busy} onClick={onDone}>Another time</button></div>{error && <p role="alert">{error}</p>}</div>;
}
