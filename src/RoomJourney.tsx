import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import scene from './homeScene.json';
import CharacterSprite from './CharacterSprite';
import { characterWalkFrame } from './characterAnimation';
import { loadRoomArt, roomArtUrl } from './roomArt';
import { ROOM_STATIONS, STATION_FACING, roomRoute, sampleRoomRoute, isRoomFloor, type RoomPoint, type RoomFacing, type RoomStation } from './roomJourneyMath';

export type JourneyPose = { x: number; y: number; facing: RoomFacing; moving: boolean; frame: number };
export function useRoomJourney() {
  const [pose, setPose] = useState<JourneyPose>({ ...ROOM_STATIONS.entrance, facing: 'down', moving: false, frame: 1 });
  const position = useRef(pose);
  const running = useRef<{ raf: number; resolve: (arrived: boolean) => void } | null>(null);
  useEffect(() => () => { if (running.current) { cancelAnimationFrame(running.current.raf); running.current.resolve(false); running.current = null; } }, []);
  const walkTo = (station: RoomStation | RoomPoint) => new Promise<boolean>(resolve => {
    if (running.current) { cancelAnimationFrame(running.current.raf); running.current.resolve(false); }
    const route = roomRoute(position.current, station);
    let distance = 0, elapsed = 0, previous = performance.now();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tick = (now: number) => {
      const dt = Math.min(50, now - previous) / 1000;
      elapsed += dt; distance += dt * (reduced ? 700 : 145); previous = now;
      const point = sampleRoomRoute(route, distance);
      const next = { x: point.x, y: point.y, facing: point.done ? (typeof station === 'string' ? STATION_FACING[station] : position.current.facing) : point.facing,
        moving: !point.done, frame: characterWalkFrame(elapsed, !point.done, reduced) };
      position.current = next; setPose(next);
      if (point.done) { running.current = null; resolve(true); }
      else if (running.current) running.current.raf = requestAnimationFrame(tick);
    };
    running.current = { raf: requestAnimationFrame(tick), resolve };
  });
  const cancelWalk = () => {
    if (!running.current) return;
    cancelAnimationFrame(running.current.raf);
    running.current.resolve(false);
    running.current = null;
    position.current = { ...position.current, moving: false };
    setPose(position.current);
  };
  return { pose, walkTo, cancelWalk };
}

