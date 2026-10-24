import { useState } from 'react';
import { useReducer, useTable } from 'spacetimedb/react';
import { reducers, tables } from './module_bindings';
import type { MyPostcard } from './module_bindings/types';
import { findLandmark } from '../spacetimedb/src/world';

const KIND_LABELS: Record<string, string> = {
  same_intent: 'You want to do the same thing',
  need_and_skill: 'One of you can help the other',
  shared_interest: 'Something you both care about',
};

// Postcards are read whenever you feel like it. Nothing here expires or asks
// for an answer; a wave is optional and stays private until both people wave.
export default function Postcards() {
  const [postcards] = useTable(tables.myPostcards);
  const [open, setOpen] = useState<bigint | null>(null);
  const sorted = [...postcards].sort((a, b) => Number(b.id - a.id));
  const current = sorted.find((p) => p.id === open);

  if (current) return <PostcardDetail postcard={current} onBack={() => setOpen(null)} />;

  if (sorted.length === 0) {
    return (
      <div className="postcards-empty">
        <p>No postcards yet.</p>
        <p className="muted small">
          Your mirror writes one when it keeps running into someone you'd genuinely get along with. Most days that's
          rare, and that's the point.
        </p>
      </div>
    );
  }

  return (
    <div className="postcards">
      {sorted.map((p) => (
        <button key={String(p.id)} className="postcard-row" onClick={() => setOpen(p.id)}>
          <span className="postcard-from">
            From {p.myMirror} · about {p.otherMirror}
            {p.connected && <span className="tag gold">you both waved</span>}
          </span>
          <span className="postcard-preview">{p.story || p.why}</span>
        </button>
      ))}
    </div>
  );
}

function PostcardDetail({ postcard: p, onBack }: { postcard: MyPostcard; onBack: () => void }) {
  const wave = useReducer(reducers.wave);
  return (
    <div className="postcard">
      <button className="ghost small back" onClick={onBack}>
        ← All postcards
      </button>
      <div className="postcard-paper">
        <p className="postcard-meta">
          {findLandmark(p.place).label} · from {p.myMirror}
        </p>
        <p className="postcard-story">{p.story || p.why}</p>
        <div className="postcard-why">
          <strong>{KIND_LABELS[p.kind] ?? 'Why them'}</strong>
          <p>{p.why}</p>
          {p.myEvidence && <p className="muted small">From you: “{p.myEvidence}”</p>}
          {p.otherIntent && (
            <p className="muted small">
              {p.otherMirror} today: “{p.otherIntent}”
            </p>
          )}
        </div>
      </div>

      {p.connected ? (
        <HumanChat postcard={p} />
      ) : p.iWaved ? (
        <p className="muted small">You waved. If {p.otherMirror}'s human waves too, a chat opens here.</p>
      ) : (
        <div className="wave-row">
          <button onClick={() => wave({ encounterId: p.id })}>👋 Wave</button>
          <span className="muted small">Only if you both wave does anything happen. No one sees a wave on its own.</span>
        </div>
      )}
      {p.otherDemo && <p className="muted small">{p.otherMirror} is a demo mirror and always waves back.</p>}
    </div>
  );
}

function HumanChat({ postcard }: { postcard: MyPostcard }) {
  const [all] = useTable(tables.myHumanMessages);
  const send = useReducer(reducers.sendHumanMessage);
  const [text, setText] = useState('');
  const messages = all
    .filter((m) => m.encounterId === postcard.id)
    .sort((a, b) => (a.at.microsSinceUnixEpoch < b.at.microsSinceUnixEpoch ? -1 : 1));

  const submit = async () => {
    if (!text.trim()) return;
    await send({ encounterId: postcard.id, text });
    setText('');
  };

  return (
    <div className="human-chat">
      <p className="muted small">You both waved. This is just the two of you; your mirrors stay out of it.</p>
      <div className="chat">
        {messages.length === 0 && <p className="muted small">Say hi whenever you like.</p>}
        {messages.map((m) => (
          <div key={String(m.id)} className={m.mine ? 'msg mine' : 'msg'}>
            {m.text}
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          value={text}
          maxLength={500}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={`Write to ${postcard.otherMirror}'s human yourself`}
        />
        <button className="primary" onClick={submit}>
          Send
        </button>
      </div>
    </div>
  );
}
