import { useMemo, useState } from 'react';
import PixelRoom, { type RoomObject } from './PixelRoom';
import RoomDialog from './RoomDialog';
import Diary from './Diary';
import './pixel-room.css';
import { useReducer, useTable } from 'spacetimedb/react';
import { reducers, tables } from './module_bindings';
import type { MirrorCard } from './module_bindings/types';
import {
  FACETS, FACET_LABELS, RELATIONS, RELATION_LABELS, ROOMS, ROOM_LABELS, isVisibleIn, redact, type Facet, type Room,
} from '../spacetimedb/src/redact';
import { ownerWords } from '../spacetimedb/src/fidelity';
import CharacterAvatar from './CharacterAvatar';
import { decodeImportFile, looksLikeWeChatCsv, ownWords, parseWeChatCsv, parseWhatsApp, newestDate, sourceScene, sourceDate, sampleFiles, type ParsedChat, type WeChatImport } from './importers';

const MAX_UPLOAD = 30_000;

export default function MirrorRoom(props: { mirrorId: bigint; onBack: () => void; onDiaryOpen?: () => void }) {
  const [activeObject, setActiveObject] = useState<RoomObject | null>(null);
  const [myMirrors] = useTable(tables.myMirrors);
  const [allCards] = useTable(tables.myCards);
  const [imports] = useTable(tables.myImports);
  const mirror = myMirrors.find((m) => m.id === props.mirrorId);
  const cards = useMemo(
    () => [...allCards].filter((c) => c.mirrorId === props.mirrorId).sort((a, b) => Number(a.id - b.id)),
    [allCards, props.mirrorId],
  );
  const latestImport = [...imports]
    .filter((i) => i.mirrorId === props.mirrorId)
    .sort((a, b) => Number(b.id - a.id))[0];

  if (!mirror) return null;
  const everyday = cards.filter((c) => !c.personal);
  const personal = cards.filter((c) => c.personal);
  const sharedHere = cards.filter((c) => isVisibleIn(c, 'venue')).length;

  const titles: Record<RoomObject, string> = {
    mirror: 'Looking in the mirror', diary: 'Your diary', cards: 'Your card collection',
    desk: 'At the writing desk',
  };
  return (
    <section className="pixel-room room-fullscreen" aria-label={`${mirror.name}'s Mirror Room`}>
      <div className="room-hud">
        <button className="room-exit" autoFocus onClick={props.onBack}>← Back to town</button>
        <div><p className="room-kicker">MIRRORVILLE / HOME</p><h1>{mirror.name}'s room</h1></div>
      </div>
      <PixelRoom onOpen={object => {
        setActiveObject(object);
        if (object === 'diary') props.onDiaryOpen?.();
      }} />
      <p className="room-art-credit">Character: Cup Nooble · Sprout Lands</p>
      {activeObject && <RoomDialog title={titles[activeObject]} onClose={() => setActiveObject(null)}>
        {activeObject === 'mirror' && <>
          <div className="room-portrait"><CharacterAvatar look={mirror.look} name={mirror.name} />
            <div><h3>{mirror.name}</h3><p>Your mirror sees you as someone who…</p></div></div>
          <p className="room-self-card">{ownerWords(mirror.selfCard)}</p>
          <p className="muted">Today: {mirror.intent || 'No intent set. A little room to wander.'}</p>
          <p className="muted small">Showing {sharedHere} of {cards.length} cards at Cal Hacks. You decide which sides of you your mirror brings along.</p>
          <button onClick={() => setActiveObject('cards')}>Open the card collection →</button>
          <section className="room-contact-details" aria-labelledby="room-contact-heading">
            <h3 id="room-contact-heading">Contact details</h3>
            <ContactField key={String(mirror.id)} mirrorId={mirror.id} saved={mirror.contact} />
          </section>
        </>}
        {activeObject === 'diary' && <Diary mirrorId={mirror.id} />}
        {activeObject === 'cards' && <>
          {cards.length === 0 && <div className="room-empty"><h3>A collection waiting to grow</h3>
            <p>Your personality check is already part of your mirror. Add your own writing at the desk to help it get to know you.</p>
            <button onClick={() => setActiveObject('desk')}>Sit at the writing desk →</button></div>}
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
        </>}
        {activeObject === 'desk' && <>
          <p>A few of your words can help your mirror understand you better.</p>
          <Importer mirrorId={mirror.id} busy={latestImport?.status === 'processing'} />
          {latestImport && <p role="status" className={latestImport.status === 'failed' ? 'error small' : 'muted small'}>
            {latestImport.status === 'processing' ? `Reading ${latestImport.source}… this takes a few seconds.` : `${latestImport.source}: ${latestImport.message}`}</p>}
          <h3>Leave a little note</h3><AddCard mirrorId={mirror.id} />
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

function Importer({ mirrorId, busy }: { mirrorId: bigint; busy: boolean }) {
  const importText = useReducer(reducers.importText);
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
    setError(''); setChat(null); setWechat(null); setPasted(''); setMe(''); setFileName(''); setLatestAt('');
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
  const source = `${relation === 'ai' ? 'AI assistant' : wechat ? 'WeChat / PyWxDump' : chat ? 'WhatsApp' : 'Your words'} · ${relation}`;
  const messageLatestAt = chat ? newestDate(...chat.lines.filter(line => line.speaker === me).map(line => line.at)) : latestAt;

  const submit = async () => {
    if (reading || busy || text.trim().length < 40) return;
    setError('');
    try {
      await importText({ mirrorId, relation, source, text: text.slice(0, MAX_UPLOAD), latestAt: messageLatestAt });
      setChat(null);
      setWechat(null);
      setPasted('');
      setFileName('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="importer">
      <p className="muted small">
        Bring a WeChat CSV exported by PyWxDump, a WhatsApp text export, or your own writing. WeChat imports keep only your sent plain-text messages; received messages, quotes, forwards and media are skipped. It's read here in your browser, only your own lines are kept, and emails, numbers and links are removed
        before anything is sent. The original file stays in your browser; only the filtered, redacted text is sent for processing.
      </p>
      <div className="import-row">
        <input type="file" aria-label="Import your writing or chat export" disabled={reading} multiple accept=".csv,.txt,text/csv,text/plain" onChange={event => {
          const files = Array.from(event.currentTarget.files ?? []);
          event.currentTarget.value = '';
          if (files.length) void onFiles(files);
        }} />
        <div className="scene-choice"><span>Read as: <strong>{RELATION_LABELS[relation]}</strong></span>{' '}
          <button className="ghost small" aria-expanded={changingScene} onClick={() => setChangingScene(!changingScene)}>change</button>
          {changingScene && <div className="speakers">{RELATIONS.map(scene => <button key={scene} aria-pressed={relation === scene} onClick={() => { setRelation(scene); setChangingScene(false); }}>{RELATION_LABELS[scene]}</button>)}</div>}
        </div>
      </div>
      <p className="muted small">You can select several CSV exports or AI scene text files together. Each file gets an equal share of the reading limit.</p>
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
              <button key={name} className={name === me ? 'selected' : ''} onClick={() => setMe(name)}>
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
          onChange={(e) => { setPasted(e.target.value); setRelation('other'); setLatestAt(''); }}
          placeholder="…or paste your own messages, a bio, an old post"
        />
      )}
      {pastedCsv && <p className="error small">This looks like a WeChat export. Choose the CSV file above so we can keep only your own messages.</p>}
      {text && <details className="import-preview"><summary>Preview what your mirror will read ({Math.min(text.length, MAX_UPLOAD)} characters)</summary>
        <textarea aria-label="Filtered and redacted import preview" readOnly rows={6} value={text.slice(0, MAX_UPLOAD)} />
      </details>}
      {messageLatestAt && <p className="muted small">Newest message: {messageLatestAt.slice(0, 10)}</p>}
      {text && text.trim().length < 40 && <p className="muted small">Not enough text yet (at least 40 characters). Select more WeChat CSV files together, or add a note below.</p>}
      {text.length > MAX_UPLOAD && <p className="muted small">Only the first {MAX_UPLOAD.toLocaleString()} characters shown in the preview will be sent.</p>}
      {fileName && <p className="muted small">{fileName} ready in this browser. Filenames are not sent.</p>}
      {error && <p role="alert" className="error small">{error}</p>}
      <div className="actions">
        <button className="primary" disabled={reading || busy || text.trim().length < 40} onClick={submit}>
          {busy ? 'Reading…' : 'Let my mirror read this'}
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
