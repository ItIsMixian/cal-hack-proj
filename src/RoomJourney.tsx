import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import scene from './homeScene.json';
import CharacterSprite from './CharacterSprite';
import { characterWalkFrame } from './characterAnimation';
import { loadRoomArt, roomArtUrl } from './roomArt';
import { ROOM_STATIONS, STATION_FACING, roomRoute, sampleRoomRoute, type RoomFacing, type RoomStation } from './roomJourneyMath';

export type JourneyPose = { x: number; y: number; facing: RoomFacing; moving: boolean; frame: number };
export function useRoomJourney() {
  const [pose, setPose] = useState<JourneyPose>({ ...ROOM_STATIONS.entrance, facing: 'down', moving: false, frame: 1 });
  const position = useRef(pose);
  const running = useRef<{ raf: number; resolve: (arrived: boolean) => void } | null>(null);
  useEffect(() => () => { if (running.current) { cancelAnimationFrame(running.current.raf); running.current.resolve(false); running.current = null; } }, []);
  const walkTo = (station: RoomStation) => new Promise<boolean>(resolve => {
    if (running.current) { cancelAnimationFrame(running.current.raf); running.current.resolve(false); }
    const route = roomRoute(position.current, station);
    let distance = 0, elapsed = 0, previous = performance.now();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tick = (now: number) => {
      const dt = Math.min(50, now - previous) / 1000;
      elapsed += dt; distance += dt * (reduced ? 700 : 145); previous = now;
      const point = sampleRoomRoute(route, distance);
      const next = { x: point.x, y: point.y, facing: point.done ? STATION_FACING[station] : point.facing,
        moving: !point.done, frame: characterWalkFrame(elapsed, !point.done, reduced) };
      position.current = next; setPose(next);
      if (point.done) { running.current = null; resolve(true); }
      else if (running.current) running.current.raf = requestAnimationFrame(tick);
    };
    running.current = { raf: requestAnimationFrame(tick), resolve };
  });
  return { pose, walkTo };
}

