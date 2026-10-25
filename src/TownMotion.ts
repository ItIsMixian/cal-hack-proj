export type MotionPoint = { x: number; y: number };

// Database snapshots arrive once a second. Never turn a projection jump or delayed
// snapshot into a burst of speed; walk toward the latest destination at a fixed pace.
export function advanceTownPosition(position: MotionPoint, target: MotionPoint, dt: number): MotionPoint {
  const dx = target.x - position.x, dy = target.y - position.y;
  const distance = Math.hypot(dx, dy);
  const step = Math.min(distance, 1.8 * Math.max(0, Math.min(dt, 0.05)));
  if (distance === 0) return { ...position };
  return { x: position.x + dx / distance * step, y: position.y + dy / distance * step };
}
