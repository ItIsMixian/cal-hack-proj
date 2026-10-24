// Static layout of Mirrorville and the rules that map a mirror's intent to a
// place in town. Shared by the server module and the client renderer.

export const WORLD_W = 40;
export const WORLD_H = 28;

export type Landmark = {
  key: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  keywords: string[];
};

export const LANDMARKS: Landmark[] = [
  { key: 'gym', label: 'Gym', x: 2, y: 2, w: 9, h: 7, color: '#f28b82',
    keywords: ['gym', 'workout', 'work out', 'lift', 'run', 'jog', 'exercise', 'fitness', 'yoga', 'swim'] },
  { key: 'cafe', label: 'Café', x: 15, y: 2, w: 9, h: 6, color: '#d7a86e',
    keywords: ['coffee', 'cafe', 'café', 'tea', 'boba', 'chat', 'talk through', 'idea'] },
  { key: 'food', label: 'Food Court', x: 28, y: 2, w: 10, h: 7, color: '#fbbc04',
    keywords: ['dinner', 'lunch', 'breakfast', 'food', 'eat', 'meal', 'snack', 'pizza'] },
  { key: 'workshop', label: 'Workshop Hall', x: 2, y: 18, w: 11, h: 8, color: '#a78bfa',
    keywords: ['workshop', 'talk', 'session', 'lecture', 'demo', 'keynote', 'learn'] },
  { key: 'lounge', label: 'Hacker Lounge', x: 27, y: 18, w: 11, h: 8, color: '#4fc3f7',
    keywords: ['teammate', 'team', 'backend', 'frontend', 'code', 'hack', 'build', 'debug', 'bug', 'project', 'design'] },
  { key: 'park', label: 'Park', x: 15, y: 11, w: 10, h: 7, color: '#81c995',
    keywords: [] },
];

export const DEFAULT_LANDMARK = 'park';

export function landmarkForIntent(intent: string): string {
  const text = intent.toLowerCase();
  let best = DEFAULT_LANDMARK;
  let bestIndex = Infinity;
  // The earliest keyword in the sentence wins, so "dinner after the workshop" goes to food.
  for (const landmark of LANDMARKS) {
    for (const keyword of landmark.keywords) {
      // Whole words only, so "teammate" doesn't match "tea".
      const match = new RegExp(`(^|[^a-z])${keyword}($|[^a-z])`).exec(text);
      const i = match ? match.index : -1;
      if (i !== -1 && i < bestIndex) {
        best = landmark.key;
        bestIndex = i;
      }
    }
  }
  return best;
}

export function findLandmark(key: string): Landmark {
  return LANDMARKS.find((l) => l.key === key) ?? LANDMARKS.find((l) => l.key === DEFAULT_LANDMARK)!;
}

export const LOOK_COLORS = ['#ef5350', '#ab47bc', '#5c6bc0', '#29b6f6', '#26a69a', '#9ccc65', '#ffca28', '#ff7043'];
