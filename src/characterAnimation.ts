// Original Player1.tscn cadence: three authored poses, middle pose held at rest.
export const CHARACTER_FPS = 5;
export const CHARACTER_WALK_ROWS = [0, 1, 2, 1] as const;
export function characterWalkFrame(seconds: number, moving: boolean, reducedMotion = false): number {
  if (!moving || reducedMotion) return 1;
  return CHARACTER_WALK_ROWS[Math.floor(Math.max(0, seconds) * CHARACTER_FPS) % CHARACTER_WALK_ROWS.length];
}
