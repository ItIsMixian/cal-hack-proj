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
    keywords: ['gym', 'workout', 'work out', 'lift', 'run', 'jog', 'exercise', 'fitness', 'yoga', 'swim', 'climb', 'climbing'] },
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

// What a mirror is visibly doing at each place. Conversations start from this.
export const ACTIVITIES: Record<string, string[]> = {
  gym: ['stretching', 'on the treadmill', 'lifting', 'waiting for the climbing wall'],
  cafe: ['sipping coffee', 'sketching in a notebook', 'reading', 'waiting for a latte'],
  food: ['eating noodles', 'in line for pizza', 'grabbing a snack', 'looking for a seat'],
  workshop: ['listening to a talk', 'taking notes', 'waiting for the session to start'],
  lounge: ['coding', 'debugging', 'sketching on the whiteboard', 'testing a demo'],
  park: ['taking a walk', 'sitting on a bench', 'getting some air'],
};

// A daily rhythm loosely based on the event schedule, in venue time (SF).
export type TownEvent = { label: string; landmark: string; start: number; end: number; meal?: boolean };
export const EVENTS: TownEvent[] = [
  { label: 'Morning workout', landmark: 'gym', start: 7, end: 9 },
  { label: 'Breakfast', landmark: 'food', start: 8, end: 10, meal: true },
  { label: 'Lunch', landmark: 'food', start: 12, end: 13.5, meal: true },
  { label: 'Coffee break', landmark: 'cafe', start: 15, end: 16 },
  { label: 'Dinner', landmark: 'food', start: 18, end: 19.5, meal: true },
  { label: 'Evening workshop', landmark: 'workshop', start: 21, end: 22 },
  { label: 'Late-night hacking', landmark: 'lounge', start: 22, end: 27 },
];

export const VENUE_UTC_OFFSET_HOURS = -7;

// Hour of day at the venue as a fraction (e.g. 13.5 = 1:30pm).
export function venueHour(micros: bigint): number {
  const hours = Number(micros / 1_000_000n) / 3600 + VENUE_UTC_OFFSET_HOURS;
  return ((hours % 24) + 24) % 24;
}

export function currentEvent(hour: number): TownEvent | undefined {
  return EVENTS.find((e) => (hour >= e.start && hour < e.end) || (e.end > 24 && hour < e.end - 24));
}

export function clockLabel(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.floor((hour - h) * 60);
  const suffix = h < 12 ? 'am' : 'pm';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')}${suffix}`;
}

export const LOOK_COLORS =['#ef5350', '#ab47bc', '#5c6bc0', '#29b6f6', '#26a69a', '#9ccc65', '#ffca28', '#ff7043'];
