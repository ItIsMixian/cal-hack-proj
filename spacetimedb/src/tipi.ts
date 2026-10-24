// Ten-Item Personality Inventory (Gosling, Rentfrow & Swann, 2003).
// Each item is rated 1 (disagree strongly) to 7 (agree strongly).
export const TIPI_ITEMS = [
  'Extraverted, enthusiastic',
  'Critical, quarrelsome',
  'Dependable, self-disciplined',
  'Anxious, easily upset',
  'Open to new experiences, complex',
  'Reserved, quiet',
  'Sympathetic, warm',
  'Disorganized, careless',
  'Calm, emotionally stable',
  'Conventional, uncreative',
];

type BigFive = {
  extraversion: number;
  agreeableness: number;
  conscientiousness: number;
  emotionalStability: number;
  openness: number;
};

export function isValidTipi(answers: readonly number[]): boolean {
  return answers.length === 10 && answers.every((a) => Number.isInteger(a) && a >= 1 && a <= 7);
}

function scoreTipi(answers: readonly number[]): BigFive {
  const r = (i: number) => 8 - answers[i];
  return {
    extraversion: (answers[0] + r(5)) / 2,
    agreeableness: (r(1) + answers[6]) / 2,
    conscientiousness: (answers[2] + r(7)) / 2,
    emotionalStability: (r(3) + answers[8]) / 2,
    openness: (answers[4] + r(9)) / 2,
  };
}

const TRAIT_WORDS: Record<keyof BigFive, [low: string, high: string]> = {
  extraversion: ['quiet and recharges alone', 'outgoing and energized by people'],
  agreeableness: ['blunt and willing to push back', 'warm and easy to get along with'],
  conscientiousness: ['spontaneous and loose with plans', 'organized and follows through'],
  emotionalStability: ['feels things intensely', 'calm under pressure'],
  openness: ['practical and prefers the familiar', 'curious and drawn to new ideas'],
};

export function buildSelfCard(answers: readonly number[], onMind: string): string {
  const scores = scoreTipi(answers);
  const parts: string[] = [];
  for (const key of Object.keys(TRAIT_WORDS) as (keyof BigFive)[]) {
    const [low, high] = TRAIT_WORDS[key];
    if (scores[key] >= 5) parts.push(high);
    else if (scores[key] <= 3) parts.push(low);
  }
  const traits = parts.length
    ? `Tends to be ${parts.join(', ')}.`
    : 'Balanced across most personality traits.';
  const mind = onMind.trim();
  return mind ? `${traits} Lately on their mind: ${mind}` : traits;
}
