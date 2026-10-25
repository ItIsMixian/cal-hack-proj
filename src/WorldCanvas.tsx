import { useEffect, useRef, useState } from 'react';
import { WORLD_W, WORLD_H, LOOK_COLORS } from '../spacetimedb/src/world';
import { loadAuthoredTown, projectTownPosition } from './AuthoredTown';
import { findTownPath, nearestWalkPoint, walkTownPath } from './TownNavigation';
import type { MotionPoint } from './TownMotion';
import { BUILDING_PINS, enteredBuilding } from './TownBuildings';
import { cameraTarget, clampGeneralCamera, screenToTown, zoomGeneralCamera, type CameraMode, type CameraFrame } from './TownCamera';
import type { MirrorStorage as Mirror } from './module_bindings/types';
import { characterSheet, loadCharacterSheets, originalCharacterUrl } from './characterSprites';
import { characterWalkFrame } from './characterAnimation';

const TILE = 24;
const WIDTH = WORLD_W * TILE;
const HEIGHT = WORLD_H * TILE;
const CHARACTER_W = 24;
const CHARACTER_H = 48;
const FOOT_Y = 10;
const BUILDING_PIN_SCALE = 1.5;
// Atlas coordinates from the teammate's Player1.tscn on origin/yq.
const FACING_X = { up: 0, right: 32, down: 64, left: 96 };
type Facing = keyof typeof FACING_X;
type ShownMirror = { x: number; y: number; facing: Facing; walkTime: number; moving: boolean; lastMovedAt?: number;
  goalKey?: string; goal?: MotionPoint; path?: MotionPoint[]; pathIndex?: number };

type Props = {
  mirrors: readonly Mirror[];
  bubbles: Map<bigint, string>;
  mine: Set<bigint>;
  selected: bigint | null;
  cameraMode: CameraMode;
  followed: bigint | null;
  onSelect: (id: bigint | null) => void;
};

