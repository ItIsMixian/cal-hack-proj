import { useEffect, useRef } from 'react';
import { WORLD_W, WORLD_H, LANDMARKS, LOOK_COLORS } from '../spacetimedb/src/world';
import type { Mirror } from './module_bindings/types';

const TILE = 24;
const WIDTH = WORLD_W * TILE;
const HEIGHT = WORLD_H * TILE;

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
  const shown = useRef(new Map<bigint, { x: number; y: number }>());

  useEffect(() => {
    const canvas = canvasRef.current!;
    const g = canvas.getContext('2d')!;
    let frame = 0;
    let last = performance.now();

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
      for (const m of mirrors) {
        const p = shown.current.get(m.id) ?? { x: m.x, y: m.y };
        const k = Math.min(1, dt * 2.5);
        p.x += (m.x - p.x) * k;
        p.y += (m.y - p.y) * k;
        shown.current.set(m.id, p);
        drawMirror(g, m, p.x * TILE, p.y * TILE, mine.has(m.id), selected === m.id);
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
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scale = rect.width / WIDTH;
    const x = (e.clientX - rect.left) / scale / TILE;
    const y = (e.clientY - rect.top) / scale / TILE;
    let best: bigint | null = null;
    let bestDist = 1.2;
    for (const [id, p] of shown.current) {
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bestDist) {
        best = id;
        bestDist = d;
      }
    }
    onSelect(best);
  };

  return <canvas ref={canvasRef} className="world" onClick={handleClick} aria-label="Map of Mirrorville" />;
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

function drawMirror(g: CanvasRenderingContext2D, m: Mirror, x: number, y: number, isMine: boolean, isSelected: boolean) {
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

  g.font = '600 12px system-ui, sans-serif';
  g.textAlign = 'center';
  g.lineWidth = 3;
  g.strokeStyle = '#ffffffdd';
  g.strokeText(m.name, x, y + 24);
  g.fillStyle = '#222';
  g.fillText(m.name, x, y + 24);
}

function drawBubble(g: CanvasRenderingContext2D, text: string, x: number, y: number) {
  const short = text.length > 46 ? text.slice(0, 44) + '…' : text;
  g.font = '12px system-ui, sans-serif';
  const w = Math.min(260, g.measureText(short).width + 16);
  const h = 24;
  const bx = Math.max(4, Math.min(WIDTH - w - 4, x - w / 2));
  const by = Math.max(4, y - 44);
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
