import { useMemo, useState } from 'react';
import { useReducer, useTable } from 'spacetimedb/react';
import { reducers, tables } from './module_bindings';
import type { MirrorCard } from './module_bindings/types';
import {
  FACETS, FACET_LABELS, RELATIONS, ROOMS, ROOM_LABELS, isVisibleIn, redact, type Facet, type Room,
} from '../spacetimedb/src/redact';
import CharacterAvatar from './CharacterAvatar';
import { ownWords, parseWhatsApp, type ParsedChat } from './importers';

const MAX_UPLOAD = 30_000;

export default function MirrorRoom(props: { mirrorId: bigint; onBack: () => void }) {
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

  return (
    <section className="room">
      <button className="ghost small back" onClick={props.onBack}>
        ← Back to town
      </button>

      <div className="room-head">
        <CharacterAvatar look={mirror.look} name={mirror.name} />
        <div>
          <h2>{mirror.name}'s Mirror Room</h2>
          <p className="muted">How your mirror understands you, and which side of you it brings where.</p>
        </div>
      </div>

      <ContactField key={String(mirror.id)} mirrorId={mirror.id} saved={mirror.contact} />

      <div className="portrait">
        <p className="portrait-lead">Your mirror sees you as someone who…</p>
        <p>{mirror.selfCard}</p>
        <p className="muted small">
          Today: {mirror.intent || 'No intent set'} · Showing {sharedHere} of {cards.length} cards at Cal Hacks
        </p>
      </div>

      {cards.length === 0 && (
        <p className="muted">Nothing here yet beyond your personality check. Add something below and your mirror will get to know you better.</p>
      )}

      {FACETS.map((facet) => {
        const group = everyday.filter((c) => c.facet === facet);
        if (group.length === 0) return null;
        return (
          <div key={facet} className="facet">
            <h3>{FACET_LABELS[facet]}</h3>
            {group.map((card) => (
              <CardView key={String(card.id)} card={card} />
            ))}
          </div>
        );
      })}

      {personal.length > 0 && (
        <div className="facet private">
          <h3>Only you see these</h3>
          <p className="muted small">
            These sounded personal, so your mirror keeps them to itself. Turn one on for a room if you want it to know.
          </p>
          {personal.map((card) => (
            <CardView key={String(card.id)} card={card} />
          ))}
        </div>
      )}

      <p className="muted small rooms-note">
        Defaults: strangers at Cal Hacks and teammates see who you are, what you do and what you're into; what you've been up to
        and your softer side stay with old friends. Only the Cal Hacks room is open so far; your choices carry over.
      </p>

      <details className="add-more" open={cards.length === 0}>
        <summary>Add more of you</summary>
        <Importer mirrorId={mirror.id} busy={latestImport?.status === 'processing'} />
        {latestImport && (
          <p className={latestImport.status === 'failed' ? 'error small' : 'muted small'}>
            {latestImport.status === 'processing'
              ? `Reading ${latestImport.source}… this takes a few seconds.`
              : `${latestImport.source}: ${latestImport.message}`}
          </p>
        )}
        <AddCard mirrorId={mirror.id} />
      </details>
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
        <p className="mcard-text">{card.text}</p>
      )}
      <div className="chips">
        {ROOMS.map((room) => (
          <button
            key={room}
            className={isVisibleIn(card, room) ? 'chip on' : 'chip'}
            onClick={() => toggle(room)}
            title={isVisibleIn(card, room) ? `Shown in ${ROOM_LABELS[room]}` : `Hidden in ${ROOM_LABELS[room]}`}
          >
            {ROOM_LABELS[room]}
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
  const [chat, setChat] = useState<ParsedChat | null>(null);
  const [pasted, setPasted] = useState('');
  const [fileName, setFileName] = useState('');
  const [me, setMe] = useState('');
  const [relation, setRelation] = useState<(typeof RELATIONS)[number]>('friends');
  const [error, setError] = useState('');

  const onFile = async (file: File) => {
    setError('');
    const text = await file.text();
    const parsed = parseWhatsApp(text);
    setFileName(file.name);
    if (parsed) {
      setChat(parsed);
      setPasted('');
      // Default to whoever wrote the most; the owner confirms.
      setMe([...parsed.speakers.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '');
    } else {
      setChat(null);
      setPasted(text);
    }
  };

  const text = chat ? (me ? ownWords(chat, me) : '') : redact(pasted);
  const source = chat ? `WhatsApp · ${relation}` : fileName ? `${fileName} · ${relation}` : `Your words · ${relation}`;

  const submit = async () => {
    setError('');
    try {
      await importText({ mirrorId, relation, source, text: text.slice(0, MAX_UPLOAD) });
      setChat(null);
      setPasted('');
      setFileName('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="importer">
      <p className="muted small">
        Hand over something that already exists: a WhatsApp export (Chat → More → Export chat, without media), or your own
        writing. It's read here in your browser, only your own lines are kept, and emails, numbers and links are removed
        before anything is sent. Nothing you upload is stored.
      </p>
      <div className="import-row">
        <input type="file" accept=".txt,text/plain" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        <label>
          Chats with my{' '}
          <select value={relation} onChange={(e) => setRelation(e.target.value as (typeof RELATIONS)[number])}>
            {RELATIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      </div>
      {chat ? (
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
          rows={3}
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          placeholder="…or paste your own messages, a bio, an old post"
        />
      )}
      {error && <p className="error small">{error}</p>}
      <div className="actions">
        <button className="primary" disabled={busy || text.trim().length < 40} onClick={submit}>
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
      <select value={facet} onChange={(e) => setFacet(e.target.value as Facet)}>
        {FACETS.map((f) => (
          <option key={f} value={f}>
            {FACET_LABELS[f]}
          </option>
        ))}
      </select>
      <input
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
