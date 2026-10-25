export type RoomStation = 'entrance' | 'desk' | 'mirror' | 'door';
export type RoomPoint = { x: number; y: number };
export type RoomFacing = 'up' | 'right' | 'down' | 'left';
export const ROOM_STATIONS: Record<RoomStation, RoomPoint> = {
  entrance: { x: 480, y: 675 }, desk: { x: 590, y: 592 },
  mirror: { x: 450, y: 655 }, door: { x: 586, y: 757 },
};
export const STATION_FACING: Record<RoomStation, RoomFacing> = { entrance: 'down', desk: 'up', mirror: 'left', door: 'down' };
export function roomRoute(from: RoomPoint, station: RoomStation): RoomPoint[] {
  const end = ROOM_STATIONS[station];
  if (Math.hypot(from.x - end.x, from.y - end.y) < 1) return [from];
  // Walk below the desk and to the right of the mirror/table, never through furniture.
  const waypoints = station === 'desk' ? [{ x: 466, y: 610 }, end]
    : station === 'mirror' ? [{ x: 468, y: 610 }, end]
    : station === 'door' ? [{ x: 480, y: 704 }, end] : [end];
  return [from, ...waypoints].filter((point, i, all) => !i || Math.hypot(point.x - all[i - 1].x, point.y - all[i - 1].y) > 1);
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
