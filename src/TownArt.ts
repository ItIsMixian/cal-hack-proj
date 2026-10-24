import { LANDMARKS } from '../spacetimedb/src/world';

// Static scenery only. Coordinates and walkable regions still come from the shared world.
export function drawTown(g: CanvasRenderingContext2D) {
  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    g.fillStyle = color; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  rect(0, 0, 960, 672, '#a9bf85');
  for (let y = 8; y < 672; y += 24) for (let x = 8; x < 960; x += 24) {
    const n = (x * 13 + y * 7) % 23;
    rect(x, y, 3, 3, n < 10 ? '#98b176' : '#b6c990');
    if (n < 5) { rect(x + 8, y + 9, 3, 3, '#eee0a1'); rect(x + 9, y + 12, 2, 4, '#7f9d66'); }
  }
  const path = (x: number, y: number, w: number, h: number) => {
    rect(x - 3, y - 3, w + 6, h + 6, '#92a875'); rect(x, y, w, h, '#dbcc9e');
    for (let py = y + 3; py < y + h - 2; py += 12) for (let px = x + 3; px < x + w - 2; px += 18) {
      rect(px, py, Math.min(14, x + w - px - 1), Math.min(8, y + h - py - 1), '#e5d8b1');
    }
  };
  path(0, 230, 960, 30); path(0, 408, 960, 30); path(302, 0, 30, 672); path(610, 0, 30, 672);
  const tree = (x: number, y: number) => {
    rect(x + 8, y + 28, 22, 8, '#72875b'); rect(x + 16, y + 20, 8, 18, '#8b7651');
    rect(x + 5, y + 6, 30, 22, '#6c8c5c'); rect(x + 11, y, 18, 32, '#6c8c5c');
    rect(x + 10, y + 5, 22, 16, '#8aa76c'); rect(x + 15, y + 2, 12, 5, '#9ab579');
  };
  [[5,20],[260,10],[650,12],[906,15],[10,280],[900,320],[14,605],[290,605],[630,610],[905,610],[420,460],[508,580]].forEach(([x,y]) => tree(x,y));
  const bench = (x: number, y: number) => {
    rect(x, y, 32, 5, '#a27a50'); rect(x, y + 8, 32, 7, '#c29964');
    rect(x + 3, y + 15, 4, 7, '#795f46'); rect(x + 25, y + 15, 4, 7, '#795f46');
  };
  const palette: Record<string, string> = { gym: '#9f7860', cafe: '#7c9473', food: '#b98d59', workshop: '#8a8790', lounge: '#718d88' };
  for (const landmark of LANDMARKS) {
    const x = landmark.x * 24, y = landmark.y * 24, w = landmark.w * 24, h = landmark.h * 24;
    if (landmark.key === 'park') {
      rect(x - 5, y - 5, w + 10, h + 10, '#8ca675'); rect(x, y, w, h, '#b6c691');
      path(x + w / 2 - 12, y, 24, h); path(x, y + h / 2 - 12, w, 24);
      bench(x + 16, y + 28); bench(x + w - 48, y + h - 44);
      rect(x + 18, y + h - 42, 28, 18, '#799865'); rect(x + 21, y + h - 39, 5, 5, '#e8c192'); rect(x + 35, y + h - 33, 5, 5, '#f3dfaa');
    } else {
      rect(x - 5, y + 8, w + 12, h, '#7e9367'); rect(x - 3, y, w + 6, h, '#8c7557');
      rect(x, y + 8, w, h - 8, '#d3bb92');
      for (let py = y + 18; py < y + h; py += 24) {
        rect(x, py, w, 1, '#bda27c');
        for (let px = x + ((py % 48) ? 24 : 0); px < x + w; px += 48) rect(px, py, 1, 24, '#c3a780');
      }
      rect(x - 7, y - 14, w + 14, 34, palette[landmark.key]);
      rect(x - 3, y - 10, w + 6, 4, '#ffffff25'); rect(x - 7, y + 16, w + 14, 5, '#665b47');
      rect(x, y + 21, 6, h - 21, '#a38a63'); rect(x + w - 6, y + 21, 6, h - 21, '#a38a63');
      rect(x, y + h - 5, w / 2 - 18, 5, '#9d8560'); rect(x + w / 2 + 18, y + h - 5, w / 2 - 18, 5, '#9d8560');
      if (landmark.key === 'gym') {
        rect(x + 18, y + 34, 52, 28, '#a7b09a');
        rect(x + 24, y + 45, 40, 5, '#6d7366'); rect(x + 23, y + 37, 8, 21, '#565e55'); rect(x + 57, y + 37, 8, 21, '#565e55');
        rect(x + w - 48, y + 32, 24, 42, '#8e977f'); rect(x + w - 43, y + 37, 14, 30, '#677362');
        bench(x + 18, y + h - 35);
      }
      if (landmark.key === 'cafe') {
        rect(x + 15, y + 28, w - 30, 21, '#927456'); rect(x + 15, y + 28, w - 30, 6, '#e5d3ac');
        rect(x + 24, y + 17, 20, 16, '#657768'); rect(x + 48, y + 22, 9, 8, '#f3e6c4');
        [[22,85],[w - 62,h - 55]].forEach(([tx,ty]) => { rect(x + tx, y + ty, 40, 25, '#a8875e'); rect(x + tx + 8, y + ty + 5, 8, 8, '#f5e7c2'); rect(x + tx - 5, y + ty + 6, 5, 16, '#718c65'); });
      }
      if (landmark.key === 'food') {
        rect(x + 14, y + 34, w - 28, 24, '#9e7655'); rect(x + 14, y + 29, w - 28, 10, '#efe0b6');
        for (let i = 0; i < 8; i++) rect(x + 14 + i * (w - 28) / 8, y + 18, (w - 28) / 8, 11, i % 2 ? '#f0d8ae' : '#b78069');
        for (let i = 0; i < 3; i++) { rect(x + 28 + i * 54, y + 41, 22, 8, '#e8c98f'); rect(x + 32 + i * 54, y + 42, 4, 4, '#b86e51'); }
        bench(x + w - 48, y + h - 34);
      }
      if (landmark.key === 'workshop') {
        rect(x + 25, y + 28, w - 50, 32, '#a18b68'); rect(x + 32, y + 22, w - 64, 30, '#e5dfc7');
        rect(x + 43, y + 30, 48, 3, '#8c9c83'); rect(x + 43, y + 39, 75, 3, '#c1b795');
        for (let i = 0; i < 4; i++) bench(x + 20 + i * 57, y + h - 38);
      }
      if (landmark.key === 'lounge') {
        for (let i = 0; i < 3; i++) { const tx = x + 16 + i * 72;
          rect(tx, y + 40, 60, 20, '#9f805b'); rect(tx + 10, y + 23, 36, 23, '#5c6c5e'); rect(tx + 14, y + 27, 28, 14, '#a4c1a6'); rect(tx + 24, y + 51, 18, 4, '#e7d7b5');
        }
        bench(x + 18, y + h - 36);
      }
    }
    // Signs sit above the activity areas rather than covering the residents.
    const label = landmark.label;
    g.font = '20px "Pixelify Sans", monospace'; const width = g.measureText(label).width + 20;
    rect(x + (w - width) / 2, y - 17, width, 26, '#705f48'); rect(x + (w - width) / 2 + 2, y - 15, width - 4, 22, '#f4e7c5');
    g.fillStyle = '#514e3c'; g.textAlign = 'center'; g.fillText(label, x + w / 2, y + 2);
  }
  // A few lanterns along the paths.
  for (const [x,y] of [[312,218],[620,394],[312,622],[620,220]]) {
    rect(x, y, 4, 22, '#7b7259'); rect(x - 4, y - 6, 12, 12, '#8e805e'); rect(x - 1, y - 3, 6, 6, '#f3dfa0');
  }
}
