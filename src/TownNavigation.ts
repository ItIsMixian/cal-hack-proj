import grid from './townNavigation.json';
import type { MotionPoint } from './TownMotion';

const size = grid.cellSize, width = grid.width, height = grid.height;
const costs = grid.rows.join('');
const cells = [...costs].flatMap((c, i) => c === '0' ? [] : [i]);
const center = (i: number): MotionPoint => ({ x: (i % width * size + size / 2) / 24, y: (Math.floor(i / width) * size + size / 2) / 24 });
const at = (x: number, y: number) => x < 0 || y < 0 || x >= width || y >= height ? -1 : y * width + x;
function nearest(point: MotionPoint) {
  let best = cells[0], distance = Infinity;
  for (const i of cells) {
    const p = center(i), d = (p.x - point.x) ** 2 + (p.y - point.y) ** 2;
    if (d < distance) { distance = d; best = i; }
  }
  return best;
}
export const nearestWalkPoint = (point: MotionPoint) => center(nearest(point));
export function isWalkable(point: MotionPoint) {
  const i = at(Math.floor(point.x * 24 / size), Math.floor(point.y * 24 / size));
  return i >= 0 && costs[i] !== '0';
}
function clearLine(a: MotionPoint, b: MotionPoint) {
  const count = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 24 * 2);
  for (let i = 0; i <= count; i++) {
    const t = count ? i / count : 0;
    if (!isWalkable({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })) return false;
  }
  return true;
}

// Weighted A*: prefer authored paths, allow clear grass for door approaches,
// never cross buildings, water, tree masks or disconnected terrain.
export function findTownPath(from: MotionPoint, to: MotionPoint): MotionPoint[] {
  const start = nearest(from), goal = nearest(to);
  if (start === goal) return [center(goal)];
  const parent = new Int32Array(costs.length).fill(-1);
  const distance = new Float64Array(costs.length).fill(Infinity);
  const heap: Array<{ id: number; score: number }> = [];
  const heuristic = (id: number) => Math.hypot(id % width - goal % width, Math.floor(id / width) - Math.floor(goal / width));
  const push = (id: number, score: number) => {
    let i = heap.length; heap.push({ id, score });
    while (i > 0) { const p = (i - 1) >> 1; if (heap[p].score <= score) break; heap[i] = heap[p]; i = p; }
    heap[i] = { id, score };
  };
  const pop = () => {
    const first = heap[0], last = heap.pop()!;
    if (heap.length) {
      let i = 0;
      while (i * 2 + 1 < heap.length) {
        let child = i * 2 + 1;
        if (child + 1 < heap.length && heap[child + 1].score < heap[child].score) child++;
        if (heap[child].score >= last.score) break;
        heap[i] = heap[child]; i = child;
      }
      heap[i] = last;
    }
    return first;
  };
  distance[start] = 0; push(start, heuristic(start));
  while (heap.length) {
    const current = pop();
    if (current.score > distance[current.id] + heuristic(current.id) + 1e-8) continue;
    if (current.id === goal) break;
    const x = current.id % width, y = Math.floor(current.id / width);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const next = at(x + dx, y + dy);
      if (next < 0 || costs[next] === '0') continue;
      if (dx && dy && (costs[at(x + dx, y)] === '0' || costs[at(x, y + dy)] === '0')) continue;
      const cost = distance[current.id] + (dx && dy ? Math.SQRT2 : 1) * (costs[next] === '1' ? 1 : 3);
      if (cost >= distance[next]) continue;
      distance[next] = cost; parent[next] = current.id; push(next, cost + heuristic(next));
    }
  }
  if (parent[goal] < 0) return []; // Stop safely; no straight-line fallback.
  const raw = [center(goal)];
  for (let i = goal; i !== start;) { i = parent[i]; raw.push(center(i)); }
  raw.reverse();
  const result = [raw[0]];
  for (let i = 0; i < raw.length - 1;) {
    let j = Math.min(raw.length - 1, i + 16);
    while (j > i + 1 && !clearLine(raw[i], raw[j])) j--;
    result.push(raw[j]); i = j;
  }
  return result;
}

export function walkTownPath(point: MotionPoint, path: MotionPoint[], index: number, dt: number) {
  let budget = 1.8 * Math.max(0, Math.min(dt, 0.05));
  let position = { x: point.x, y: point.y };
  while (index < path.length) {
    const end = path[index], d = Math.hypot(end.x - position.x, end.y - position.y);
    if (d <= budget) { position = { ...end }; budget -= d; index++; }
    else { position.x += (end.x - position.x) * budget / d; position.y += (end.y - position.y) * budget / d; break; }
  }
  return { position, index };
}
