import { useMemo, useState } from 'react';
import { useReducer, useTable } from 'spacetimedb/react';
import { reducers, tables } from './module_bindings';
import type { MirrorCard } from './module_bindings/types';
import { FACETS, FACET_LABELS, RELATIONS, redact, type Facet } from '../spacetimedb/src/redact';
import { ownWords, parseWhatsApp, type ParsedChat } from './importers';
import Modal from './Modal';

const MAX_UPLOAD = 30_000;

export default function MirrorRoom(props: { mirrorId: bigint; onClose: () => void }) {
  const [myMirrors] = useTable(tables.myMirrors);
  const [allCards] = useTable(tables.myCards);
  const [imports] = useTable(tables.myImports);
  const mirror = myMirrors.find((m) => m.id === props.mirrorId);
  const cards = allCards.filter((c) => c.mirrorId === props.mirrorId);
  const latestImport = [...imports]
    .filter((i) => i.mirrorId === props.mirrorId)
    .sort((a, b) => Number(b.id - a.id))[0];

  const byFacet = useMemo(() => {
    const groups = new Map<string, MirrorCard[]>();
    for (const c of [...cards].sort((a, b) => Number(a.id - b.id))) {
      groups.set(c.facet, [...(groups.get(c.facet) ?? []), c]);
    }
    return groups;
  }, [cards]);

  if (!mirror) return null;
  const shared = cards.filter((c) => c.enabled).length;

  return (
    <Modal title={`${mirror.name}'s Mirror Room`} onClose={props.onClose}>
      <p className="muted">
        This is how your mirror understands you. Nothing here is used until you check it, and you can rewrite anything
        that isn't you.
      </p>
      <div className="card-preview">
        <strong>From your personality check</strong>
        <p>{mirror.selfCard}</p>
      </div>

      <Importer mirrorId={mirror.id} busy={latestImport?.status === 'processing'} />
      {latestImport && (
        <p className={latestImport.status === 'failed' ? 'error' : 'muted'}>
          {latestImport.status === 'processing'
            ? `Reading ${latestImport.source}… this takes a few seconds.`
            : `${latestImport.source}: ${latestImport.message}`}
        </p>
      )}

      <h3>
        Cards <span className="muted">({shared} of {cards.length} shared with your mirror)</span>
      </h3>
      {cards.length === 0 && <p className="muted">Import something above, or write a card yourself.</p>}
      {FACETS.filter((f) => byFacet.has(f)).map((facet) => (
        <div key={facet} className="facet">
          <h4>{FACET_LABELS[facet]}</h4>
          {byFacet.get(facet)!.map((card) => (
            <CardRow key={String(card.id)} card={card} />
          ))}
        </div>
      ))}
      <AddCard mirrorId={mirror.id} />
    </Modal>
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
  const tooLong = text.length > MAX_UPLOAD;
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
      <h3>Bring in something you already have</h3>
      <p className="muted small">
        A WhatsApp export (Chat → More → Export chat, without media), or anything you wrote yourself. It's read here in
        your browser: only your own lines are kept, and emails, numbers and links are removed before anything is sent.
      </p>
      <div className="import-row">
        <input type="file" accept=".txt,text/plain" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        <label>
          These are chats with my{' '}
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
          rows={4}
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          placeholder="…or paste your own messages, a bio, an old post"
        />
      )}
      {tooLong && <small className="muted">Only the first {MAX_UPLOAD.toLocaleString()} characters will be used.</small>}
      {error && <p className="error">{error}</p>}
      <div className="actions">
        <button className="primary" disabled={busy || text.trim().length < 40} onClick={submit}>
          {busy ? 'Reading…' : 'Turn into cards'}
        </button>
      </div>
    </div>
  );
}

function CardRow({ card }: { card: MirrorCard }) {
  const setEnabled = useReducer(reducers.setCardEnabled);
  const rewrite = useReducer(reducers.rewriteCard);
  const undo = useReducer(reducers.undoCardEdit);
  const remove = useReducer(reducers.deleteCard);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(card.text);

  return (
    <div className={card.enabled ? 'mcard on' : 'mcard'}>
      <label className="mcard-main">
        <input type="checkbox" checked={card.enabled} onChange={(e) => setEnabled({ cardId: card.id, enabled: e.target.checked })} />
        {editing ? (
          <input value={draft} maxLength={200} onChange={(e) => setDraft(e.target.value)} autoFocus />
        ) : (
          <span>{card.text}</span>
        )}
      </label>
      <div className="mcard-meta">
        <span className="muted small">
          {card.source}
          {card.editedByOwner && ' · edited by you'}
        </span>
        {editing ? (
          <>
            <button
              className="ghost small"
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
          </>
        ) : (
          <>
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
              Delete
            </button>
          </>
        )}
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
        placeholder="Write a card yourself"
      />
      <button onClick={submit}>Add</button>
    </div>
  );
}
