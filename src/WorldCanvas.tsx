import { useEffect, useRef } from 'react';
import { WORLD_W, WORLD_H, LANDMARKS, LOOK_COLORS } from '../spacetimedb/src/world';
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
  onSelect: (id: bigint | null) => void;
};

export default function WorldCanvas({ mirrors, bubbles, mine, selected, onSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Latest props for the animation loop, which runs outside React renders.
  const live = useRef({ mirrors, bubbles, mine, selected });
  live.current = { mirrors, bubbles, mine, selected };
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
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const draw = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const dpr = window.devicePixelRatio || 1;
      const cssWidth = canvas.clientWidth;
      const scale = cssWidth / WIDTH;
      if (canvas.width !== Math.round(cssWidth * dpr)) {
        canvas.width = Math.round(cssWidth * dpr);
        canvas.height = Math.round(HEIGHT * scale * dpr);
      }
      g.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
      drawTown(g);

      const { mirrors, bubbles, mine, selected } = live.current;
      const present = new Set(mirrors.map(m => m.id));
      for (const id of shown.current.keys()) if (!present.has(id)) shown.current.delete(id);
      for (const m of mirrors) {
        const p = shown.current.get(m.id) ?? { x: m.x, y: m.y, facing: 'down' as Facing, walkTime: 0, moving: false };
        const dx = m.x - p.x;
        const dy = m.y - p.y;
        p.moving = Math.hypot(dx, dy) > 0.04;
        if (p.moving) {
          p.facing = Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up';
          p.walkTime += dt;
        } else p.walkTime = 0;
        const k = Math.min(1, dt * 2.5);
        p.x += (m.x - p.x) * k;
        p.y += (m.y - p.y) * k;
        shown.current.set(m.id, p);
      }
      // Feet determine depth so taller characters overlap naturally.
      const ordered = [...mirrors].sort((a, b) => shown.current.get(a.id)!.y - shown.current.get(b.id)!.y);
      for (const m of ordered) {
        const p = shown.current.get(m.id)!;
        drawMirror(g, m, p, mine.has(m.id), selected === m.id, sprite, reducedMotion.matches);
      }
      // Keep labels readable above neighbouring sprites.
      for (const m of ordered) {
        const p = shown.current.get(m.id)!;
        drawMirrorLabel(g, m, p.x * TILE, p.y * TILE);
      }
      // Bubbles on top so neighbours don't cover them.
      for (const m of mirrors) {
        const text = bubbles.get(m.id);
        const p = shown.current.get(m.id);
        if (text && p) drawBubble(g, text, p.x * TILE, p.y * TILE);
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); sprite.onload = null; sprite.onerror = null; };
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scale = rect.width / WIDTH;
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
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

  return <canvas ref={canvasRef} className="world" onClick={handleClick} aria-label="Map of Mirrorville" data-character-renderer="loading" />;
}

function drawTown(g: CanvasRenderingContext2D) {
  g.fillStyle = '#d9ecc4';
  g.fillRect(0, 0, WIDTH, HEIGHT);
  g.fillStyle = '#efe3c8';
  g.fillRect(0, 9.6 * TILE, WIDTH, 1.2 * TILE);
  g.fillRect(0, 17 * TILE, WIDTH, 1.2 * TILE);
  g.fillRect(12.6 * TILE, 0, 1.2 * TILE, HEIGHT);
  g.fillRect(25.4 * TILE, 0, 1.2 * TILE, HEIGHT);

  for (const l of LANDMARKS) {
    g.fillStyle = l.color + '55';
    g.strokeStyle = l.color;
    g.lineWidth = 3;
    roundRect(g, l.x * TILE, l.y * TILE, l.w * TILE, l.h * TILE, 14);
    g.fill();
    g.stroke();
    g.fillStyle = '#3b3b3b';
    g.font = '600 15px system-ui, sans-serif';
    g.textAlign = 'left';
    g.fillText(l.label, l.x * TILE + 10, l.y * TILE + 22);
  }
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
      Math.round(x - CHARACTER_W / 2), Math.round(y + FOOT_Y - CHARACTER_H), CHARACTER_W, CHARACTER_H);
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

function drawMirrorLabel(g: CanvasRenderingContext2D, m: Mirror, x: number, y: number) {
  g.font = '600 12px system-ui, sans-serif';
  g.textAlign = 'center';
  g.lineWidth = 3;
  g.strokeStyle = '#ffffffdd';
  g.strokeText(m.name, x, y + 24);
  g.fillStyle = '#222';
  g.fillText(m.name, x, y + 24);

  const doing = m.conversationId !== 0n ? 'talking' : m.activity;
  if (doing) {
    g.font = '10px system-ui, sans-serif';
    g.strokeText(doing, x, y + 36);
    g.fillStyle = '#555';
    g.fillText(doing, x, y + 36);
  }
}

function drawBubble(g: CanvasRenderingContext2D, text: string, x: number, y: number) {
  const short = text.length > 46 ? text.slice(0, 44) + '…' : text;
  g.font = '12px system-ui, sans-serif';
  const w = Math.min(260, g.measureText(short).width + 16);
  const h = 24;
  const bx = Math.max(4, Math.min(WIDTH - w - 4, x - w / 2));
  const by = Math.max(4, y + FOOT_Y - CHARACTER_H - 30);
  g.fillStyle = '#ffffffee';
  g.strokeStyle = '#33333355';
  g.lineWidth = 1;
  roundRect(g, bx, by, w, h, 10);
  g.fill();
  g.stroke();
  g.fillStyle = '#222';
  g.textAlign = 'left';
  g.fillText(short, bx + 8, by + 16, w - 16);
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
