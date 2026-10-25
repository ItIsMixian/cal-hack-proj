import { useEffect, useRef, useState } from 'react';
import { WORLD_W, WORLD_H, LOOK_COLORS } from '../spacetimedb/src/world';
import { loadAuthoredTown, projectTownPosition } from './AuthoredTown';
import { advanceTownPosition } from './TownMotion';
import { cameraTarget, screenToTown, type CameraMode, type CameraFrame } from './TownCamera';
import type { Mirror } from './module_bindings/types';

const TILE = 24;
const WIDTH = WORLD_W * TILE;
const HEIGHT = WORLD_H * TILE;
const CHARACTER_W = 24;
const CHARACTER_H = 48;
const FOOT_Y = 10;
const WALK_ROWS = [0, 1, 2, 1];
// Atlas coordinates from the teammate's Player1.tscn on origin/yq.
const FACING_X = { up: 0, right: 32, down: 64, left: 96 };
type Facing = keyof typeof FACING_X;
type ShownMirror = { x: number; y: number; facing: Facing; walkTime: number; moving: boolean };

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
  // Smoothed on-screen positions; the server only moves mirrors once a second.
  const shown = useRef(new Map<bigint, ShownMirror>());

  useEffect(() => {
    const canvas = canvasRef.current!;
    const g = canvas.getContext('2d')!;
    let frame = 0;
    let last = performance.now();
    const sprite = new Image();
    sprite.onload = () => { canvas.dataset.characterRenderer = 'sprites'; };
    sprite.onerror = () => { canvas.dataset.characterRenderer = 'fallback'; };
    sprite.src = '/assets/characters/cup-nooble-character.png';
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

      const { mirrors, bubbles, mine, selected, cameraMode, followed } = live.current;
      const present = new Set(mirrors.map(m => m.id));
      for (const id of shown.current.keys()) if (!present.has(id)) shown.current.delete(id);
      for (const m of mirrors) {
        const target = authored ? projectTownPosition(m.x, m.y) : m;
        const p = shown.current.get(m.id) ?? { x: target.x, y: target.y, facing: 'down' as Facing, walkTime: 0, moving: false };
        const next = advanceTownPosition(p, target, dt);
        const dx = next.x - p.x;
        const dy = next.y - p.y;
        const travelled = Math.hypot(dx, dy);
        p.moving = travelled > 0.0001;
        if (p.moving) {
          p.facing = Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up';
          p.walkTime += travelled / 1.8;
        } else p.walkTime = 0;
        p.x = next.x;
        p.y = next.y;
        shown.current.set(m.id, p);
      }
      const player = followed === null ? undefined : shown.current.get(followed);
      const targetCamera = cameraTarget(cssWidth, cssHeight, cameraMode, player ? { x: player.x * TILE, y: player.y * TILE - 14 } : undefined);
      const previousCamera = camera.current ?? targetCamera;
      const cameraEase = reducedMotion.matches ? 1 : 1 - Math.exp(-dt * 8);
      const followEase = cameraMode === 'follow' && player ? 1 : cameraEase;
      const view = { ...targetCamera,
        x: previousCamera.x + (targetCamera.x - previousCamera.x) * followEase,
        y: previousCamera.y + (targetCamera.y - previousCamera.y) * followEase,
        zoom: previousCamera.zoom + (targetCamera.zoom - previousCamera.zoom) * cameraEase };
      camera.current = view;
      canvas.dataset.cameraMode = cameraMode === 'follow' && player ? 'follow' : 'general';
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
        const p = shown.current.get(m.id)!;
        drawMirror(g, m, p, mine.has(m.id), selected === m.id, sprite, reducedMotion.matches);
      }
      // Keep labels readable above neighbouring sprites.
      for (const m of ordered) {
        const p = shown.current.get(m.id)!;
        if (cameraMode === 'follow' && player && m.id !== followed
          && Math.abs(p.x - player.x) < 3.5 && Math.abs(p.y - player.y) < 2.3) continue;
        drawMirrorLabel(g, m, p.x * TILE, p.y * TILE, cameraMode !== 'follow' || m.id === followed);
      }
      // A crowded conversation should never cover the followed mirror's name.
      if (cameraMode === 'follow' && player) {
        const m = mirrors.find(m => m.id === followed);
        if (m) drawMirrorLabel(g, m, player.x * TILE, player.y * TILE, true);
      }
      // Bubbles on top so neighbours don't cover them.
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const m of mirrors) {
        const text = bubbles.get(m.id);
        const p = shown.current.get(m.id);
        if (text && p) {
          const x = (p.x * TILE - view.x) * view.zoom + cssWidth / 2;
          const y = (p.y * TILE + FOOT_Y - CHARACTER_H - view.y) * view.zoom + cssHeight / 2;
          if (x >= -30 && x <= cssWidth + 30 && y >= 0 && y <= cssHeight) drawBubble(g, text, x, y, cssWidth);
        }
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => { disposed = true; cancelAnimationFrame(frame); sprite.onload = null; sprite.onerror = null; };
  }, [loadAttempt]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!camera.current) return;
    const { x, y } = screenToTown(e.clientX - rect.left, e.clientY - rect.top, camera.current);
    let best: bigint | null = null;
    // Test the full visible body, including its head, frontmost character first.
    const frontFirst = [...shown.current].sort((a, b) => b[1].y - a[1].y);
    for (const [id, p] of frontFirst) {
      const px = p.x * TILE;
      const feet = p.y * TILE + FOOT_Y;
      if (Math.abs(px - x) <= CHARACTER_W / 2 + 5 && y >= feet - CHARACTER_H - 4 && y <= feet + 5) {
        best = id; break;
      }
    }
    onSelect(best);
  };

  return <>
    <canvas ref={canvasRef} className="world" onClick={artStatus === 'ready' ? handleClick : undefined} aria-label="Map of Mirrorville" data-character-renderer="loading" data-town-renderer="loading" />
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
    const row = p.moving && !reducedMotion ? WALK_ROWS[Math.floor(p.walkTime * 5) % WALK_ROWS.length] : 1;
    g.save();
    g.imageSmoothingEnabled = false;
    g.drawImage(sprite, FACING_X[p.facing], row * 32, 16, 32,
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

function drawBubble(g: CanvasRenderingContext2D, text: string, x: number, y: number, viewportWidth: number) {
  g.font = '14px system-ui, sans-serif';
  const limit = Math.min(300, viewportWidth - 24);
  const lines: string[] = [''];
  for (const char of text) {
    const index = lines.length - 1;
    if (g.measureText(lines[index] + char).width > limit - 20) {
      if (lines.length === 2) { lines[index] = lines[index].slice(0, -1) + '…'; break; }
      lines.push(char);
    } else lines[index] += char;
  }
  const w = Math.min(limit, Math.max(...lines.map(line => g.measureText(line).width)) + 20);
  const h = lines.length * 18 + 12;
  const bx = Math.max(12, Math.min(viewportWidth - w - 12, x - w / 2));
  const by = Math.max(4, y - h - 10);
  g.fillStyle = '#ffffffee';
  g.strokeStyle = '#33333355';
  g.lineWidth = 1;
  roundRect(g, bx, by, w, h, 10);
  g.fill();
  g.stroke();
  g.fillStyle = '#222';
  g.textAlign = 'left';
  lines.forEach((line, index) => g.fillText(line, bx + 10, by + 20 + index * 18));
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
