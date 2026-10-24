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
