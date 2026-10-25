import { useEffect, useRef, useState } from 'react';
import scene from './homeScene.json';
import { loadRoomArt, roomArtUrl } from './roomArt';

export type RoomObject = 'mirror' | 'diary' | 'cards' | 'desk';
const objects: { id: RoomObject; node: string; label: string; hint: string }[] = [
  { id: 'mirror', node: 'Mirror', label: 'Mirror', hint: 'See yourself through your mirror’s eyes and edit your contact details.' },
  { id: 'cards', node: 'Carddesk', label: 'Card collection', hint: 'Little pieces of you. Choose what comes along.' },
  { id: 'desk', node: 'Bookshelf', label: 'Your words', hint: 'Bring your own words. Let your mirror get to know you.' },
  { id: 'diary', node: 'Diary', label: 'Diary', hint: 'Who I met and what we talked about, with time and place.' },
];
// Camera around the authored composition, including the bookshelf's slight overhang.
const BOUNDS = { x: -395, y: -390, width: 830, height: 800 };
const PAN_KEYS: Record<string, [number, number]> = { ArrowLeft: [-80, 0], ArrowRight: [80, 0], ArrowUp: [0, -80], ArrowDown: [0, 80] };
function placement(node: typeof scene.nodes[number]) {
  const width = node.size[0] * node.scale[0], height = node.size[1] * node.scale[1];
  return { left: `${(node.position[0] - width / 2 - BOUNDS.x) / BOUNDS.width * 100}%`,
    top: `${(node.position[1] - height / 2 - BOUNDS.y) / BOUNDS.height * 100}%`,
    width: `${width / BOUNDS.width * 100}%`, height: `${height / BOUNDS.height * 100}%` };
}

export default function PixelRoom({ onOpen, welcome = false }: { onOpen: (object: RoomObject) => void; welcome?: boolean; name?: string; look?: number }) {
  const [hover, setHover] = useState<RoomObject | null>(null);
  const [art, setArt] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  useEffect(() => {
    const viewport = viewportRef.current!;
    let previous = { width: 0, height: 0, sceneWidth: 0, sceneHeight: 0 };
    const resize = () => {
      const x = previous.sceneWidth ? (viewport.scrollLeft + previous.width / 2) / previous.sceneWidth : 0.5;
      const y = previous.sceneHeight ? (viewport.scrollTop + previous.height / 2) / previous.sceneHeight : 0.5;
      const width = viewport.clientWidth, height = viewport.clientHeight;
      const sceneWidth = viewport.scrollWidth, sceneHeight = viewport.scrollHeight;
      viewport.scrollLeft = x * sceneWidth - width / 2;
      viewport.scrollTop = y * sceneHeight - height / 2;
      previous = { width, height, sceneWidth, sceneHeight };
    };
    const observer = new ResizeObserver(resize);
    observer.observe(viewport);
    resize();
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let active = true;
    setArt('loading');
    loadRoomArt().then(() => { if (active) setArt('ready'); }, () => { if (active) setArt('error'); });
    return () => { active = false; };
  }, [attempt]);
  const background = scene.nodes.find(node => node.name === 'Background')!;
  const interactive = scene.nodes.filter(node => node.name !== 'Background');
  return <div className="room-world room-world-authored" aria-busy={art === 'loading'}>
    {art !== 'ready' && <div className="room-art-loading" role="status">
      <p>{art === 'error' ? 'The room artwork could not load.' : 'Opening your Mirror Room…'}</p>
      {art === 'error' && <button onClick={() => setAttempt(n => n + 1)}>Retry</button>}
    </div>}
    <div ref={viewportRef} className="room-viewport" role="region" tabIndex={0}
      aria-label="Your room. Drag to explore, or use the arrow keys."
      onPointerDown={event => {
        suppressClick.current = false;
        if (event.button !== 0 || event.pointerType === 'touch') return;
        const viewport = event.currentTarget;
        drag.current = { x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop, moved: false };
        if (!(event.target as HTMLElement).closest('button')) viewport.focus({ preventScroll: true });
      }}
      onPointerMove={event => {
        const start = drag.current;
        if (!start || (!start.moved && Math.hypot(event.clientX - start.x, event.clientY - start.y) < 5)) return;
        start.moved = true;
        suppressClick.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.scrollLeft = start.left + start.x - event.clientX;
        event.currentTarget.scrollTop = start.top + start.y - event.clientY;
        event.preventDefault();
      }}
      onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
      onLostPointerCapture={() => { drag.current = null; }}
      onClickCapture={event => {
        if (!suppressClick.current) return;
        event.preventDefault(); event.stopPropagation(); suppressClick.current = false;
      }}
      onKeyDown={event => {
        if (event.target !== event.currentTarget) return;
        const step = PAN_KEYS[event.key];
        if (!step) return;
        event.preventDefault();
        event.currentTarget.scrollBy(step[0], step[1]);
      }}>
    <div className="room-scene room-scene-authored" style={{ visibility: art === 'ready' ? 'visible' : 'hidden' }} aria-label="Your pixel room. Choose an object to explore.">
      <img className="home-background" style={placement(background)} src={roomArtUrl(background.file)} alt="" draggable={false} />
      {interactive.map(node => {
        const object = objects.find(object => object.node === node.name)!;
        if (welcome && object.id !== 'mirror' && object.id !== 'desk') return <img key={object.id} className="welcome-furniture" style={placement(node)} src={roomArtUrl(node.file)} alt="" draggable={false} />;
        return <button key={object.id} className={`room-object home-object home-object-${object.id}`} style={placement(node)}
          aria-label={`Open ${object.id === 'desk' ? 'Writing desk' : object.label}`} onClick={() => onOpen(object.id)}
          onMouseEnter={() => setHover(object.id)} onMouseLeave={() => setHover(null)}
          onFocus={() => setHover(object.id)} onBlur={() => setHover(null)}>
          <img src={roomArtUrl(node.file)} alt="" draggable={false} /><span>{welcome ? object.id === 'desk' ? 'Your letters' : 'Your reflection' : object.label}</span>
        </button>;
      })}
    </div>
    </div>
    {!welcome && <div className="room-dialogue"><span className="room-dialogue-mark" aria-hidden="true">✦</span>
      <div><strong>{hover ? objects.find(object => object.id === hover)?.label : 'A little place to be yourself.'}</strong>
        <p>{hover ? objects.find(object => object.id === hover)?.hint : 'Drag to explore. Click furniture to take a closer look.'}</p></div>
      <span className="room-key-hint">Drag · Tab · Enter</span>
    </div>}
  </div>;
}
