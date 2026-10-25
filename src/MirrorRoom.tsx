import { useMemo, useState } from 'react';
import PixelRoom, { type RoomObject } from './PixelRoom';
import RoomDialog from './RoomDialog';
import ChangeAppearanceDialog from './ChangeAppearanceDialog';
import Diary from './Diary';
import './pixel-room.css';
import { useReducer, useTable } from 'spacetimedb/react';
import { reducers, tables } from './module_bindings';
import type { MirrorCard } from './module_bindings/types';
import {
  FACETS, FACET_LABELS, RELATIONS, RELATION_LABELS, ROOMS, ROOM_LABELS, isVisibleIn, redact, type Facet, type Room,
} from '../spacetimedb/src/redact';
import { ownerWords } from '../spacetimedb/src/fidelity';
import { ASK_YOUR_AI } from './onboarding';
import { venueDay } from '../spacetimedb/src/learning';
import { FactConversation, PersonalityConversation, MirrorSpeaker } from './MirrorExchanges';
import WritingDesk from './WritingDesk';
import LearningJourney from './CreateMirror';
import VoiceRehearsal from './VoiceRehearsal';
import './first-meeting.css';
import { decodeImportFile, looksLikeWeChatCsv, ownWords, parseWeChatCsv, parseWhatsApp, newestDate, sourceScene, sourceDate, sampleFiles, type ParsedChat, type WeChatImport } from './importers';

const MAX_UPLOAD = 30_000;