export default function WorldCanvas({ mirrors, bubbles, mine, selected, cameraMode, followed, onSelect }: Props) {
  const [artStatus, setArtStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Latest props for the animation loop, which runs outside React renders.
  const live = useRef({ mirrors, bubbles, mine, selected, cameraMode, followed });
  live.current = { mirrors, bubbles, mine, selected, cameraMode, followed };
  const camera = useRef<CameraFrame | null>(null);
  const pan = useRef({ x: 0, y: 0 });
  const generalZoom = useRef(1);
  const zoomAnchor = useRef<{ frame: CameraFrame; x: number; y: number } | null>(null);
  const drag = useRef({ x: 0, y: 0, active: false, moved: false });
  const pinHits = useRef<Array<{ id: bigint; x: number; y: number }>>([]);
  // Server movement runs at 5Hz; rendered characters follow destination routes each frame.
  const shown = useRef(new Map<bigint, ShownMirror>());

  useEffect(() => {
    const canvas = canvasRef.current!;
    const wheel = (event: WheelEvent) => {
      const current = camera.current;
      const { cameraMode, followed } = live.current;
      if (!current || (cameraMode === 'follow' && followed !== null && shown.current.has(followed))
        || event.ctrlKey || event.deltaY === 0) return;
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left, y = event.clientY - rect.top;
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? current.height : 1);
      const minimum = cameraTarget(current.width, current.height, 'general').zoom;
      const next = zoomGeneralCamera(current, minimum * generalZoom.current * Math.exp(-delta * 0.0015), x, y);
      generalZoom.current = next.zoom / minimum;
      pan.current = { x: next.x - WIDTH / 2, y: next.y - HEIGHT / 2 };
      zoomAnchor.current = { frame: current, x, y };
    };
    // React's delegated wheel listener is passive; the map must consume this scroll.
    canvas.addEventListener('wheel', wheel, { passive: false });
    return () => canvas.removeEventListener('wheel', wheel);
  }, []);

  useEffect(() => { zoomAnchor.current = null; }, [cameraMode, followed]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const g = canvas.getContext('2d')!;
    let frame = 0;
    let last = performance.now();
    const sprite = new Image();
    sprite.onload = () => { canvas.dataset.characterRenderer = 'sprites'; };
    sprite.onerror = () => { canvas.dataset.characterRenderer = 'fallback'; };
    sprite.src = originalCharacterUrl;
    void loadCharacterSheets().catch(() => { /* Keep the original atlas fallback. */ });
    const town = document.createElement('canvas');
    town.width = WIDTH; town.height = HEIGHT;
    setArtStatus('loading');
    let disposed = false;
    let authored = false;
    void loadAuthoredTown(town.getContext('2d')!).then(() => {
      if (!disposed) { authored = true; setArtStatus('ready'); canvas.dataset.townRenderer = 'authored'; shown.current.clear(); }
    }).catch(() => { if (!disposed) { setArtStatus('error'); canvas.dataset.townRenderer = 'error'; } });
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const draw = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const cssWidth = canvas.clientWidth, cssHeight = canvas.clientHeight;
      if (canvas.width !== Math.round(cssWidth * dpr) || canvas.height !== Math.round(cssHeight * dpr)) {
        canvas.width = Math.round(cssWidth * dpr);
        canvas.height = Math.round(cssHeight * dpr);
      }

      const { mirrors, mine, selected, cameraMode, followed } = live.current;
      const present = new Set(mirrors.map(m => m.id));
      const indoors = new Map<bigint, string>();
      for (const id of shown.current.keys()) if (!present.has(id)) shown.current.delete(id);
      for (const m of mirrors) {
        let p = shown.current.get(m.id);
        if (!p) {
          const start = nearestWalkPoint(authored ? projectTownPosition(m.x, m.y) : m);
          p = { ...start, facing: 'down', walkTime: 0, moving: false };
        }
        const goalKey = `${m.targetX}/${m.targetY}`;
        if (p.goalKey !== goalKey) {
          const destination = authored ? projectTownPosition(m.targetX, m.targetY) : { x: m.targetX, y: m.targetY };
          p.path = findTownPath(p, destination); p.pathIndex = 0; p.goalKey = goalKey;
          p.goal = p.path.at(-1) ?? { x: p.x, y: p.y };
        }
        const walked = walkTownPath(p, p.path ?? [], p.pathIndex ?? 0, dt);
        p.pathIndex = walked.index;
        const next = walked.position;
        const dx = next.x - p.x;
        const dy = next.y - p.y;
        const travelled = Math.hypot(dx, dy);
        if (travelled > 0.0001) {
          p.lastMovedAt = now;
          p.facing = Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up';
        }
        p.moving = now - (p.lastMovedAt ?? -Infinity) < 150;
        if (p.moving) p.walkTime += dt;
        else p.walkTime = 0;
        p.x = next.x;
        p.y = next.y;
        shown.current.set(m.id, p);
        const building = authored ? enteredBuilding(m, Math.hypot(p.goal!.x - p.x, p.goal!.y - p.y)) : null;
        if (building) indoors.set(m.id, building);
      }
      const player = followed === null ? undefined : shown.current.get(followed);
      const targetCamera = cameraTarget(cssWidth, cssHeight, cameraMode, player ? { x: player.x * TILE, y: player.y * TILE - 14 } : undefined);
      const isGeneral = cameraMode === 'general' || !player;
      if (isGeneral) {
        targetCamera.zoom *= generalZoom.current;
        targetCamera.x += pan.current.x;
        targetCamera.y += pan.current.y;
      }
      const previousCamera = camera.current ?? targetCamera;
      const cameraEase = reducedMotion.matches ? 1 : 1 - Math.exp(-dt * 8);
      let view = { ...targetCamera,
        x: targetCamera.x,
        y: targetCamera.y,
        zoom: previousCamera.zoom + (targetCamera.zoom - previousCamera.zoom) * cameraEase };
      if (isGeneral) {
        const anchor = zoomAnchor.current;
        view = anchor && anchor.frame.width === cssWidth && anchor.frame.height === cssHeight
          ? zoomGeneralCamera(anchor.frame, view.zoom, anchor.x, anchor.y)
          : clampGeneralCamera(view);
        // Clamp the rendered frame, including during easing and viewport changes.
        if (!anchor || anchor.frame.width !== cssWidth || anchor.frame.height !== cssHeight
          || Math.abs(view.zoom - targetCamera.zoom) < 0.0001) {
          pan.current = { x: view.x - WIDTH / 2, y: view.y - HEIGHT / 2 };
          zoomAnchor.current = null;
        }
      }
      camera.current = view;
      canvas.dataset.cameraMode = cameraMode === 'follow' && player ? 'follow' : 'general';
      canvas.dataset.cameraZoom = String(view.zoom);
      canvas.dataset.cameraX = String(view.x);
      canvas.dataset.cameraY = String(view.y);
      canvas.dataset.followedMirror = player ? String(followed) : '';
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = '#c6d9dc'; g.fillRect(0, 0, cssWidth, cssHeight);
      g.translate(cssWidth / 2 - view.x * view.zoom, cssHeight / 2 - view.y * view.zoom);
      g.scale(view.zoom, view.zoom);
      g.imageSmoothingEnabled = false;
      g.drawImage(town, 0, 0);
      // Feet determine depth so taller characters overlap naturally.
      const ordered = [...mirrors].sort((a, b) => shown.current.get(a.id)!.y - shown.current.get(b.id)!.y);
      for (const m of ordered) {
        if (indoors.has(m.id)) continue;
        const p = shown.current.get(m.id)!;
        drawMirror(g, m, p, mine.has(m.id), selected === m.id, sprite, reducedMotion.matches);
      }
      // Keep labels readable above neighbouring sprites.
      for (const m of ordered) {
        if (indoors.has(m.id)) continue;
        const p = shown.current.get(m.id)!;
        if (cameraMode === 'follow' && player && m.id !== followed
          && Math.abs(p.x - player.x) < 3.5 && Math.abs(p.y - player.y) < 2.3) continue;
        drawMirrorLabel(g, m, p.x * TILE, p.y * TILE, cameraMode !== 'follow' || m.id === followed);
      }
      // A crowded conversation should never cover the followed mirror's name.
      if (cameraMode === 'follow' && player) {
        const m = mirrors.find(m => m.id === followed);
        if (m && !indoors.has(m.id)) drawMirrorLabel(g, m, player.x * TILE, player.y * TILE, true);
      }
      // Bubbles on top so neighbours don't cover them.
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      pinHits.current = [];
      for (const [place, anchor] of Object.entries(BUILDING_PINS)) {
        const occupants = mirrors.filter(m => indoors.get(m.id) === place).sort((a, b) => a.id < b.id ? -1 : 1);
        occupants.forEach((m, i) => {
          const columns = Math.min(6, occupants.length);
          const rowSize = Math.min(columns, occupants.length - Math.floor(i / columns) * columns);
          const x = (anchor.x - view.x) * view.zoom + cssWidth / 2 + (i % columns - (rowSize - 1) / 2) * 28 * BUILDING_PIN_SCALE;
          const y = (anchor.y - view.y) * view.zoom + cssHeight / 2 - Math.floor(i / columns) * 38 * BUILDING_PIN_SCALE;
          pinHits.current.push({ id: m.id, x, y });
          drawBuildingPin(g, x, y, m, mine.has(m.id), selected === m.id, sprite);
          if (m.conversationId !== 0n) drawTalking(g, x + 12 * BUILDING_PIN_SCALE, y - 30 * BUILDING_PIN_SCALE, now, reducedMotion.matches);
          if (m.id === followed && cameraMode === 'follow') {
            g.fillStyle = '#fff9e9'; g.fillRect(x - 50, y + 3, 100, 16);
            g.fillStyle = '#404d36'; g.font = '11px "Pixelify Sans", monospace'; g.textAlign = 'center';
            g.fillText(`Inside ${anchor.label}`, x, y + 15);
          }
        });
      }
      for (const m of mirrors) {
        if (indoors.has(m.id)) continue;
        const p = shown.current.get(m.id);
        if (p) {
          const x = (p.x * TILE - view.x) * view.zoom + cssWidth / 2;
          const y = (p.y * TILE + FOOT_Y - CHARACTER_H - view.y) * view.zoom + cssHeight / 2;
          if (x >= 10 && x <= cssWidth - 10 && y >= 12 && y <= cssHeight) {
            if (m.conversationId !== 0n) drawTalking(g, x, y, now, reducedMotion.matches);
            drawStateIcon(g, x, y, m.activity, m.id, now, reducedMotion.matches);
          }
        }
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => { disposed = true; cancelAnimationFrame(frame); sprite.onload = null; sprite.onerror = null; };
  }, [loadAttempt]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (drag.current.moved) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!camera.current) return;
    const screenX = e.clientX - rect.left, screenY = e.clientY - rect.top;
    const pin = [...pinHits.current].reverse().find(p => Math.abs(screenX - p.x) <= 13 * BUILDING_PIN_SCALE
      && screenY >= p.y - 35 * BUILDING_PIN_SCALE && screenY <= p.y + 2 * BUILDING_PIN_SCALE);
    if (pin) { onSelect(pin.id); return; }
    const { x, y } = screenToTown(e.clientX - rect.left, e.clientY - rect.top, camera.current);
    let best: bigint | null = null;
    // Test the full visible body, including its head, frontmost character first.
    const frontFirst = [...shown.current].sort((a, b) => b[1].y - a[1].y);
    for (const [id, p] of frontFirst) {
      if (pinHits.current.some(pin => pin.id === id)) continue;
      const px = p.x * TILE;
      const feet = p.y * TILE + FOOT_Y;
      if (Math.abs(px - x) <= CHARACTER_W / 2 + 5 && y >= feet - CHARACTER_H - 4 && y <= feet + 5) {
        best = id; break;
      }
    }
    onSelect(best);
  };

  return <>
    <canvas ref={canvasRef} className="world" onClick={artStatus === 'ready' ? handleClick : undefined}
      onPointerDown={e => {
        drag.current = { x: e.clientX, y: e.clientY, active: true, moved: false };
        if (camera.current && (cameraMode === 'general' || followed === null || !shown.current.has(followed))) {
          pan.current = { x: camera.current.x - WIDTH / 2, y: camera.current.y - HEIGHT / 2 };
          generalZoom.current = camera.current.zoom / cameraTarget(camera.current.width, camera.current.height, 'general').zoom;
          zoomAnchor.current = null;
        }
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={e => {
        const d = drag.current;
        if (!d.active || (cameraMode === 'follow' && followed !== null) || !camera.current) return;
        const dx = e.clientX - d.x, dy = e.clientY - d.y;
        if (!d.moved && Math.hypot(dx, dy) < 5) return;
        d.moved = true; d.x = e.clientX; d.y = e.clientY;
        const halfW = camera.current.width / camera.current.zoom / 2;
        const halfH = camera.current.height / camera.current.zoom / 2;
        pan.current.x = Math.max(halfW - WIDTH / 2, Math.min(WIDTH / 2 - halfW, pan.current.x - dx / camera.current.zoom));
        pan.current.y = Math.max(halfH - HEIGHT / 2, Math.min(HEIGHT / 2 - halfH, pan.current.y - dy / camera.current.zoom));
      }}
      onPointerUp={() => { drag.current.active = false; }} onPointerCancel={() => { drag.current.active = false; }}
      aria-label="Map of Mirrorville. Drag to explore and scroll to zoom in General view." data-character-renderer="loading" data-town-renderer="loading" />
    {artStatus !== 'ready' && <div className="town-art-status" role="status">
      <p>{artStatus === 'error' ? 'The town artwork could not load.' : 'Opening Mirrorville…'}</p>
      <button onClick={() => setLoadAttempt(n => n + 1)}>Retry map</button>
    </div>}
  </>;
}

function drawMirror(g: CanvasRenderingContext2D, m: Mirror, p: ShownMirror, isMine: boolean, isSelected: boolean,
  sprite: HTMLImageElement, reducedMotion: boolean) {
  const x = p.x * TILE;
  const y = p.y * TILE;
  if (sprite.complete && sprite.naturalWidth === 128 && sprite.naturalHeight === 96) {
    g.beginPath();
    g.ellipse(x, y + FOOT_Y - 2, isMine || isSelected ? 16 : 11, isMine || isSelected ? 6 : 4, 0, 0, Math.PI * 2);
    g.fillStyle = isSelected ? '#ffffffdd' : isMine ? '#ffd54fbb' : '#22222222';
    g.fill();
    g.strokeStyle = LOOK_COLORS[m.look % LOOK_COLORS.length];
    g.lineWidth = isMine || isSelected ? 2.5 : 1.5;
    g.stroke();
    const row = characterWalkFrame(p.walkTime, p.moving, reducedMotion);
    g.save();
    g.imageSmoothingEnabled = false;
    g.drawImage(characterSheet(m.look, sprite), FACING_X[p.facing], row * 32, 16, 32,
      x - CHARACTER_W / 2, y + FOOT_Y - CHARACTER_H, CHARACTER_W, CHARACTER_H);
    g.restore();
    return;
  }
  // Preserve a usable town if the image is unavailable or still loading.
  if (isMine || isSelected) {
    g.beginPath();
    g.arc(x, y, 15, 0, Math.PI * 2);
    g.fillStyle = isSelected ? '#ffffffcc' : '#ffd54f99';
    g.fill();
  }
  g.beginPath();
  g.arc(x, y, 10, 0, Math.PI * 2);
  g.fillStyle = LOOK_COLORS[m.look % LOOK_COLORS.length];
  g.fill();
  g.lineWidth = 2;
  g.strokeStyle = m.demo ? '#ffffff' : '#2b2b2b';
  g.stroke();
  // Eyes
  g.fillStyle = '#fff';
  g.beginPath();
  g.arc(x - 3.5, y - 2, 2.4, 0, Math.PI * 2);
  g.arc(x + 3.5, y - 2, 2.4, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#222';
  g.beginPath();
  g.arc(x - 3.5, y - 1.6, 1.1, 0, Math.PI * 2);
  g.arc(x + 3.5, y - 1.6, 1.1, 0, Math.PI * 2);
  g.fill();
}

function drawMirrorLabel(g: CanvasRenderingContext2D, m: Mirror, x: number, y: number, showActivity: boolean) {
  g.font = '600 12px system-ui, sans-serif';
  g.textAlign = 'center';
  g.lineWidth = 3;
  g.strokeStyle = '#ffffffdd';
  g.strokeText(m.name, x, y + 24);
  g.fillStyle = '#222';
  g.fillText(m.name, x, y + 24);

  const doing = m.conversationId !== 0n ? 'talking' : m.activity;
  if (doing && showActivity) {
    g.font = '10px system-ui, sans-serif';
    g.strokeText(doing, x, y + 36);
    g.fillStyle = '#555';
    g.fillText(doing, x, y + 36);
  }
}

function drawBuildingPin(g: CanvasRenderingContext2D, x: number, y: number, mirror: Mirror, own: boolean, selected: boolean, sprite: HTMLImageElement) {
  g.save();
  g.translate(Math.round(x), Math.round(y));
  g.scale(BUILDING_PIN_SCALE, BUILDING_PIN_SCALE);
  x = 0; y = 0;
  g.fillStyle = selected ? '#fff9e9' : '#4d5e41';
  // Stepped silhouette rather than an antialiased web map marker.
  g.fillRect(x - 7, y - 35, 14, 3); g.fillRect(x - 11, y - 32, 22, 3);
  g.fillRect(x - 13, y - 29, 26, 14); g.fillRect(x - 11, y - 15, 22, 3);
  g.fillRect(x - 7, y - 12, 14, 3); g.fillRect(x - 4, y - 9, 8, 4); g.fillRect(x - 1, y - 5, 2, 5);
  g.fillStyle = own ? '#f4d383' : '#fff3d6';
  g.fillRect(x - 7, y - 32, 14, 3); g.fillRect(x - 10, y - 29, 20, 14); g.fillRect(x - 7, y - 15, 14, 3);
  g.fillStyle = LOOK_COLORS[mirror.look % LOOK_COLORS.length]; g.fillRect(x - 5, y - 12, 10, 2);
  if (sprite.complete && sprite.naturalWidth === 128) {
    g.imageSmoothingEnabled = false;
    // A 32px frame starts with nine transparent rows; crop the actual head,
    // not the empty upper half of the frame.
    g.drawImage(characterSheet(mirror.look, sprite), 64, 41, 16, 14, x - 10, y - 30, 20, 17.5);
  } else {
    g.fillStyle = '#4d5e41'; g.font = '14px "Pixelify Sans", monospace'; g.textAlign = 'center';
    g.fillText(mirror.name.slice(0, 1), x, y - 15);
  }
  g.restore();
}

// Small screen-space pixel marks; transcript text stays in the character panel.
function drawTalking(g: CanvasRenderingContext2D, x: number, y: number, now: number, reduced: boolean) {
  x = Math.round(x - 12); y = Math.round(y - 19);
  g.fillStyle = '#526047'; g.fillRect(x + 2, y, 20, 16); g.fillRect(x, y + 2, 24, 12);
  g.fillStyle = '#fff9e9'; g.fillRect(x + 2, y + 2, 20, 12); g.fillRect(x + 5, y + 14, 4, 4);
  for (let i = 0; i < 3; i++) {
    g.fillStyle = !reduced && Math.floor(now / 300) % 3 === i ? '#51643e' : '#9da58c';
    g.fillRect(x + 5 + i * 5, y + 7, 3, 3);
  }
}

function drawStateIcon(g: CanvasRenderingContext2D, x: number, y: number, activity: string, id: bigint, now: number, reduced: boolean) {
  if (reduced) return;
  const phase = ((now / 1000 + Number(id % 11n)) % 9);
  if (phase > 1.2) return;
  const rows = /coffee|tea|sip/i.test(activity) ? ['10100','00000','11111','10011','10011','11110','01100']
    : /walk|run|treadmill/i.test(activity) ? ['11000','11000','00011','00011','11000','11000','00011']
    : /code|debug|test|demo/i.test(activity) ? ['01010','10001','01010','00000','11111']
    : /talk/i.test(activity) ? ['00100','00100','11011','00100','00100'] : null;
  if (!rows) return;
  g.globalAlpha = Math.min(1, phase * 6, (1.2 - phase) * 4);
  g.fillStyle = '#667d55';
  const left = Math.round(x + 17), top = Math.round(y - 14 - Math.sin(phase / 1.2 * Math.PI) * 7);
  for (let row = 0; row < rows.length; row++) for (let col = 0; col < rows[row].length; col++) {
    if (rows[row][col] === '1') g.fillRect(left + col * 2, top + row * 2, 2, 2);
  }
  g.globalAlpha = 1;
}
