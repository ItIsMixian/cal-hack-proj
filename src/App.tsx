import { useEffect, useMemo, useState } from 'react';
import { useSpacetimeDB, useTable } from 'spacetimedb/react';
import { tables } from './module_bindings';
import { clockLabel, currentEvent, findLandmark, townHour } from '../spacetimedb/src/world';
import WorldCanvas from './WorldCanvas';
import CreateMirror from './CreateMirror';
import Diary from './Diary';
import MirrorRoom from './MirrorRoom';
import RoomDialog from './RoomDialog';
import CharacterAvatar from './CharacterAvatar';
import type { CameraMode } from './TownCamera';
import './pixel-room.css';
import './town-game.css';

const SEEN_KEY = 'mirrorville-diary-seen';

function readSeen(key: string): bigint {
  try {
    return BigInt(localStorage.getItem(key) ?? '0');
  } catch {
    return 0n;
  }
}

function useTownClock() {
  const [hour, setHour] = useState(() => townHour(BigInt(Date.now()) * 1000n));
  useEffect(() => {
    const id = setInterval(() => setHour(townHour(BigInt(Date.now()) * 1000n)), 1000);
    return () => clearInterval(id);
  }, []);
  return hour;
}

export default function App({ sessionLabel, onExit, accountMode = false }: {
  sessionLabel: string; onExit: () => void; accountMode?: boolean;
}) {
  const { isActive, identity } = useSpacetimeDB();
  const seenKey = `${SEEN_KEY}/${identity?.toHexString() ?? 'connecting'}`;
  const [allMirrors] = useTable(tables.mirror);
  const mirrors = useMemo(() => allMirrors.filter(m => m.active !== false), [allMirrors]);
  const [conversations] = useTable(tables.conversation);
  const [lines] = useTable(tables.line);
  const [myMirrors] = useTable(tables.myMirrors);
  const [diary] = useTable(tables.myDiary);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<bigint | null>(null);
  const [notice, setNotice] = useState('');
  const [roomFor, setRoomFor] = useState<bigint | null>(null);
  const [gamePanel, setGamePanel] = useState<'diary' | 'residents' | 'guide' | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>('general');
  const [followedId, setFollowedId] = useState<bigint | null>(null);
  const [seen, setSeen] = useState(() => readSeen(seenKey));
  useEffect(() => setSeen(readSeen(seenKey)), [seenKey]);
  const hour = useTownClock();
  const event = currentEvent(hour);

  const mine = useMemo(() => new Set(myMirrors.map((m) => m.id)), [myMirrors]);
  const followed = myMirrors.find(m => m.id === followedId) ?? [...myMirrors].sort((a, b) => a.id < b.id ? -1 : 1)[0];
  const followedMirror = followed ? mirrors.find(m => m.id === followed.id) : undefined;
  const byId = useMemo(() => new Map(mirrors.map((m) => [m.id, m])), [mirrors]);
  const newestEntry = diary.reduce((max, p) => p.createdAt.microsSinceUnixEpoch > max ? p.createdAt.microsSinceUnixEpoch : max, 0n);
  const hasNew = newestEntry > seen;

  // A quiet dot, not a notification: mark diary as seen once the tab is open.
  useEffect(() => {
    if (gamePanel !== 'diary' || newestEntry <= seen) return;
    setSeen(newestEntry);
    try {
      localStorage.setItem(seenKey, String(newestEntry));
    } catch {
      // Private mode: the dot comes back next visit, which is fine.
    }
  }, [gamePanel, newestEntry, seen, seenKey]);

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
        <MirrorRoom mirrorId={roomFor} onBack={() => setRoomFor(null)} onDiaryOpen={() => {
          setSeen(newestEntry);
          try { localStorage.setItem(seenKey, String(newestEntry)); } catch { /* Private mode. */ }
        }} />
      </div>
    );
  }

  return (
    <div className="app town-game">
      <header className="town-hud">
        <div className="town-title"><p>MIRRORS MEET HERE</p><h1>Mirrorville</h1></div>

      </header>
      <div className="town-clock"><strong>{clockLabel(hour)}</strong><span>{event ? event.label : 'A little time in town'}</span></div>
      {notice && <button className="town-notice" onClick={() => setNotice('')}>{notice} <span>✕</span></button>}
      <main className="town-stage">
        <div className="town-map-shell">
          <div className="town-map-frame"><WorldCanvas mirrors={mirrors} bubbles={bubbles} mine={mine} selected={selected} onSelect={setSelected} cameraMode={cameraMode} followed={followed?.id ?? null} /></div>
        </div>
      </main>
      <aside className="town-camera-hud" aria-label="Town camera">
        <div className="town-camera-switch" role="group" aria-label="Camera view">
          <button aria-pressed={cameraMode === 'general' || !followed} onClick={() => setCameraMode('general')}>General</button>
          <button aria-pressed={cameraMode === 'follow' && !!followed} disabled={!followed} onClick={() => setCameraMode('follow')}>Follow</button>
        </div>
        {cameraMode === 'follow' && followedMirror ? <>
          {myMirrors.length > 1 ? <select aria-label="Follow your mirror" value={String(followedMirror.id)} onChange={e => setFollowedId(BigInt(e.target.value))}>
            {myMirrors.map(m => <option key={String(m.id)} value={String(m.id)}>{m.name}</option>)}
          </select> : <strong>Following {followedMirror.name}</strong>}
          <span>{followedMirror.conversationId !== 0n ? 'Talking' : followedMirror.activity} · {findLandmark(followedMirror.place).label}</span>
        </> : <><strong>{mirrors.length} mirrors in town</strong><span>{followed ? 'Tap a mirror to listen in' : 'Make a mirror to follow its day'}</span></>}
      </aside>
      <nav className="town-dock" aria-label="Town actions">
        <button onClick={() => setGamePanel('diary')}><span className="dock-icon" aria-hidden="true">▤</span>Diary{hasNew && <span className="dot" aria-label="new" />}</button>
        <button onClick={() => setGamePanel('residents')}><span className="dock-icon" aria-hidden="true">♧</span>Residents</button>
        {myMirrors.length > 0 && <button onClick={() => { setSelected(null); setRoomFor(myMirrors[0].id); }} disabled={!isActive}><span className="dock-icon" aria-hidden="true">⌂</span>Mirror Room</button>}
        {myMirrors.length === 0 && <button onClick={() => setCreating(true)} disabled={!isActive}><span className="dock-icon" aria-hidden="true">＋</span>Make your mirror</button>}
        <button onClick={() => setGamePanel('guide')} aria-label="Town guide"><span className="dock-icon" aria-hidden="true">?</span><span>Guide</span></button>
        <details className="town-account-menu" onKeyDown={e => { if (e.key === 'Escape') e.currentTarget.open = false; }}>
          <summary aria-label="Menu" title="Menu"><span className="dock-icon" aria-hidden="true">☰</span><span>Menu</span></summary>
          <div className="town-account"><span className={isActive ? 'status on' : 'status'}>{isActive ? 'Live' : 'Connecting…'}</span>
            <span className="session-label" title={sessionLabel}>{sessionLabel}</span>
            <button onClick={onExit}>{accountMode ? 'Sign out' : 'Leave town'}</button>
          </div>
        </details>
      </nav>
      {gamePanel && <RoomDialog title={gamePanel === 'diary' ? 'Your diary' : gamePanel === 'residents' ? 'Residents' : 'Welcome to Mirrorville'} onClose={() => setGamePanel(null)}>
        {gamePanel === 'diary' ? <Diary /> : gamePanel === 'residents' ? <div className="town-roster">
          {mirrors.map(mirror => <button key={String(mirror.id)} onClick={() => { setGamePanel(null); setSelected(mirror.id); }}>
            <CharacterAvatar look={mirror.look} name={mirror.name} /><span><strong>{mirror.name}</strong><small>{mine.has(mirror.id) ? 'Your mirror · ' : ''}{findLandmark(mirror.place).label}</small></span><span aria-hidden="true">→</span>
          </button>)}
        </div> : <div className="town-guide"><p>Your mirrors meet first. Then you do.</p><ol>
          <li>Make a mirror with a name and a short personality check. Today's intent is optional.</li>
          <li>Watch it wander, stop for a coffee, and get to know people in town.</li>
          <li>Open your diary whenever you like. Show interest in someone; when you both say yes, contact details appear.</li>
          <li>Visit your Mirror Room to add your own words and choose what your mirror shares.</li>
        </ol><p className="muted">Character art: Cup Nooble · Sprout Lands</p></div>}
      </RoomDialog>}
      {focus && <RoomDialog title={focus.name} onClose={() => setSelected(null)}>
        <div className="room-portrait"><CharacterAvatar look={focus.look} name={focus.name} /><div><h3>{focus.name}</h3><p>{mine.has(focus.id) ? 'Your mirror' : focus.demo ? 'Demo mirror' : 'A mirror in town'}</p></div></div>
        {focus.intent && <p><b>Today:</b> {focus.intent}</p>}
        <p className="muted">{focus.conversationId !== 0n ? 'Talking' : focus.activity} at the {findLandmark(focus.place).label}</p>
        {myCard && <button onClick={() => { setSelected(null); setRoomFor(myCard.id); }}>Open Mirror Room</button>}
        <h3>{focusConversation?.active ? 'Talking now' : 'Last conversation'}</h3>
        {focusLines.length === 0 && <p className="muted">No conversations yet. A new day is just beginning.</p>}
        <div className="town-transcript">{focusLines.map(line => <p key={String(line.id)}><b>{byId.get(line.speaker)?.name ?? '?'}:</b> {line.text}</p>)}</div>
      </RoomDialog>}
      {creating && <CreateMirror onClose={() => setCreating(false)} onCreated={name => {
        setCreating(false); setNotice(`${name} is walking into Mirrorville. Open your diary later to see how the day went.`);
      }} />}
    </div>
  );
}
