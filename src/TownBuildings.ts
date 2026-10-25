import { LANDMARKS } from '../spacetimedb/src/world';

// Authored roof positions. Existing simulation venues retain their presentation mapping:
// workshop -> clock hall, lounge -> farm. The park remains outdoors.
export const BUILDING_PINS: Record<string, { x: number; y: number; label: string }> = {
  cafe: { x: 286, y: 199, label: 'Café' },
  gym: { x: 511, y: 150, label: 'Gym' },
  food: { x: 721, y: 267, label: 'Restaurant' },
  workshop: { x: 153, y: 318, label: 'Clock hall' },
  lounge: { x: 220, y: 80, label: 'Farm' },
};

export function enteredBuilding(mirror: { place: string; x: number; y: number; targetX: number; targetY: number }, remainingVisualDistance: number) {
  const region = LANDMARKS.find(l => l.key === mirror.place);
  if (!BUILDING_PINS[mirror.place] || !region || remainingVisualDistance > 0.15) return null;
  // Talking can stop a travelling mirror in the street; that is not an indoor arrival.
  if (mirror.x < region.x || mirror.x > region.x + region.w || mirror.y < region.y || mirror.y > region.y + region.h) return null;
  return Math.hypot(mirror.x - mirror.targetX, mirror.y - mirror.targetY) < 0.2 ? mirror.place : null;
}
