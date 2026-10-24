import { useEffect, useMemo, useState } from 'react';
import { useSpacetimeDB, useTable } from 'spacetimedb/react';
import { tables } from './module_bindings';
import { clockLabel, currentEvent, findLandmark, venueHour } from '../spacetimedb/src/world';
import WorldCanvas from './WorldCanvas';
import CreateMirror from './CreateMirror';
import Diary from './Diary';
import MirrorRoom from './MirrorRoom';

const SEEN_KEY = 'mirrorville-diary-seen';

function readSeen(key: string): bigint {
  try {
    return BigInt(localStorage.getItem(key) ?? '0');
  } catch {
    return 0n;
  }
}

function useVenueClock() {
  const [hour, setHour] = useState(() => venueHour(BigInt(Date.now()) * 1000n));
  useEffect(() => {
    const id = setInterval(() => setHour(venueHour(BigInt(Date.now()) * 1000n)), 30_000);
    return () => clearInterval(id);
  }, []);
  return hour;
}

export default function App() {
  const { isActive, identity } = useSpacetimeDB();
  const seenKey = `${SEEN_KEY}/${identity?.toHexString() ?? 'connecting'}`;
  const [mirrors] = useTable(tables.mirror);
  const [conversations] = useTable(tables.conversation);
  const [lines] = useTable(tables.line);
  const [myMirrors] = useTable(tables.myMirrors);
  const [diary] = useTable(tables.myDiary);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<bigint | null>(null);
  const [notice, setNotice] = useState('');
  const [roomFor, setRoomFor] = useState<bigint | null>(null);
  const [tab, setTab] = useState<'town' | 'diary'>('town');
  const [seen, setSeen] = useState(() => readSeen(seenKey));
  useEffect(() => setSeen(readSeen(seenKey)), [seenKey]);
  const hour = useVenueClock();
  const event = currentEvent(hour);

  const mine = useMemo(() => new Set(myMirrors.map((m) => m.id)), [myMirrors]);
  const byId = useMemo(() => new Map(mirrors.map((m) => [m.id, m])), [mirrors]);
  const newestEntry = diary.reduce((max, p) => p.createdAt.microsSinceUnixEpoch > max ? p.createdAt.microsSinceUnixEpoch : max, 0n);
  const hasNew = newestEntry > seen;

  // A quiet dot, not a notification: mark diary as seen once the tab is open.
  useEffect(() => {
    if (tab !== 'diary' || newestEntry <= seen) return;
    setSeen(newestEntry);
    try {
      localStorage.setItem(seenKey, String(newestEntry));
    } catch {
      // Private mode: the dot comes back next visit, which is fine.
    }
  }, [tab, newestEntry, seen, seenKey]);

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
    ? [...conversations].filter((c) => c.a === focus.id || c.b === focus.id).sort((a, b) => Number(b.id - a.id))[0]
    : undefined;
  const focusLines = focusConversation
    ? lines
        .filter((l) => l.conversationId === focusConversation.id)
        .sort((a, b) => (a.at.microsSinceUnixEpoch < b.at.microsSinceUnixEpoch ? -1 : 1))
    : [];
  const myCard = focus ? myMirrors.find((m) => m.id === focus.id) : undefined;

  if (roomFor !== null) {
    return (
      <div className="app">
        <MirrorRoom mirrorId={roomFor} onBack={() => setRoomFor(null)} />
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <div>
          <h1>Mirrorville</h1>
          <p className="tagline">Your mirrors meet first. Then you do.</p>
        </div>
        <div className="header-actions">
          <span className={isActive ? 'status on' : 'status'}>{isActive ? 'Live' : 'Connecting…'}</span>
          {myMirrors.length > 0 && (
            <button onClick={() => setRoomFor(myMirrors[0].id)} disabled={!isActive}>
              Mirror Room
            </button>
          )}
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

      <main>
        <div className="map">
          <WorldCanvas mirrors={mirrors} bubbles={bubbles} mine={mine} selected={selected} onSelect={setSelected} />
          <p className="muted hint">
            {clockLabel(hour)} in town{event ? ` · ${event.label} at the ${findLandmark(event.landmark).label}` : ''} ·{' '}
            {mirrors.length} mirrors · tap one to listen in
          </p>
        </div>

        <aside className="panel">
          <div className="tabs">
            <button className={tab === 'town' ? 'tab on' : 'tab'} onClick={() => setTab('town')}>
              Town
            </button>
            <button className={tab === 'diary' ? 'tab on' : 'tab'} onClick={() => setTab('diary')}>
              Diary{hasNew && <span className="dot" aria-label="new" />}
            </button>
          </div>

          {tab === 'diary' ? (
            <Diary />
          ) : focus ? (
            <>
              <h2>{focus.name}</h2>
              {focus.demo && <span className="tag">demo mirror</span>}
              {mine.has(focus.id) && <span className="tag gold">your mirror</span>}
              <p>
                <b>Today:</b> {focus.intent}
              </p>
              <p className="muted">
                {focus.conversationId !== 0n ? 'Talking' : focus.activity} at the {findLandmark(focus.place).label}
              </p>
              {myCard && <button onClick={() => setRoomFor(myCard.id)}>Open Mirror Room</button>}
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
                <li>It goes about its day in town: the gym in the morning, the food court at lunch, the workshop at night.</li>
                <li>It gets to know the people it keeps running into.</li>
                <li>Read its diary. Show interest in someone whenever you like; when you both say yes, your contact details appear.</li>
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
            setNotice(`${name} is walking into Mirrorville. Come back later for its diary.`);
          }}
        />
      )}
    </div>
  );
}