export default function MirrorRoom(props: { mirrorId: bigint; onBack: () => void; onDiaryOpen?: () => void }) {
  const [activeObject, setActiveObject] = useState<RoomObject | null>(null);
  const [changingAppearance, setChangingAppearance] = useState(false);
  const [journeyStation, setJourneyStation] = useState<'desk' | 'mirror' | null>(null);
  const enterJourney = (station: 'desk' | 'mirror') => { setActiveObject(null); setJourneyStation(station); };
  const [mirrorBeat, setMirrorBeat] = useState<'hello' | 'voice' | 'today' | 'check'>('hello');
  const [deskStart, setDeskStart] = useState<'choose' | 'writing' | 'daily'>('choose');
  const [myMirrors] = useTable(tables.myMirrors);
  const [allCards] = useTable(tables.myCards);
  const [summaries] = useTable(tables.mySummaries);
  const [imports] = useTable(tables.myImports);
  const [learningRows] = useTable(tables.myLearning);
  const learning = learningRows.find(row => row.mirrorId === props.mirrorId);
  const confirmFacts = useReducer(reducers.confirmMirrorFacts);
  const mirror = myMirrors.find((m) => m.id === props.mirrorId);
  const cards = useMemo(
    () => [...allCards].filter((c) => c.mirrorId === props.mirrorId).sort((a, b) => Number(a.id - b.id)),
    [allCards, props.mirrorId],
  );
  const latestImport = [...imports]
    .filter((i) => i.mirrorId === props.mirrorId)
    .sort((a, b) => a.createdAt.microsSinceUnixEpoch > b.createdAt.microsSinceUnixEpoch ? -1 : a.createdAt.microsSinceUnixEpoch < b.createdAt.microsSinceUnixEpoch ? 1 : 0)[0];

  if (!mirror) return <section className="pixel-room"><p>This mirror is away from town or still loading.</p><button onClick={props.onBack}>← Back to town</button></section>;
  const everyday = cards.filter((c) => !c.personal);
  const personal = cards.filter((c) => c.personal);

  const titles: Record<RoomObject, string> = {
    mirror: 'Looking in the mirror', diary: 'Your diary', cards: 'Your card collection',
    desk: 'At the writing desk',
  };
  return (
    <section className="pixel-room room-fullscreen" aria-label={`${mirror.name}'s Mirror Room`}>
      <div className="room-hud">
        <button className="room-exit" autoFocus onClick={props.onBack}>← Back to town</button>
        <div><p className="room-kicker">MIRRORVILLE / HOME</p><h1>{mirror.name}'s room</h1></div>
        <button onClick={() => setChangingAppearance(true)}>Change appearance</button>
      </div>
      {changingAppearance && <ChangeAppearanceDialog key={String(mirror.id)} mirrorId={mirror.id} name={mirror.name} savedLook={mirror.look} onClose={() => setChangingAppearance(false)} />}
      <PixelRoom name={mirror.name} look={mirror.look} onOpen={object => {
        if (object === 'desk') enterJourney(object); else setActiveObject(object); setMirrorBeat('hello'); setDeskStart('choose');
        if (object === 'diary') props.onDiaryOpen?.();
      }} />
      <div className="room-invitations">
        {cards.length > 0 && learning?.reviewed === false && <button onClick={() => setActiveObject('cards')}>“I learned a little about you. Does it feel right?” →</button>}
        {cards.length === 0 && <button onClick={() => { setDeskStart('choose'); enterJourney('desk'); }}>{learning?.words ? '“I only know the little you told me. Pull up a chair?”' : '“I do not know much about you yet. Bring me a little of your world?”'} →</button>}
      </div>
      <p className="room-art-credit">Character: Cup Nooble · Sprout Lands</p>
      {journeyStation && <LearningJourney existing={{ id: mirror.id, name: mirror.name, look: mirror.look }} startAt={journeyStation} onClose={() => setJourneyStation(null)} onCreated={() => { setJourneyStation(null); props.onBack(); }} />}
      {activeObject && <RoomDialog title={titles[activeObject]} onClose={() => setActiveObject(null)}>
        {activeObject === 'mirror' && <>
          <MirrorSpeaker name={mirror.name} look={mirror.look} />
          <p className="room-self-card">{ownerWords(summaries.find(summary => summary.mirrorId === mirror.id)?.text || mirror.selfCard)}</p>
          {mirrorBeat === 'hello' && <div className="mirror-exchange"><p className="exchange-line">There you are.<br />What shall we try together?</p><div className="exchange-choices exchange-responses">
            <button onClick={() => enterJourney('mirror')}>Let me hear your voice →</button>
            <button onClick={() => setActiveObject('cards')}>Tell me what you know about me →</button>
            <button onClick={() => setMirrorBeat('today')}>Before you head out… →</button>
            <button className="exchange-back" onClick={() => setMirrorBeat('check')}>Let's do the little personality check</button>
          </div></div>}
          {mirrorBeat === 'voice' && <VoiceRehearsal mirrorId={mirror.id} onDone={() => setActiveObject(null)} />}
          {mirrorBeat === 'today' && <TodayTopic mirrorId={mirror.id} savedIntent={mirror.intent} savedTopic={learning?.topicDay === venueDay(BigInt(Date.now()) * 1000n) ? learning.topic : ''} onDone={() => setActiveObject(null)} />}
          {mirrorBeat === 'check' && <PersonalityConversation mirrorId={mirror.id} onDone={() => setActiveObject(null)} />}
          <section className="room-contact-details" aria-labelledby="room-contact-heading">
            <h3 id="room-contact-heading">Contact details</h3>
            <ContactField key={String(mirror.id)} mirrorId={mirror.id} saved={mirror.contact} />
          </section>
        </>}
        {activeObject === 'diary' && <Diary mirrorId={mirror.id} />}
        {activeObject === 'cards' && <>
          <MirrorSpeaker name={mirror.name} look={mirror.look} />
          <FactConversation mirrorId={mirror.id} cards={cards} onDone={() => setActiveObject(null)} onBringWords={() => { setDeskStart('choose'); enterJourney('desk'); }} />
          <details className="quiet-note"><summary>Lay out all my cards and sharing choices</summary>
          <p>{ownerWords(summaries.find(summary => summary.mirrorId === mirror.id)?.text || mirror.selfCard)}</p>
          {cards.length === 0 && <div className="room-empty"><h3>A collection waiting to grow</h3>
            <p>Your mirror only knows what you have given it. Add a summary or your own writing at the desk.</p>
            <button onClick={() => enterJourney('desk')}>Sit at the writing desk →</button></div>}
          {FACETS.map((facet) => {
            const group = everyday.filter((c) => c.facet === facet);
            return group.length > 0 && <div key={facet} className="facet"><h3>{FACET_LABELS[facet]}</h3>
              {group.slice(0, 2).map(card => <CardView key={String(card.id)} card={card} />)}</div>;
          })}
          {personal.length > 0 && <div className="facet private"><h3>Only you see these</h3>
            <p className="muted small">These sounded personal, so your mirror keeps them to itself. Turn one on for a room if you want it to know.</p>
            {FACETS.flatMap(facet => personal.filter(card => card.facet === facet).slice(0, Math.max(0, 2 - everyday.filter(card => card.facet === facet).length))).map(card => <CardView key={String(card.id)} card={card} />)}</div>}
          {FACETS.some(facet => cards.filter(card => card.facet === facet).length > 2) && <details>
            <summary>More cards kept from your edits or earlier imports</summary>
            {FACETS.flatMap(facet => [...everyday.filter(card => card.facet === facet), ...personal.filter(card => card.facet === facet)].slice(2))
              .map(card => <CardView key={String(card.id)} card={card} />)}
          </details>}
          <p className="muted small rooms-note">Defaults: strangers at Cal Hacks and teammates see who you are, what you do and what you're into; what you've been up to and your softer side stay with old friends. Only the Cal Hacks room is open so far; your choices carry over.</p>
          <AddCard mirrorId={mirror.id} />
          {cards.length > 0 && learning?.reviewed === false && <button onClick={() => { void confirmFacts({ mirrorId: mirror.id }); }}>I've checked these facts</button>}
          </details>
        </>}
        {activeObject === 'desk' && <>
          <MirrorSpeaker name={mirror.name} look={mirror.look} />
          <WritingDesk key={`${mirror.id}/${deskStart}`} mirrorId={mirror.id} initial={deskStart} status={latestImport} dailyAvailable={learning?.dailyDay !== venueDay(BigInt(Date.now()) * 1000n)} dailyCount={learning?.dailyCount ?? 0} onReview={() => setActiveObject('cards')} />
          <details className="quiet-note"><summary>Leave a small written note instead</summary><AddCard mirrorId={mirror.id} /></details>
        </>}
      </RoomDialog>}
    </section>
  );
}

function ContactField({ mirrorId, saved }: { mirrorId: bigint; saved: string }) {
  const saveContact = useReducer(reducers.setContact);
  const [draft, setDraft] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const value = draft ?? saved;
  return <form className="contact-field" onSubmit={async event => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try { await saveContact({ mirrorId, contact: value }); setDraft(null); }
    catch { setError('Could not save contact details. Please try again.'); }
    finally { setBusy(false); }
  }}>
    <label htmlFor="mirror-contact">How people can reach you once you both say yes</label>
    <p className="muted small" id="contact-help">Email, Instagram, WeChat, or another way to say hello. Shared only with someone you are both interested in.</p>
    <div className="contact-input">
      <input id="mirror-contact" value={value} maxLength={120} aria-describedby="contact-help"
        placeholder="e.g. Instagram @yourname" onChange={event => setDraft(event.target.value)} />
      <button disabled={busy || value === saved} type="submit">{busy ? 'Saving…' : 'Save contact'}</button>
    </div>
    {error && <p className="error small">{error}</p>}
  </form>;
}

