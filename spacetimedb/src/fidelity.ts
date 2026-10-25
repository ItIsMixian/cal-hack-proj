import { FACETS, FACET_LABELS, redact } from './redact';

export const CARDS_PER_FACET = 2;
export const RECENT_DAYS = 60;
export type ExistingCard = { id: bigint; facet: string; text: string; source: string; personal: boolean; editedByOwner: boolean };
type Candidate = { id: bigint | null; facet: string; text: string; personal: boolean; source: string };
export function ownerWords(text: string): string {
  const words: Record<string, string> = { they: 'you', their: 'your', them: 'you', themselves: 'yourself' };
  return text.replace(/\b(themselves|their|them|they)\b/gi, word => {
    const next = words[word.toLowerCase()];
    return /^[A-Z]/.test(word) ? next[0].toUpperCase() + next.slice(1) : next;
  });
}
export function recentAllowed(latestAt: string, text: string, now: number): boolean {
  if (latestAt) {
    const at = Date.parse(latestAt);
    return Number.isFinite(at) && at <= now + 86_400_000 && now - at <= RECENT_DAYS * 86_400_000;
  }
  return /\b(currently|these days|this week|today|right now)\b|目前|正在|这周|今天|最近/u.test(text);
}
const aiSource = (source: string) => /AI assistant|Codex|Claude|scene:\s*ai|·\s*ai\b/i.test(source);
export function mergePlan(existing: ExistingCard[], raw: unknown[], relation: string, source: string, allowRecent: boolean) {
  const byId = new Map(existing.map(card => [String(card.id), card]));
  const counts = new Map(FACETS.map(facet => [facet as string, existing.filter(card => card.editedByOwner && card.facet === facet).length]));
  const keep = new Set(existing.filter(card => card.editedByOwner).map(card => card.id));
  const seen = new Set<string>();
  const accepted: Candidate[] = [];
  let blocked = 0;
  for (const value of raw) {
    if (!value || typeof value !== 'object') throw new Error('Invalid card');
    const card = value as Record<string, unknown>;
    if (card.id !== null && (typeof card.id !== 'string' || !/^\d+$/.test(card.id))) throw new Error('Invalid card id');
    const id = card.id === null ? null : BigInt(card.id as string);
    const old = id === null ? undefined : byId.get(String(id));
    if (id !== null && !old) throw new Error('Unknown card id');
    if (id !== null && seen.has(String(id))) throw new Error('Duplicate card id');
    if (id !== null) seen.add(String(id));
    if (old?.editedByOwner) continue;
    if (!FACETS.includes(card.facet as typeof FACETS[number]) || typeof card.text !== 'string' || !card.text.trim() || typeof card.personal !== 'boolean') throw new Error('Invalid card fields');
    const facet = String(card.facet), text = redact(card.text).trim().slice(0, 200);
    const changed = !old || old.text !== text || old.facet !== facet;
    if ((old && !changed && aiSource(old.source) && ['humor', 'warmth'].includes(old.facet)) ||
      (changed && relation === 'ai' && ['humor', 'warmth'].includes(facet)) ||
      (changed && facet === 'recent' && !allowRecent) || (counts.get(facet) ?? 0) >= CARDS_PER_FACET) { blocked++; continue; }
    counts.set(facet, (counts.get(facet) ?? 0) + 1);
    if (old) keep.add(old.id);
    accepted.push({ id, facet, text, personal: old?.personal || card.personal, source: changed ? source : old!.source });
  }
  const remove = existing.filter(card => !keep.has(card.id)).map(card => card.id);
  const merged = FACETS.flatMap(facet => {
    const before = existing.filter(card => card.facet === facet).length;
    const after = counts.get(facet) ?? 0;
    return before > after ? [`${FACET_LABELS[facet]}: ${before} cards merged into ${after}`] : [];
  });
  const created = accepted.filter(card => card.id === null).length;
  const rewritten = accepted.filter(card => card.id !== null && byId.get(String(card.id))!.text !== card.text).length;
  return { accepted, remove, message: [...merged, `${created} new`, `${rewritten} rewritten`, `${remove.length} removed`, ...(blocked ? [`${blocked} filtered`] : [])].join(' · ') };
}
