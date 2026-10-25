export type RoomStation = 'entrance' | 'desk' | 'cards' | 'mirror' | 'diary' | 'door';
export type RoomPoint = { x: number; y: number };
export type RoomFacing = 'up' | 'right' | 'down' | 'left';
export const ROOM_STATIONS: Record<RoomStation, RoomPoint> = {
  entrance: { x: 480, y: 675 }, desk: { x: 470, y: 250 }, cards: { x: 410, y: 490 }, diary: { x: 590, y: 360 },
  mirror: { x: 400, y: 675 }, door: { x: 415, y: 770 },
};
export const STATION_FACING: Record<RoomStation, RoomFacing> = { entrance: 'down', desk: 'right', cards: 'up', diary: 'down', mirror: 'left', door: 'down' };
export const TOUR_STATIONS = ['desk', 'cards', 'mirror', 'diary', 'door'] as const;
export function nextTourStation(station: RoomStation): RoomStation | undefined {
  if (station === 'entrance') return 'desk';
  const index = TOUR_STATIONS.indexOf(station as typeof TOUR_STATIONS[number]);
  return TOUR_STATIONS[index + 1];
}
// Connected floor corridors in authored room coordinates, including chair access and doorway.
const FLOOR = [
  [390, 250, 510, 775], [390, 300, 640, 355], [570, 350, 620, 375],
  [510, 590, 735, 775], [245, 755, 735, 775],
];
export function isRoomFloor(p: RoomPoint): boolean {
  return FLOOR.some(([left, top, right, bottom]) => p.x >= left && p.x <= right && p.y >= top && p.y <= bottom);
}
function clearSegment(a: RoomPoint, b: RoomPoint): boolean {
  const steps = Math.max(1, Math.ceil(Math.hypot(b.x-a.x,b.y-a.y) / 2));
  for (let i=0;i<=steps;i++) if (!isRoomFloor({x:a.x+(b.x-a.x)*i/steps,y:a.y+(b.y-a.y)*i/steps})) return false;
  return true;
}
export function roomRoute(from: RoomPoint, station: RoomStation | RoomPoint): RoomPoint[] {
  const end = typeof station === 'string' ? ROOM_STATIONS[station] : station;
  if (Math.hypot(from.x-end.x,from.y-end.y)<1) return [from];
  // Include corridor intersections, not just hand-picked midpoints. Otherwise a
  // visible corner shortcut can be missed and the resident doubles back.
  const xs = [...new Set(FLOOR.flatMap(([left, , right]) => [left, right]))];
  const ys = [...new Set(FLOOR.flatMap(([, top, , bottom]) => [top, bottom]))];
  const corners = xs.flatMap(x => ys.map(y => ({ x, y }))).filter(isRoomFloor);
  const nodes = [from, end, ...corners];
  const costs = nodes.map(()=>Infinity), previous = nodes.map(()=>-1), visited = new Set<number>();
  costs[0]=0;
  for (let step=0;step<nodes.length;step++) {
    let current=-1;
    for(let i=0;i<nodes.length;i++) if(!visited.has(i) && (current<0 || costs[i]<costs[current])) current=i;
    if(current<0 || !Number.isFinite(costs[current])) break;
    if(current===1) break;
    visited.add(current);
    for(let i=0;i<nodes.length;i++) if(!visited.has(i) && clearSegment(nodes[current],nodes[i])) {
      const cost=costs[current]+Math.hypot(nodes[i].x-nodes[current].x,nodes[i].y-nodes[current].y);
      if(cost<costs[i]) { costs[i]=cost; previous[i]=current; }
    }
  }
  if(!Number.isFinite(costs[1])) return [from];
  const route: RoomPoint[]=[];
  for(let i=1;i!==-1;i=previous[i]) route.unshift(nodes[i]);
  return route;
}
export function sampleRoomRoute(points: RoomPoint[], distance: number): RoomPoint & { facing: RoomFacing; done: boolean } {
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], length = Math.hypot(b.x - a.x, b.y - a.y);
    if (distance < length) {
      const ratio = Math.max(0, distance) / length;
      return { x: a.x + (b.x - a.x) * ratio, y: a.y + (b.y - a.y) * ratio,
        facing: Math.abs(b.x - a.x) > Math.abs(b.y - a.y) ? b.x > a.x ? 'right' : 'left' : b.y > a.y ? 'down' : 'up', done: false };
    }
    distance -= length;
  }
  return { ...points[points.length - 1], facing: 'down', done: true };
}

