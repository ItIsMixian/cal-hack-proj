import { useEffect, useRef, useState } from 'react';
import { useReducer, useSpacetimeDB, useTable } from 'spacetimedb/react';
import { reducers, tables } from './module_bindings';
import RoomDialog from './RoomDialog';
import RoomJourney, { useRoomJourney } from './RoomJourney';
import { nextTourStation, TOUR_STATIONS, type RoomStation } from './roomJourneyMath';
import { readRoomTour, roomTourKey, saveRoomTour } from './roomTour';
import type { WordGift } from './WordOffering';
import SourceOffering from './SourceOffering';
import type { MobileShareDraft } from './mobileShare';
import VoiceRehearsal from './VoiceRehearsal';
import CharacterPicker from './CharacterPicker';
import ChangeAppearanceDialog from './ChangeAppearanceDialog';
import { FactConversation } from './MirrorExchanges';
import './first-meeting.css';
import './room-journey.css';

type Stage = 'name' | 'walking' | 'station' | 'paper' | 'reading' | 'rehearsal';
export default function CreateMirror(props: {
  onClose: () => void; onCreated: (name: string) => void;
  sharedDraft?: MobileShareDraft | null; onSharedConsumed?: () => void;
}) {
  const create = useReducer(reducers.createMirrorOnboarding);
  const read = useReducer(reducers.importWriting);
  const activate = useReducer(reducers.setOwnMirrorActive);
  const { identity } = useSpacetimeDB();
  const storageKey = roomTourKey(identity?.toHexString() ?? '', import.meta.env.VITE_SPACETIMEDB_DB_NAME ?? 'mirrorville');
  const [resume] = useState(() => readRoomTour(storageKey));
  const [owned] = useTable(tables.myMirrors), [archived] = useTable(tables.myArchivedMirrors), [imports] = useTable(tables.myImports), [cards] = useTable(tables.myCards);
  const [name, setName] = useState(resume?.name ?? '');
  const [look, setLook] = useState(resume?.look ?? 0);
  const [choosingLook, setChoosingLook] = useState(false);
  const [station, setStation] = useState<RoomStation>('entrance');
  const [stage, setStage] = useState<Stage>(resume ? 'walking' : 'name');
  const [gift, setGift] = useState<WordGift | null>(null);
  const [mirrorId, setMirrorId] = useState<bigint | null>(resume?.mirrorId ? BigInt(resume.mirrorId) : null);
  const [committed, setCommitted] = useState(!!resume?.mirrorId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { pose, walkTo } = useRoomJourney();
  const started = useRef(false), bound = useRef(!!resume?.mirrorId), finished = useRef(false);
  const hold = useRef<Promise<unknown> | null>(null), previousImport = useRef<bigint | null>(null);
  const latest = imports.filter(row => row.mirrorId === mirrorId).sort((a,b) => a.createdAt.microsSinceUnixEpoch > b.createdAt.microsSinceUnixEpoch ? -1 : 1)[0];
  const canReadResult = latest && latest.id !== previousImport.current;
  const busy = saving || (committed && mirrorId === null);
  const own = [...owned, ...archived].find(row => row.id === mirrorId);
  const displayLook = own?.look ?? look;
  const travel = async (next: RoomStation) => {
    if (!name.trim() || busy || pose.moving) return;
    setChoosingLook(false); setError(''); setStation(next); setStage('walking');
    if (await walkTo(next)) setStage('station');
  };
  useEffect(() => {
    const frame = requestAnimationFrame(() => { if (resume && !started.current) { started.current = true; void travel(resume.station); } });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (!finished.current && station !== 'entrance' && name.trim()) saveRoomTour(storageKey, { version: 1, name: name.trim(), look: displayLook, station, mirrorId: mirrorId === null ? null : String(mirrorId) });
  }, [storageKey, name, displayLook, station, mirrorId]);
  useEffect(() => {
    if (!committed || bound.current || finished.current) return;
    const row = [...owned, ...archived].find(row => row.name === name.trim());
    if (!row) return;
    bound.current = true; setMirrorId(row.id);
    hold.current = activate({ mirrorId: row.id, active: false }).catch(() => { setError('Your mirror is already in town; you can keep learning here.'); });
  }, [committed, owned, archived, name, activate]);
  useEffect(() => {
    if (stage === 'reading' && canReadResult && latest.status === 'done' && mirrorId !== null) { setGift(null); void travel('cards'); }
  }, [stage, latest?.id, latest?.status, mirrorId]);
  const give = async (letter: WordGift) => {
    if (busy) return;
    setSaving(true); setError(''); setGift(letter); previousImport.current = latest?.id ?? null;
    try {
      if (mirrorId !== null) await read({ mirrorId, ...letter });
      else { await create({ name: name.trim(), look, words: [], outgoing: false, intent: '', topic: '', ...letter }); setCommitted(true); }
      if (letter.source === 'iPhone · shared item') props.onSharedConsumed?.();
      setStage('reading');
    } catch (e) { setError(e instanceof Error ? e.message : 'The letter did not reach me. Try again?'); }
    finally { setSaving(false); }
  };
  const leave = async () => {
    if (busy || station !== 'door') return;
    setSaving(true); setError('');
    try {
      if (mirrorId !== null) { await hold.current; await activate({ mirrorId, active: true }); }
      else await create({ name: name.trim(), look, words: [], outgoing: false, intent: '', topic: '', text: '', inputKind: 'facts', latestAt: '', relation: 'other' });
      finished.current = true; saveRoomTour(storageKey, null); props.onCreated(name.trim());
    } catch (e) { setError(e instanceof Error ? e.message : 'The door could not open. Try again?'); }
    finally { setSaving(false); }
  };
  const next = nextTourStation(station);
  const labels: Partial<Record<RoomStation, string>> = { cards: 'Continue to the card collection', mirror: 'Continue to the mirror', diary: 'Continue to the diary', door: 'Walk to the door' };
  const content = stage !== 'name' && stage !== 'walking' ? <>
    <p className="tour-progress">Getting to know your room · {Math.min(4, TOUR_STATIONS.indexOf(station as typeof TOUR_STATIONS[number]) + 1)} / 4</p>
    {station === 'desk' && <>
      <h2>Your words</h2>
      {stage === 'paper' ? <SourceOffering busy={busy} initialGift={gift} sharedDraft={props.sharedDraft} onBack={() => setStage('station')} onReady={value => void give(value)} />
        : stage === 'reading' ? <><p role="status">{canReadResult && latest.status === 'failed' ? 'I could not read that letter. Your earlier cards are safe.' : 'Reading your letter… You can continue the tour while I read.'}</p>{canReadResult && latest.status === 'failed' && <button disabled={!gift || busy} onClick={() => { if (gift) void give(gift); }}>Try reading it again</button>}</>
        : <><p>Bring a little of your world. You can add computer activity, GitHub projects, an AI introduction, or your own update here.</p><button onClick={() => setStage('paper')}>Bring a letter</button></>}
    </>}
    {station === 'cards' && <><h2>Card collection</h2><p>Check what I understood and choose what I can share. You can correct these cards whenever you return.</p>
      {mirrorId !== null && cards.some(card => card.mirrorId === mirrorId) ? <FactConversation mirrorId={mirrorId} cards={cards.filter(card => card.mirrorId === mirrorId)} onDone={() => void travel('mirror')} onBringWords={() => {}} />
        : <p>{latest?.status === 'processing' ? 'Your letter is still being read. The cards will appear here when it is ready.' : 'Your collection is empty for now. It grows from the information you choose to bring.'}</p>}
    </>}
    {station === 'mirror' && <><h2>Your reflection</h2><p>Choose your look here, or try a reply and tell me how you would say it.</p>
      <button onClick={() => setChoosingLook(true)}>Change appearance</button>
      {choosingLook && mirrorId === null && <><CharacterPicker inline look={look} onChange={setLook} onClose={() => setChoosingLook(false)} /><button onClick={() => setChoosingLook(false)}>Keep this look</button></>}
      {stage === 'rehearsal' && mirrorId !== null ? <VoiceRehearsal mirrorId={mirrorId} doneLabel="Back to the mirror" onDone={() => setStage('station')} />
        : mirrorId !== null ? <button onClick={() => setStage('rehearsal')}>Try a reply</button> : <p>After you bring some information, we can practise replies here. You can do that later.</p>}
    </>}
    {station === 'diary' && <><h2>Your diary</h2><article className="tour-diary"><small>First page · Example</small><blockquote>今天，我来到了 Mirrorville。</blockquote></article><p>This is where you will find who I met and what we talked about. Come back whenever you want to catch up.</p></>}
    {station === 'door' && <><h2>The town is just outside</h2><p>You have visited all four places. Come back and choose any furniture whenever you like.</p><button disabled={busy} onClick={() => void leave()}>Step into town →</button></>}
    {next && <button className="tour-next" disabled={busy} onClick={() => void travel(next)}>{labels[next]} →</button>}
    {error && <p role="alert">{error}</p>}
  </> : undefined;
  return <RoomDialog title="Your reflection’s room" className="room-journey-dialog" footer={false} onClose={() => { if (!busy) props.onClose(); }}>
    <RoomJourney pose={pose} station={station} overview={stage === 'name'} name={name} look={displayLook}
      speech={pose.moving ? 'Let’s take a look over here.' : ''} disabled={busy || !name.trim()} lookLocked hasLetter={!!gift}
      allowedStations={stage === 'name' ? [] : [station]} onStation={target => { if (target === 'door' && station === 'door') void leave(); }} onLook={() => {}} activity={content}
      naming={stage === 'name' ? <form onSubmit={event => { event.preventDefault(); void travel('desk'); }}><label>Name on the tag<input data-autofocus autoFocus aria-label="Name on your reflection's tag" maxLength={24} value={name} placeholder="You can call me…" onChange={event => setName(event.target.value)} /></label><button type="submit" disabled={!name.trim()} aria-label="Fasten the name tag and walk to the desk">✓</button></form> : undefined} />
    {choosingLook && mirrorId !== null && own && <ChangeAppearanceDialog mirrorId={mirrorId} name={name} savedLook={own.look} onClose={() => setChoosingLook(false)} />}
  </RoomDialog>;
}