function CardView({ card }: { card: MirrorCard }) {
  const setRoom = useReducer(reducers.setCardRoom);
  const rewrite = useReducer(reducers.rewriteCard);
  const undo = useReducer(reducers.undoCardEdit);
  const remove = useReducer(reducers.deleteCard);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(card.text);

  const toggle = (room: Room) => {
    const visible = isVisibleIn(card, room);
    const defaultVisible = isVisibleIn({ ...card, rooms: '' }, room);
    // Flipping back to the default clears the override instead of pinning it.
    const next = !visible === defaultVisible ? 'default' : visible ? 'off' : 'on';
    void setRoom({ cardId: card.id, room, state: next });
  };

  return (
    <div className="mcard">
      {editing ? (
        <div className="mcard-edit">
          <input value={draft} maxLength={200} onChange={(e) => setDraft(e.target.value)} autoFocus />
          <button
            className="primary small"
            onClick={async () => {
              await rewrite({ cardId: card.id, text: draft });
              setEditing(false);
            }}
          >
            Save
          </button>
          <button className="ghost small" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <p className="mcard-text">{ownerWords(card.text)}</p>
      )}
      <div className="chips">
        {ROOMS.map((room) => (
          <button
            key={room}
            className={isVisibleIn(card, room) ? 'chip on' : 'chip'}
            aria-pressed={isVisibleIn(card, room)}
            onClick={() => toggle(room)}
            title={isVisibleIn(card, room) ? `Shown in ${ROOM_LABELS[room]}` : `Hidden in ${ROOM_LABELS[room]}`}
          >
            {isVisibleIn(card, room) ? '✓ ' : '✗ '}{ROOM_LABELS[room]}
          </button>
        ))}
      </div>
      {!editing && (
        <div className="mcard-meta">
          <span className="muted small">
            {card.source}
            {card.editedByOwner && ' · in your words'}
          </span>
          <button
            className="ghost small"
            onClick={() => {
              setDraft(card.text);
              setEditing(true);
            }}
          >
            That's not me
          </button>
          {card.previousText && (
            <button className="ghost small" onClick={() => undo({ cardId: card.id })}>
              Undo
            </button>
          )}
          <button className="ghost small" onClick={() => remove({ cardId: card.id })}>
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

export type PreparedImport = { text: string; inputKind: string; relation: string; source: string; latestAt: string };
export function Importer({ mirrorId, busy, onPrepared }: { mirrorId: bigint; busy: boolean; onPrepared?: (value: PreparedImport | null) => void }) {
  const importText = useReducer(reducers.importWriting);
  const [inputKind, setInputKind] = useState('ai_summary');
  const [clipboardStatus, setClipboardStatus] = useState('');
  const [sending, setSending] = useState(false);
  const [wechat, setWechat] = useState<WeChatImport | null>(null);
  const [reading, setReading] = useState(false);
  const [chat, setChat] = useState<ParsedChat | null>(null);
  const [pasted, setPasted] = useState('');
  const [fileName, setFileName] = useState('');
  const [me, setMe] = useState('');
  const [relation, setRelation] = useState<(typeof RELATIONS)[number]>('other');
  const [latestAt, setLatestAt] = useState('');
  const [changingScene, setChangingScene] = useState(false);
  const [error, setError] = useState('');

  const onFiles = async (files: File[]) => {
    onPrepared?.(null);
    setError(''); setChat(null); setWechat(null); setPasted(''); setMe(''); setFileName(''); setLatestAt(''); setInputKind('writing');
    setReading(true);
    try {
      if (files.length > 20 || files.reduce((sum, file) => sum + file.size, 0) > 10 * 1024 * 1024) throw new Error('Please choose up to 20 files, under 10 MB in total.');
      const values = await Promise.all(files.map(async file => decodeImportFile(await file.arrayBuffer())));
      const value = values[0];
      const csv = files.every((file, index) => /\.csv$/i.test(file.name) || looksLikeWeChatCsv(values[index]));
      if (csv) {
        const parsed = values.map(parseWeChatCsv);
        const date = newestDate(...parsed.map(item => item.latestAt));
        setWechat({ text: sampleFiles(parsed.map(item => item.text)), latestAt: date,
          total: parsed.reduce((sum, item) => sum + item.total, 0), kept: parsed.reduce((sum, item) => sum + item.kept, 0),
          dropped: parsed.reduce((sum, item) => sum + item.dropped, 0) });
        setLatestAt(date); setRelation('friends');
      } else {
        if (files.some((file,index) => /\.csv$/i.test(file.name) || looksLikeWeChatCsv(values[index]))) throw new Error('Select CSV exports separately from text files.');
        const parsed = files.length === 1 ? parseWhatsApp(value) : null;
        if (parsed) { setChat(parsed); setRelation('friends'); }
        else {
          setPasted(sampleFiles(values));
          setRelation(values.every(value => sourceScene(value) === 'ai') ? 'ai' : values.every(value => sourceScene(value) === 'friends') ? 'friends' : 'other');
          setLatestAt(newestDate(...values.map(sourceDate)));
          setInputKind(values.every(value => sourceScene(value) === 'ai') ? 'ai_chat' : 'facts');
        }
      }
      setFileName(`${files.length} ${files.length === 1 ? 'file' : 'files'}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read this file.');
    } finally { setReading(false); }
  };

  const pastedCsv = !chat && !wechat && looksLikeWeChatCsv(pasted);
  const text = wechat ? wechat.text : chat ? (me ? ownWords(chat, me) : '') : pastedCsv ? '' : redact(pasted);
  // Do not send filenames, contact IDs, timestamps or the other speakers' names.
  const source = inputKind === 'ai_summary' ? "Your AI's summary" : `${relation === 'ai' ? 'AI assistant' : wechat ? 'WeChat / PyWxDump' : chat ? 'WhatsApp' : 'Your words'} · ${relation}`;
  const messageLatestAt = chat ? newestDate(...chat.lines.filter(line => line.speaker === me).map(line => line.at)) : latestAt;

  const submit = async () => {
    if (reading || busy || sending || text.trim().length < 40) return;
    setError(''); setSending(true);
    try {
      const prepared = { relation: inputKind === 'ai_summary' ? 'other' : relation, source, text: text.slice(0, MAX_UPLOAD), latestAt: messageLatestAt, inputKind };
      if (onPrepared) { onPrepared(prepared); return; }
      await importText({ mirrorId, ...prepared });
      setChat(null);
      setWechat(null);
      setPasted('');
      setFileName('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setSending(false); }
  };

  return (
    <div className="importer">
      <div className="onboarding-options" role="group" aria-label="What would you like to add?">
        <button aria-pressed={inputKind === 'ai_summary'} onClick={() => { onPrepared?.(null); setInputKind('ai_summary'); setRelation('other'); setChat(null); setWechat(null); setPasted(''); setLatestAt(''); setFileName(''); }}>Ask your AI</button>
        <button aria-pressed={inputKind === 'writing'} onClick={() => { onPrepared?.(null); setInputKind('writing'); setRelation('other'); setChat(null); setWechat(null); setPasted(''); setLatestAt(''); setFileName(''); }}>My own messages</button>
      </div>
      {inputKind === 'ai_summary' && <div className="ai-prompt"><p>Copy the prompt to an AI that knows you, then paste its answer here.</p>
        <details><summary>Read the prompt</summary><textarea aria-label="Prompt for your AI" readOnly rows={6} value={ASK_YOUR_AI} /></details>
        <button onClick={async () => { try { await navigator.clipboard.writeText(ASK_YOUR_AI); setClipboardStatus('Prompt copied. Paste it into your AI assistant.'); } catch { setClipboardStatus('Copy the prompt from the box above.'); } }}>Copy prompt</button>
        <p className="muted small">Your AI's memory may be old or mistaken. This gives your mirror facts, not your voice.</p></div>}
      {inputKind === 'writing' && <p>Want it to sound like you? Add a dozen messages you wrote recently. Only your words, without anyone else's replies. AI summaries cannot teach your voice.</p>}
      <p className="muted small">Only share information about yourself. We remove contact details before processing. Raw text is discarded after reading; you can check and correct what your mirror learns.</p>
      <details className="file-import"><summary>Or choose a writing file / chat export</summary>
      <p className="muted small">Chat exports are filtered in your browser to keep only your own plain-text messages. Other people's messages, quoted replies and media are skipped.</p>
      <div className="import-row">
        <input type="file" aria-label="Import your writing or chat export" disabled={reading} multiple accept=".csv,.txt,text/csv,text/plain" onChange={event => {
          const files = Array.from(event.currentTarget.files ?? []);
          event.currentTarget.value = '';
          if (files.length) void onFiles(files);
        }} />
        <div className="scene-choice"><span>Read as: <strong>{RELATION_LABELS[relation]}</strong></span>{' '}
          <button className="ghost small" aria-expanded={changingScene} onClick={() => setChangingScene(!changingScene)}>change</button>
          {changingScene && <div className="speakers">{RELATIONS.map(scene => <button key={scene} aria-pressed={relation === scene} onClick={() => { onPrepared?.(null); setRelation(scene); setChangingScene(false); }}>{RELATION_LABELS[scene]}</button>)}</div>}
        </div>
      </div>
      <p className="muted small">You can select several CSV exports or AI scene text files together. Each file gets an equal share of the reading limit.</p>
      </details>
      {reading && <p role="status">Reading the file locally…</p>}
      {wechat ? <div className="wechat-summary" role="status">
        <strong>WeChat / PyWxDump recognized</strong>
        <p>Keeping {wechat.kept} of {wechat.total} messages: only your sent plain text. Skipped {wechat.dropped} received or non-text messages.</p>
        {wechat.kept === 0 && <p>No sent plain-text messages were found. Nothing will be uploaded.</p>}
      </div> : chat ? (
        <div className="field">
          <span>Which one is you?</span>
          <div className="speakers">
            {[...chat.speakers.entries()].map(([name, count]) => (
              <button key={name} className={name === me ? 'selected' : ''} onClick={() => { onPrepared?.(null); setMe(name); }}>
                {name} <span className="muted">({count})</span>
              </button>
            ))}
          </div>
          <small className="muted">
            Keeping {chat.lines.filter((l) => l.speaker === me).length} of your messages. Everyone else's are dropped.
          </small>
        </div>
      ) : (
        <textarea
          aria-label="Your own messages or writing"
          rows={3}
          value={pasted}
          onChange={(e) => { onPrepared?.(null); setPasted(e.target.value); setRelation('other'); setLatestAt(''); }}
          placeholder={inputKind === 'ai_summary' ? "Paste your AI’s answer here" : "Paste only messages or writing you wrote"}
        />
      )}
      {!chat && !wechat && <button onClick={async () => { try { onPrepared?.(null); setPasted((await navigator.clipboard.readText()).slice(0, MAX_UPLOAD)); setLatestAt(''); setClipboardStatus('Pasted. Check the redacted preview below.'); } catch { setClipboardStatus('Your browser blocked clipboard access. Paste into the text box instead.'); } }}>Paste</button>}
      {clipboardStatus && <p role="status" className="muted small">{clipboardStatus}</p>}
      {pastedCsv && <p className="error small">This looks like a WeChat export. Choose the CSV file above so we can keep only your own messages.</p>}
      {text && <details className="import-preview"><summary>Preview what your mirror will read ({Math.min(text.length, MAX_UPLOAD)} characters)</summary>
        <textarea aria-label="Filtered and redacted import preview" readOnly rows={6} value={text.slice(0, MAX_UPLOAD)} />
      </details>}
      {messageLatestAt && <p className="muted small">Newest message: {messageLatestAt.slice(0, 10)}</p>}
      {text && text.trim().length < 40 && <p className="muted small">Not enough text yet (at least 40 characters). Select more WeChat CSV files together, or add a note below.</p>}
      {text.length > MAX_UPLOAD && <p className="muted small">Only the first {MAX_UPLOAD.toLocaleString()} characters shown in the preview will be sent.</p>}
      {fileName && !wechat && !chat && relation !== 'ai' && <label className="field"><span><input type="checkbox" checked={inputKind === 'writing'} onChange={e => { onPrepared?.(null); setInputKind(e.target.checked ? 'writing' : 'facts'); }} /> This file contains only messages I wrote to people (also learn my voice)</span></label>}
      {fileName && <p className="muted small">{fileName} ready in this browser. Filenames are not sent.</p>}
      {error && <p role="alert" className="error small">{error}</p>}
      <div className="actions">
        <button className="primary" disabled={reading || busy || sending || text.trim().length < 40} onClick={submit}>
          {busy || sending ? 'Reading…' : onPrepared ? 'Use this for my mirror' : 'Let my mirror read this'}
        </button>
      </div>
    </div>
  );
}

function AddCard({ mirrorId }: { mirrorId: bigint }) {
  const addCard = useReducer(reducers.addCard);
  const [facet, setFacet] = useState<Facet>('core');
  const [text, setText] = useState('');
  const submit = async () => {
    if (!text.trim()) return;
    await addCard({ mirrorId, facet, text });
    setText('');
  };
  return (
    <div className="add-card">
      <select aria-label="Note topic" value={facet} onChange={(e) => setFacet(e.target.value as Facet)}>
        {FACETS.map((f) => (
          <option key={f} value={f}>
            {FACET_LABELS[f]}
          </option>
        ))}
      </select>
      <input
        aria-label="Your note"
        value={text}
        maxLength={200}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Or tell it something in your own words"
      />
      <button onClick={submit}>Add</button>
    </div>
  );
}

function TodayTopic({ mirrorId, savedIntent, savedTopic, onDone }: { mirrorId: bigint; savedIntent: string; savedTopic: string; onDone: () => void }) {
  const save = useReducer(reducers.setTodayTopic);
  const [beat, setBeat] = useState<'where' | 'topic'>('where');
  const [intent, setIntent] = useState(savedIntent);
  const [topic, setTopic] = useState(savedTopic);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return <div className="mirror-exchange">
    <p className="exchange-line">{beat === 'where' ? 'Where should I wander today?' : 'Anything you would like me to bring up? Just for today.'}</p>
    {beat === 'where' ? <><input autoFocus className="spoken-answer" aria-label="Where should your mirror go today?" maxLength={300} value={intent} onChange={event => setIntent(event.target.value)} placeholder="Follow your feet, or…" /><div className="exchange-choices"><button className="exchange-primary" onClick={() => setBeat('topic')}>Before you go →</button><button onClick={onDone}>Another time</button></div></> : <>
      <textarea autoFocus className="writing-paper" aria-label="A topic just for today" rows={3} maxLength={300} value={topic} onChange={event => setTopic(event.target.value)} placeholder="A thought to take along… (optional)" />
      <div className="exchange-choices"><button className="exchange-primary" disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await save({ mirrorId, intent, topic }); onDone(); } catch { setError('I could not keep that thought. Try again?'); } finally { setBusy(false); } }}>Off you go →</button><button disabled={busy} onClick={() => setBeat('where')}>← About where we're going…</button></div>
    </>}{error && <p role="alert">{error}</p>}
  </div>;
}