export default function RoomJourney({ pose, station, name, look, speech, paper, reflection, naming, deskItems, onStation, onLook, disabled, hasLetter, lookLocked = false }: {
  pose: JourneyPose; station: RoomStation; name: string; look: number; speech: string; paper?: ReactNode; reflection?: ReactNode; naming?: ReactNode; deskItems?: ReactNode;
  onStation: (station: RoomStation) => void; onLook: () => void; disabled: boolean; hasLetter: boolean; lookLocked?: boolean;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 720, height: 740 });
  const [art, setArt] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retry, setRetry] = useState(0);
  useEffect(() => { let alive = true; loadRoomArt().then(() => { if (alive) setArt('ready'); }, () => { if (alive) setArt('error'); }); return () => { alive = false; }; }, [retry]);
  useEffect(() => { const element = viewport.current!; const observer = new ResizeObserver(() => setSize({ width: element.clientWidth, height: element.clientHeight })); observer.observe(element); return () => observer.disconnect(); }, []);
  const scale = Math.max(size.width / 830, size.height / 800) * (reflection ? 1.12 : paper ? 1.04 : 1);
  const clamp = (value: number, half: number, max: number) => half * 2 >= max ? max / 2 : Math.max(half, Math.min(max - half, value));
  const focus = pose.moving ? { x: pose.x, y: pose.y - 100 }
    : station === 'desk' ? { x: 590, y: paper ? 440 : 485 } : station === 'mirror' ? { x: 340, y: 595 } : { x: pose.x, y: pose.y - 100 };
  const camera = { x: clamp(focus.x, size.width / scale / 2, 830), y: clamp(focus.y, size.height / scale / 2, 800) };
  const project = (x: number, y: number) => ({ x: (x - camera.x) * scale + size.width / 2, y: (y - camera.y) * scale + size.height / 2 });
  const actor = project(pose.x, pose.y);
  const onScreen = (x: number, y: number) => { const point = project(x, y); return point.x >= 12 && point.x <= size.width - 12 && point.y >= 55 && point.y <= size.height - 12; };
  const paperAt = project(580, 395), mirrorAt = project(297, 593);
  const facingX = { up: 0, right: 32, down: 64, left: 96 }[pose.facing];
  const bubbleWidth = Math.min(280, size.width - 32);
  const bubbleLeft = Math.max(16, Math.min(size.width - bubbleWidth - 16, actor.x - bubbleWidth / 2));
  return <div className="journey-viewport" ref={viewport} data-station={station} data-moving={pose.moving} aria-label="Your reflection's room">
    {art !== 'ready' && <div className="journey-loading" role="status">{art === 'error' ? <><p>The room could not open.</p><button onClick={() => { setArt('loading'); setRetry(n => n + 1); }}>Retry</button></> : 'Opening the room…'}</div>}
    <div className="journey-world" style={{ visibility: art === 'ready' ? 'visible' : 'hidden', transform: `translate(${size.width / 2 - camera.x * scale}px, ${size.height / 2 - camera.y * scale}px) scale(${scale})` }}>
      {scene.nodes.map(node => {
        const width = node.size[0] * node.scale[0], height = node.size[1] * node.scale[1];
        return <img key={node.name} className="journey-art" src={roomArtUrl(node.file)} alt="" draggable={false} style={{ left: node.position[0] + 395 - width / 2, top: node.position[1] + 390 - height / 2, width, height, zIndex: node.name === 'Background' ? 0 : 1 }} />;
      })}
      {deskItems && station === 'desk' && !pose.moving && <div className="journey-stationery" style={{ left: 520, top: 385 }}>{deskItems}</div>}
      <button className={`journey-hotspot desk ${station === 'desk' ? 'at-station' : ''}`} style={{ left: 500, top: 330, width: 270, height: 235 }} aria-label="Walk to the writing desk" disabled={disabled || pose.moving || !onScreen(635, 447)} onClick={() => onStation('desk')}><span>Your words · desk</span></button>
      <button className={`journey-hotspot mirror ${station === 'mirror' ? 'at-station' : ''}`} style={{ left: 214, top: 485, width: 165, height: 252 }} aria-label="Walk to the mirror to rehearse" disabled={disabled || pose.moving || !onScreen(296, 611)} onClick={() => onStation('mirror')}><span>Try a line · mirror</span></button>
      <button className="journey-hotspot door" style={{ left: 505, top: 723, width: 165, height: 65 }} aria-label="Walk to the door to enter town" disabled={disabled || pose.moving || !onScreen(587, 755)} onClick={() => onStation('door')}><span>Town ↗</span></button>
      <button className="journey-actor" aria-label={`${name || 'Your reflection'}${pose.moving ? ' is walking' : lookLocked ? '' : ' · change appearance'}`} disabled={disabled || pose.moving || lookLocked} onClick={onLook}
        style={{ left: pose.x - 32, top: pose.y - 124, zIndex: 3, '--sprite-x': `${-facingX}px`, '--sprite-y': `${-pose.frame * 32}px` } as CSSProperties}>
        <span className="journey-shadow" /><CharacterSprite look={look} facing={pose.facing} frame={pose.frame} className="journey-sprite" /><small>{name || 'Your reflection'}</small>{hasLetter && <span className="carried-letter" aria-label="Carrying your letter">✉</span>}<i style={{ backgroundColor: ['#6b7e5e','#a75d53','#7b6d9b','#507d93','#b49256','#779359','#a67b91','#735a48'][look % 8] }} />
      </button>
      {hasLetter && station === 'desk' && !pose.moving && <span className="desk-received-letter" aria-label="Your letter on the desk">✉</span>}
    </div>
    {naming && !pose.moving && <div className="journey-name-tag" style={{ left: Math.max(12, Math.min(size.width - 250, actor.x - 125)), top: Math.min(size.height - 105, actor.y + 24) }}>{naming}</div>}
    {!paper && !reflection && speech && <div className={`journey-speech ${station === 'desk' && !pose.moving ? 'below' : ''}`} style={{ width: bubbleWidth, left: bubbleLeft, top: station === 'desk' && !pose.moving ? actor.y + 38 : Math.max(64, actor.y - 190), '--tail': `${Math.max(22, Math.min(bubbleWidth - 22, actor.x - bubbleLeft))}px` } as CSSProperties} role="status">{speech}</div>}
    {paper && !pose.moving && <div className="journey-paper" style={{ left: Math.max(12, Math.min(size.width - Math.min(350, size.width - 24) - 12, paperAt.x - 170)), top: Math.max(62, Math.min(size.height - 440, paperAt.y - 170)), width: Math.min(350, size.width - 24) }}>{paper}</div>}
    {reflection && !pose.moving && <div className="journey-reflection" style={{ left: Math.max(12, Math.min(size.width - Math.min(230, size.width - 24) - 12, mirrorAt.x - 115)), top: Math.max(70, Math.min(size.height - 410, mirrorAt.y - 175)), width: Math.min(230, size.width - 24) }}>{reflection}</div>}
    {station !== 'entrance' && !pose.moving && <div className="journey-wayfinders">{station === 'desk' ? <button aria-label="Go to the mirror" disabled={disabled} onClick={() => onStation('mirror')}>mirror ↙</button> : station === 'mirror' ? <button aria-label="Return to the desk" disabled={disabled} onClick={() => onStation('desk')}>✉ ↗</button> : <button aria-label="Return to the desk" disabled={disabled} onClick={() => onStation('desk')}>desk ↖</button>}{station !== 'door' && <button aria-label="Go to the door" disabled={disabled} onClick={() => onStation('door')}>door ↘</button>}</div>}
  </div>;
}
