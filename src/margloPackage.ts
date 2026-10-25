import { redact } from '../spacetimedb/src/redact';

export type MargloItem = {
  id: string; kind: 'background' | 'observation' | 'owner_statement'; text: string;
  startAt: string | null; endAt: string | null;
  provenance: 'desktop_activity' | 'selected_context' | 'owner_input';
  status: 'tentative' | 'confirmed';
};
export type MargloPackage = { type: 'mirrorville.marglo'; version: 1; generatedAt: string; items: MargloItem[] };
const exactKeys = (value: Record<string, unknown>, keys: string[]) => Object.keys(value).every(key => keys.includes(key));
function timestamp(value: unknown, now: number): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(value)) return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 19) === value.slice(0, 19) && time <= now + 300_000;
}
export function parseMargloPackage(text: string, now = Date.now()): MargloPackage {
  if (new TextEncoder().encode(text).length > 256_000) throw new Error('Keep the near-term package under 256 KB.');
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new Error('Choose a Mirrorville Marglo JSON package.'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid Marglo package.');
  const p = value as Record<string, unknown>;
  if (!exactKeys(p, ['type', 'version', 'generatedAt', 'items']) || p.type !== 'mirrorville.marglo' || p.version !== 1 || !timestamp(p.generatedAt, now) || !Array.isArray(p.items) || p.items.length > 60) throw new Error('Unsupported Marglo package version, date or item count.');
  const seen = new Set<string>();
  const items = p.items.map((raw): MargloItem => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Invalid item in Marglo package.');
    const i = raw as Record<string, unknown>;
    if (!exactKeys(i, ['id', 'kind', 'text', 'startAt', 'endAt', 'provenance', 'status']) || typeof i.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(i.id) || seen.has(i.id)
      || !['background', 'observation', 'owner_statement'].includes(String(i.kind)) || !['desktop_activity', 'selected_context', 'owner_input'].includes(String(i.provenance))
      || !['tentative', 'confirmed'].includes(String(i.status)) || typeof i.text !== 'string' || !i.text.trim() || i.text.length > 2_000) throw new Error('Invalid or duplicate item in Marglo package.');
    if ((i.startAt !== null && !timestamp(i.startAt, now)) || (i.endAt !== null && !timestamp(i.endAt, now)) || (i.startAt === null) !== (i.endAt === null)
      || (typeof i.startAt === 'string' && typeof i.endAt === 'string' && Date.parse(i.startAt) > Date.parse(i.endAt))) throw new Error('Invalid observation dates in Marglo package.');
    if (i.kind === 'observation' && (i.provenance !== 'desktop_activity' || i.startAt === null || i.status !== 'tentative')) throw new Error('Desktop observations must retain their tentative status and dates.');
    if (i.status === 'confirmed' && i.provenance !== 'owner_input') throw new Error('Only explicit owner input may arrive as confirmed.');
    seen.add(i.id);
    return { id: i.id, kind: i.kind, text: redact(i.text).trim(), startAt: i.startAt, endAt: i.endAt, provenance: i.provenance, status: i.status } as MargloItem;
  });
  return { type: 'mirrorville.marglo', version: 1, generatedAt: p.generatedAt, items };
}
export function margloDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' }) : 'Date unknown';
}
export function margloLetter(items: MargloItem[], checked: string[]): { text: string; latestAt: string; characters: number; included: number } {
  const blocks: string[] = []; let length = 0, characters = 0; const dates: string[] = [];
  for (const item of items) {
    if (!checked.includes(item.id)) continue;
    const body = redact(item.text).trim().slice(0, 2_000);
    if (!body) continue;
    const label = item.kind === 'observation' ? 'Owner reviewed desktop observation; does not establish motives or project completion' : item.kind === 'background' ? 'Owner reviewed background' : 'Owner statement';
    const block = `[Marglo · ${label} · ${item.provenance} · ${margloDate(item.startAt)}${item.endAt !== item.startAt ? ` to ${margloDate(item.endAt)}` : ''}]\n${body}`;
    if (length + block.length + 2 > 29_000) break;
    blocks.push(block); length += block.length + 2; characters += body.length;
    if (item.endAt) dates.push(item.endAt);
  }
  return { text: blocks.join('\n\n'), latestAt: dates.sort((a, b) => Date.parse(a) - Date.parse(b)).at(-1) ?? '', characters, included: blocks.length };
}
