import { useEffect, useRef, useState } from 'react';
import { useReducer, useTable } from 'spacetimedb/react';
import { reducers, tables } from './module_bindings';
import RoomDialog from './RoomDialog';
import RoomJourney, { useRoomJourney } from './RoomJourney';
import type { RoomStation } from './roomJourneyMath';
import type { WordGift } from './WordOffering';
import SourceOffering from './SourceOffering';
import type { MobileShareDraft } from './mobileShare';
import VoiceRehearsal from './VoiceRehearsal';
import CharacterPicker from './CharacterPicker';
import './first-meeting.css';
import './room-journey.css';

type Stage = 'name' | 'walking' | 'desk' | 'paper' | 'reading' | 'mirror' | 'rehearsal' | 'door';
export default function CreateMirror(props: {
  onClose: () => void; onCreated: (name: string) => void;
  existing?: { id: bigint; name: string; look: number }; startAt?: 'desk' | 'mirror';
  sharedDraft?: MobileShareDraft | null; onSharedConsumed?: () => void;
}) {
  const create = useReducer(reducers.createMirrorOnboarding);
  const read = useReducer(reducers.importWriting);
  const activate = useReducer(reducers.setOwnMirrorActive);
  const [owned] = useTable(tables.myMirrors), [archived] = useTable(tables.myArchivedMirrors), [imports] = useTable(tables.myImports);
  const [name, setName] = useState(props.existing?.name ?? '');
  const [look, setLook] = useState(props.existing?.look ?? 0);
  const [choosingLook, setChoosingLook] = useState(false);
  const chooseButton = useRef<HTMLButtonElement>(null);
  const [station, setStation] = useState<RoomStation>('entrance');
  const [stage, setStage] = useState<Stage>(props.existing ? 'walking' : 'name');
  const [received, setReceived] = useState(false);
  const [gift, setGift] = useState<WordGift | null>(null);
  const [mirrorId, setMirrorId] = useState<bigint | null>(props.existing?.id ?? null);
  const [committed, setCommitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { pose, walkTo } = useRoomJourney();
  const bound = useRef(false), releasing = useRef(false), started = useRef(false);
  const hold = useRef<Promise<unknown> | null>(null);
  const previousImport = useRef<bigint | null>(null);
  const latest = imports.filter(row => row.mirrorId === mirrorId).sort((a,b) => a.createdAt.microsSinceUnixEpoch > b.createdAt.microsSinceUnixEpoch ? -1 : 1)[0];
  const canReadResult = latest && latest.id !== previousImport.current;
  const busy = saving || (committed && mirrorId === null);
  const canChangeLook = !props.existing && !committed && mirrorId === null && !busy && !pose.moving;
  const speech = pose.moving ? station === 'desk' ? 'Let’s take your words to the desk.' : station === 'mirror' ? 'Come over to the mirror. Let me try a reply.' : 'The town is just outside.'
    : stage === 'name' ? 'Hello. What should I call you? Write it on my little name tag.'
    : stage === 'desk' ? 'Which pages did you bring?'
    : stage === 'reading' ? canReadResult && latest.status === 'failed' ? 'I could not read that letter. Your earlier cards are safe.' : 'Let me read this for a moment…'
    : stage === 'mirror' ? 'I do not know enough yet. Bring a letter to the desk, or we can head outside for now.'
    : stage === 'door' ? 'Ready when you are. Tap the open doorway to step outside.' : '';

  const travel = async (next: RoomStation) => {
    if (!name.trim() || busy || pose.moving) return;
    if (next === 'door' && station === 'door') { await leave(); return; }
    setChoosingLook(false); setError(''); setStation(next); setStage('walking');
    if (!await walkTo(next)) return;
    setStage(next === 'desk' ? 'desk' : next === 'mirror' ? mirrorId !== null ? 'rehearsal' : 'mirror' : next === 'door' ? 'door' : 'name');
  };
  useEffect(() => {
    const frame = requestAnimationFrame(() => { if (props.existing && !started.current) { started.current = true; void travel(props.startAt ?? 'desk'); } });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (!committed || bound.current || props.existing || releasing.current) return;
    const row = [...owned, ...archived].find(row => row.name === name.trim());
    if (!row) return;
    bound.current = true; setMirrorId(row.id);
    // A new reflection stays in its room while learning, then enters town at the door.
    hold.current = activate({ mirrorId: row.id, active: false }).catch(() => { setError('Your mirror is already in town; you can keep rehearsing here.'); });
  }, [committed, owned, archived, name, activate]);
  useEffect(() => {
    if (stage === 'reading' && canReadResult && latest.status === 'done' && mirrorId !== null) { setGift(null); void travel('mirror'); }
  }, [stage, latest?.id, latest?.status, mirrorId]);

  const give = async (letter: WordGift) => {
    if (busy) return; setSaving(true); setError(''); setGift(letter); setReceived(true); previousImport.current = latest?.id ?? null;
    try {
      if (mirrorId !== null) await read({ mirrorId, ...letter });
      else { await create({ name: name.trim(), look, words: [], outgoing: false, intent: '', topic: '', ...letter }); setCommitted(true); }
      if (letter.source === 'iPhone · shared item') props.onSharedConsumed?.();
      setStage('reading');
    } catch (e) { setError(e instanceof Error ? e.message : 'The letter did not reach me. Try again?'); }
    finally { setSaving(false); }
  };
  const leave = async () => {
    if (busy) return; setSaving(true); setError(''); releasing.current = true;
    try {
      if (mirrorId !== null) { await hold.current; if (!props.existing) await activate({ mirrorId, active: true }); }
      else await create({ name: name.trim(), look, words: [], outgoing: false, intent: '', topic: '', text: '', inputKind: 'facts', latestAt: '', relation: 'other' });
      props.onCreated(name.trim());
    } catch (e) { releasing.current = false; setError(e instanceof Error ? e.message : 'The door could not open. Try again?'); }
    finally { setSaving(false); }
  };
  const close = () => { if (busy) return; if (mirrorId !== null && !props.existing) { void leave(); } else props.onClose(); };
  const stationery = stage === 'desk' ? <>
    <button className="stationery-note" aria-label="Choose a letter for my mirror" onClick={() => setStage('paper')}><b>✉</b><span>Bring a letter</span></button>
  </> : undefined;
  const paper = stage === 'paper' ? <SourceOffering onDesk busy={busy} initialGift={gift} sharedDraft={props.sharedDraft} onBack={() => setStage('desk')} onReady={value => void give(value)} />
    : stage === 'reading' && canReadResult && latest.status === 'failed' ? <div className="unread-letter"><p>The letter is still here.</p><button disabled={!gift || busy} onClick={() => { if (gift) void give(gift); }}>Read it again ↻</button><button onClick={() => setStage('desk')}>Another letter</button></div> : undefined;
  return <RoomDialog title="Your reflection’s room" className="room-journey-dialog" footer={false} onClose={close}>
    <RoomJourney pose={pose} station={station} name={name} look={look} speech={speech} disabled={busy || !name.trim()} lookLocked={!canChangeLook} hasLetter={received}
      onStation={next => void travel(next)} onLook={() => { if (canChangeLook) setChoosingLook(current => !current); }} deskItems={stationery} paper={paper}
      reflection={stage === 'rehearsal' && mirrorId !== null ? <VoiceRehearsal key={String(mirrorId)} mirrorId={mirrorId} onDone={() => void travel('door')} /> : undefined}
      naming={stage === 'name' ? <form onSubmit={event => { event.preventDefault(); void travel('desk'); }}><label>Name on the tag<input data-autofocus autoFocus aria-label="Name on your reflection's tag" maxLength={24} value={name} placeholder="You can call me…" onChange={event => setName(event.target.value)} /></label><button type="submit" disabled={!name.trim()} aria-label="Fasten the name tag and walk to the desk">✓</button></form> : undefined} />
    {canChangeLook && !choosingLook && <button ref={chooseButton} className="choose-character" onClick={() => setChoosingLook(true)}>Choose character</button>}
    {canChangeLook && choosingLook && <CharacterPicker look={look} onChange={setLook} onClose={() => { setChoosingLook(false); requestAnimationFrame(() => chooseButton.current?.focus()); }} />}
    {error && <div className="journey-error" role="alert">{error}{mirrorId === null && <button onClick={() => setStage('name')}>Change the name tag</button>}</div>}
  </RoomDialog>;
}
