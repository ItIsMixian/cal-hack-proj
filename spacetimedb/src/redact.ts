// Strips obvious personal identifiers. Runs in the browser before upload and
// again on the server, so nothing like this reaches a model either way.
const PATTERNS: [RegExp, string][] = [
  [/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '[email]'],
  [/https?:\/\/\S+|www\.\S+/gi, '[link]'],
  [/(?:\+?\d[\d\s().-]{6,}\d)/g, '[number]'],
  [/(^|\s)@[\w.]{2,}/g, '$1[handle]'],
];

export function redact(text: string): string {
  let out = text;
  for (const [pattern, replacement] of PATTERNS) out = out.replace(pattern, replacement);
  return out;
}

export const FACETS = ['core', 'humor', 'warmth', 'professional', 'interests', 'recent'] as const;
export type Facet = (typeof FACETS)[number];

export const FACET_LABELS: Record<Facet, string> = {
  core: 'Who you are',
  humor: 'Humor',
  warmth: 'Warmth',
  professional: 'Work & skills',
  interests: 'Interests',
  recent: 'Lately',
};

export const RELATIONS = ['friends', 'family', 'teammates', 'classmates', 'other'] as const;

// Rooms a mirror can show up in. Only the venue is live so far.
export const ROOMS = ['venue', 'teammates', 'friends'] as const;
export type Room = (typeof ROOMS)[number];
export const ROOM_LABELS: Record<Room, string> = {
  venue: 'Cal Hacks',
  teammates: 'Finding teammates',
  friends: 'Old friends',
};

// What each room sees unless the owner says otherwise. Strangers get who you
// are and what you do; what you've been going through stays with old friends.
const DEFAULT_VISIBILITY: Record<Facet, Record<Room, boolean>> = {
  core: { venue: true, teammates: true, friends: true },
  professional: { venue: true, teammates: true, friends: true },
  interests: { venue: true, teammates: true, friends: true },
  humor: { venue: true, teammates: true, friends: true },
  recent: { venue: false, teammates: false, friends: true },
  warmth: { venue: false, teammates: false, friends: true },
};

// `overrides` is a JSON object like {"venue":"off"}; personal cards are off
// everywhere until the owner turns them on.
export function isVisibleIn(
  card: { facet: string; personal: boolean; rooms: string },
  room: Room,
): boolean {
  let overrides: Record<string, string> = {};
  try {
    overrides = card.rooms ? JSON.parse(card.rooms) : {};
  } catch {
    // Treat a malformed value as no overrides.
  }
  if (overrides[room] === 'on') return true;
  if (overrides[room] === 'off') return false;
  if (card.personal) return false;
  return DEFAULT_VISIBILITY[card.facet as Facet]?.[room] ?? false;
}
