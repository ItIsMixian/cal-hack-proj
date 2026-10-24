import { useMemo, useState } from 'react';
import { useSpacetimeDB, useTable } from 'spacetimedb/react';
import { tables } from './module_bindings';
import { findLandmark } from '../spacetimedb/src/world';
import WorldCanvas from './WorldCanvas';
import CreateMirror from './CreateMirror';
import Encounters from './Encounters';

export default function App() {
  const { isActive } = useSpacetimeDB();
  const [mirrors] = useTable(tables.mirror);
  const [conversations] = useTable(tables.conversation);
  const [lines] = useTable(tables.line);
  const [myMirrors] = useTable(tables.myMirrors);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<bigint | null>(null);
  const [notice, setNotice] = useState('');

  const mine = useMemo(() => new Set(myMirrors.map((m) => m.id)), [myMirrors]);
  const byId = useMemo(() => new Map(mirrors.map((m) => [m.id, m])), [mirrors]);

  // Latest line of each active conversation, shown above whoever said it.
  const bubbles = useMemo(() => {
    const active = new Set(conversations.filter((c) => c.active).map((c) => c.id));
    const latest = new Map<bigint, { speaker: bigint; text: string; at: bigint }>();
    for (const l of lines) {
      if (!active.has(l.conversationId)) continue;
      const prev = latest.get(l.conversationId);
      if (!prev || l.at.microsSinceUnixEpoch > prev.at) {
        latest.set(l.conversationId, { speaker: l.speaker, text: l.text, at: l.at.microsSinceUnixEpoch });
      }
    }
    return new Map([...latest.values()].map((l) => [l.speaker, l.text]));
  }, [conversations, lines]);

  const focus = selected !== null ? byId.get(selected) : undefined;
  const focusConversation = focus
    ? [...conversations]
        .filter((c) => c.a === focus.id || c.b === focus.id)
        .sort((a, b) => Number(b.id - a.id))[0]
    : undefined;
  const focusLines = focusConversation
    ? lines
        .filter((l) => l.conversationId === focusConversation.id)
        .sort((a, b) => (a.at.microsSinceUnixEpoch < b.at.microsSinceUnixEpoch ? -1 : 1))
    : [];
  const myCard = focus ? myMirrors.find((m) => m.id === focus.id) : undefined;

  return (
    <div className="app">
      <header>
        <div>
          <h1>Mirrorville</h1>
          <p className="tagline">Your mirrors meet first. Then you do.</p>
        </div>
        <div className="header-actions">
          <span className={isActive ? 'status on' : 'status'}>{isActive ? 'Live' : 'Connecting…'}</span>
          <button className="primary" onClick={() => setCreating(true)} disabled={!isActive}>
            {myMirrors.length ? 'Add another mirror' : 'Make your mirror'}
          </button>
        </div>
      </header>

      {notice && (
        <div className="notice" onClick={() => setNotice('')}>
          {notice}
        </div>
      )}

      <Encounters />

      <main>
        <div className="map">
          <WorldCanvas mirrors={mirrors} bubbles={bubbles} mine={mine} selected={selected} onSelect={setSelected} />
          <p className="muted hint">
            {mirrors.length} mirrors in town · tap one to read its conversation
          </p>
        </div>

        <aside className="panel">
          {focus ? (
            <>
              <h2>{focus.name}</h2>
              {focus.demo && <span className="tag">demo mirror</span>}
              {mine.has(focus.id) && <span className="tag gold">your mirror</span>}
              <p>
                <b>Today:</b> {focus.intent}
              </p>
              <p className="muted">Hangs out around the {findLandmark(focus.landmark).label}.</p>
              {myCard && (
                <p className="muted">
                  <b>What it knows about you:</b> {myCard.selfCard}
                </p>
              )}
              <h3>{focusConversation?.active ? 'Talking now' : 'Last conversation'}</h3>
              {focusLines.length === 0 && <p className="muted">No conversations yet.</p>}
              <div className="transcript">
                {focusLines.map((l) => (
                  <p key={String(l.id)}>
                    <b>{byId.get(l.speaker)?.name ?? '?'}:</b> {l.text}
                  </p>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2>How it works</h2>
              <ol>
                <li>Make a mirror: a short personality check and what you want to do today.</li>
                <li>Your mirror wanders town and chats with other mirrors.</li>
                <li>When two mirrors find a real overlap, both humans get asked.</li>
                <li>Only if you both say yes does a chat open. Then go meet.</li>
              </ol>
            </>
          )}
        </aside>
      </main>

      {creating && (
        <CreateMirror
          onClose={() => setCreating(false)}
          onCreated={(name) => {
            setCreating(false);
            setNotice(`${name} is walking into Mirrorville. You'll see a card here when they find someone.`);
          }}
        />
      )}
    </div>
  );
}