export default function RoomJourney({ pose, station, name, look, speech, paper, reflection, naming, deskItems, onStation, onLook, disabled, hasLetter, lookLocked = false, overview = false, expandedActivity = false, speechActivity = false, tutorialControls, activity, allowedStations, onOverview, onFloor }: {
  pose: JourneyPose; station: RoomStation; name: string; look: number; speech: string; paper?: ReactNode; reflection?: ReactNode; naming?: ReactNode; deskItems?: ReactNode;
  onStation: (station: RoomStation) => void; onLook: () => void; disabled: boolean; hasLetter: boolean; lookLocked?: boolean;
  tutorialControls?: ReactNode; overview?: boolean; expandedActivity?: boolean; speechActivity?: boolean; activity?: ReactNode; allowedStations?: readonly RoomStation[]; onOverview?: () => void; onFloor?: (point: RoomPoint) => void;
}) {
  const viewport = useRef<HTMLDivElement>(null), panel = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 720, height: 740 });
  const [art, setArt] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retry, setRetry] = useState(0);
  useEffect(() => { let alive = true; loadRoomArt().then(() => { if (alive) setArt('ready'); }, () => { if (alive) setArt('error'); }); return () => { alive = false; }; }, [retry]);
  useEffect(() => { const element = viewport.current!; const observer = new ResizeObserver(() => setSize({ width: element.clientWidth, height: element.clientHeight })); observer.observe(element); return () => observer.disconnect(); }, []);
  const content = activity ?? paper ?? reflection;
  useEffect(() => {
    if (!pose.moving && content && panel.current) {
      panel.current.focus({ preventScroll: true });
      panel.current.scrollTop = 0;
    }
  }, [station, pose.moving, !!content]);
  const fit = Math.min(size.width / 830, size.height / 800, 1) * .94;
  const scale = overview || station === 'entrance' ? fit : Math.min(1.35, Math.max(.8, fit * 1.5));
  const centers: Record<RoomStation, { x: number; y: number }> = {
    entrance: { x: 415, y: 400 }, desk: { x: 570, y: 270 }, cards: { x: 310, y: 430 },
    mirror: { x: 295, y: 650 }, diary: { x: 600, y: 380 }, door: { x: 415, y: 680 },
  };
  const focus = overview ? centers.entrance : pose.moving ? { x: pose.x, y: pose.y - 100 } : centers[station];
  const clamp = (value: number, half: number, max: number) => half * 2 >= max ? max / 2 : Math.max(half, Math.min(max - half, value));
  const camera = { x: clamp(focus.x, size.width / scale / 2, 830), y: speechActivity ? Math.max(clamp(focus.y, size.height / scale / 2, 800), pose.y - size.height * .1 / scale) : clamp(focus.y, size.height / scale / 2, 800) };
  const project = (x: number, y: number) => ({ x: (x - camera.x) * scale + size.width / 2, y: (y - camera.y) * scale + size.height / 2 });
  const actor = project(pose.x, pose.y);
  const stations = [
    { id: 'desk' as const, node: 'Bookshelf', label: 'Your words', aria: 'Walk to the writing desk' },
    { id: 'cards' as const, node: 'Carddesk', label: 'Card collection', aria: 'Walk to the card collection' },
    { id: 'mirror' as const, node: 'Mirror', label: 'Mirror', aria: 'Walk to the mirror' },
    { id: 'diary' as const, node: 'Diary', label: 'Diary', aria: 'Walk to the diary' },
  ];
  const canVisit = (id: RoomStation) => !disabled && (!pose.moving || !!onFloor) && (!allowedStations || allowedStations.includes(id));
  const bubbleWidth = Math.min(280, size.width - 32);
  const speechLeft = Math.max(12, Math.min(size.width - Math.min(350, size.width - 24) - 12, actor.x - Math.min(350, size.width - 24) / 2));
  const panelX: Record<RoomStation, number> = { entrance: 415, desk: 700, cards: 200, mirror: 220, diary: 300, door: 340 };
  const panelTop = size.width < 500 ? 72 : Math.max(64, Math.min(size.height - 420, project(centers[station].x, centers[station].y).y - 180));
  const panelHeight = size.width < 500 ? Math.max(140, Math.min(330, size.height - 240)) : Math.max(100, size.height - panelTop - 24);
  return <div className="journey-viewport" ref={viewport} data-station={station} data-moving={pose.moving} data-overview={overview || station === 'entrance'} aria-label="Your reflection's room"
    onClick={event => {
      if (!onFloor || disabled || (event.target as HTMLElement).closest('button, input, a, .journey-activity, .journey-stationery')) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const point = { x: (event.clientX - rect.left - size.width / 2) / scale + camera.x, y: (event.clientY - rect.top - size.height / 2) / scale + camera.y };
      if (isRoomFloor(point)) onFloor(point);
    }}
    onKeyDown={event => { if (event.key === 'Escape' && onOverview) { event.stopPropagation(); onOverview(); } }}>
    {art !== 'ready' && <div className="journey-loading" role="status">{art === 'error' ? <><p>The room could not open.</p><button onClick={() => { setArt('loading'); setRetry(n => n + 1); }}>Retry</button></> : 'Opening the room…'}</div>}
    <div className="journey-world" style={{ visibility: art === 'ready' ? 'visible' : 'hidden', transform: `translate(${size.width / 2 - camera.x * scale}px, ${size.height / 2 - camera.y * scale}px) scale(${scale})` }}>
      {scene.nodes.map(node => {
        const width = node.size[0] * node.scale[0], height = node.size[1] * node.scale[1];
        return <img key={node.name} className="journey-art" src={roomArtUrl(node.file)} alt="" draggable={false} style={{ left: node.position[0] + 395 - width / 2, top: node.position[1] + 390 - height / 2, width, height, zIndex: node.name === 'Background' ? 0 : 1 }} />;
      })}
      {stations.map(item => {
        const node = scene.nodes.find(node => node.name === item.node)!;
        const width = node.size[0] * node.scale[0], fullHeight = node.size[1] * node.scale[1];
        // The diary sprite has transparent padding above the chair. Do not let it intercept the bookshelf label.
        const insetTop = item.id === 'diary' ? 80 : 0;
        const height = fullHeight - insetTop;
        return <button key={item.id} data-room-object={item.id} className={`journey-hotspot ${item.id} ${station === item.id && !overview ? 'at-station' : ''}`}
          style={{ left: node.position[0] + 395 - width / 2, top: node.position[1] + 390 - fullHeight / 2 + insetTop, width, height }}
          aria-label={item.aria} disabled={!canVisit(item.id)} onClick={() => onStation(item.id)}><span>{item.label}</span></button>;
      })}
      <button className="journey-hotspot door" style={{ left: 360, top: 735, width: 110, height: 45 }} aria-label="Walk to the door to enter town" disabled={!canVisit('door')} onClick={() => onStation('door')}><span>Town ↓</span></button>
      <button className="journey-actor" aria-label={`${name || 'Your reflection'}${pose.moving ? ' is walking' : ''}`} disabled={disabled || pose.moving || lookLocked} onClick={onLook}
        style={{ left: pose.x - 32, top: pose.y - 128, zIndex: 3 } as CSSProperties}>
        <span className="journey-shadow" /><CharacterSprite look={look} facing={pose.facing} frame={pose.frame} className="journey-sprite" /><small>{name || 'Your reflection'}</small>{hasLetter && <span className="carried-letter" aria-label="Carrying your letter">✉</span>}
      </button>
    </div>
    {naming && !pose.moving && <div className="journey-name-tag" style={{ left: Math.max(12, Math.min(size.width - 250, actor.x - 125)), top: Math.min(size.height - 110, actor.y + 12) }}>{naming}</div>}
    {!content && !naming && speech && <div className="journey-speech" style={{ width: bubbleWidth, left: Math.max(16, Math.min(size.width - bubbleWidth - 16, actor.x - bubbleWidth / 2)), top: Math.max(64, Math.min(size.height - 140, actor.y - 185)) }} role="status">{speech}</div>}
    {deskItems && !pose.moving && <div className="journey-stationery" style={{ left: Math.max(12, Math.min(size.width - 304, actor.x - 152)), top: tutorialControls ? actor.y + 26 : Math.max(72, actor.y - 250), flexWrap: 'wrap', width: Math.min(304, size.width - 24), gap: 12 }}>{deskItems}</div>}
    {content && !pose.moving && <div ref={panel} tabIndex={-1} className={`journey-activity room-content ${station === 'mirror' ? 'at-mirror' : ''} ${expandedActivity ? station === 'diary' ? 'journey-reading' : 'journey-sheet' : ''} ${speechActivity ? 'journey-dialogue' : ''}`} aria-label={`${station} interaction`} key={station}
      style={speechActivity ? { ...({ '--speech-tail': `${actor.x - speechLeft - 8}px` } as CSSProperties), left: speechLeft, bottom: size.height - actor.y + 80 * scale + 14, maxHeight: Math.max(110, actor.y - 80 * scale - 64), width: Math.min(350, size.width - 24), overflow: 'visible' } : expandedActivity ? { left: Math.max(12, (size.width - 1000) / 2), top: 60, width: Math.min(1000, size.width - 24), height: size.height - (tutorialControls ? 160 : 76), maxHeight: size.height - (tutorialControls ? 160 : 76) } : { left: Math.max(12, Math.min(size.width - Math.min(350, size.width - 24) - 12, project(panelX[station], centers[station].y).x - 175)), top: panelTop, maxHeight: panelHeight, width: Math.min(350, size.width - 24) }}>
      {speechActivity ? <div className="journey-dialogue-body">{content}</div> : content}
    </div>}
    {tutorialControls}
    {!overview && onOverview && <button className="journey-overview" onClick={onOverview}>← Back to the room</button>}
  </div>;
}
