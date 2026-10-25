export type MotionPoint = { x: number; y: number };
export type TownSnapshot = { from: MotionPoint; to: MotionPoint; receivedAt: number };

// Play a server step across its one-second update interval instead of finishing
// a small step early and standing still until the next packet. No extrapolation.
export function sampleTownSnapshot(previous: TownSnapshot | undefined, rendered: MotionPoint, target: MotionPoint, now: number) {
  const changed = !previous || previous.to.x !== target.x || previous.to.y !== target.y;
  const snapshot: TownSnapshot = changed
    ? { from: { x: rendered.x, y: rendered.y }, to: { ...target }, receivedAt: now }
    : previous;
  const progress = Math.max(0, Math.min(1, (now - snapshot.receivedAt) / 1000));
  return { snapshot, point: {
    x: snapshot.from.x + (snapshot.to.x - snapshot.from.x) * progress,
    y: snapshot.from.y + (snapshot.to.y - snapshot.from.y) * progress,
  } };
}

// Database snapshots arrive once a second. Never turn a projection jump or delayed
// snapshot into a burst of speed; walk toward the latest destination at a fixed pace.
export function advanceTownPosition(position: MotionPoint, target: MotionPoint, dt: number): MotionPoint {
  const dx = target.x - position.x, dy = target.y - position.y;
  const distance = Math.hypot(dx, dy);
  const step = Math.min(distance, 1.8 * Math.max(0, Math.min(dt, 0.05)));
  if (distance === 0) return { ...position };
  return { x: position.x + dx / distance * step, y: position.y + dy / distance * step };
}
