import { useState } from 'react';
import { useReducer, useTable } from 'spacetimedb/react';
import { reducers, tables } from './module_bindings';
import type { MyEncounter } from './module_bindings/types';
import Modal from './Modal';

export default function Encounters() {
  const [encounters] = useTable(tables.myEncounters);
  const respond = useReducer(reducers.respondToEncounter);
  const [chatWith, setChatWith] = useState<bigint | null>(null);
  const [error, setError] = useState('');

  if (encounters.length === 0) return null;
  const sorted = [...encounters].sort((a, b) => Number(b.id - a.id));
  const open = sorted.find((e) => e.id === chatWith);

  const answer = async (encounterId: bigint, accept: boolean) => {
    setError('');
    try {
      await respond({ encounterId, accept });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <section className="encounters">
      {sorted.map((e) => (
        <div key={String(e.id)} className="encounter">
          <div className="encounter-title">
            Your mirror <b>{e.myMirror}</b> met <b>{e.otherMirror}</b>
            {e.otherDemo && <span className="tag">demo mirror</span>}
          </div>
          {e.reason && <p>{e.reason}</p>}
          {e.meetup && <p className="muted">Idea: {e.meetup}</p>}
          <div className="actions left">
            {e.connected ? (
              <button className="primary" onClick={() => setChatWith(e.id)}>
                Chat with {e.otherMirror}'s human
              </button>
            ) : e.myResponse === 'pending' ? (
              <>
                <button className="primary" onClick={() => answer(e.id, true)}>
                  I'd like to meet
                </button>
                <button className="ghost" onClick={() => answer(e.id, false)}>
                  Not now
                </button>
                <small className="muted">They only see your answer if you both say yes.</small>
              </>
            ) : (
              <small className="muted">Waiting for {e.otherMirror}'s human to say yes…</small>
            )}
          </div>
        </div>
      ))}
      {error && <p className="error">{error}</p>}
      {open && <HumanChat encounter={open} onClose={() => setChatWith(null)} />}
    </section>
  );
}

function HumanChat({ encounter, onClose }: { encounter: MyEncounter; onClose: () => void }) {
  const [all] = useTable(tables.myHumanMessages);
  const send = useReducer(reducers.sendHumanMessage);
  const [text, setText] = useState('');
  const messages = all
    .filter((m) => m.encounterId === encounter.id)
    .sort((a, b) => (a.at.microsSinceUnixEpoch < b.at.microsSinceUnixEpoch ? -1 : 1));

  const submit = async () => {
    if (!text.trim()) return;
    await send({ encounterId: encounter.id, text });
    setText('');
  };

  return (
    <Modal title={`You and ${encounter.otherMirror}'s human`} onClose={onClose}>
      <p className="muted quote">Your mirrors found this in common: {encounter.reason}</p>
      {encounter.otherDemo && <small className="muted">{encounter.otherMirror} is a demo mirror, so no one will reply here.</small>}
      <div className="chat">
        {messages.length === 0 && <p className="muted">Say hi. This is just the two of you.</p>}
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
          placeholder="Write to them yourself"
        />
        <button className="primary" onClick={submit}>
          Send
        </button>
      </div>
    </Modal>
  );
}
