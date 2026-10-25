import { redact } from '../spacetimedb/src/redact';

export type MobileShareDraft = { kind: 'text' | 'link'; text: string; source: 'iphone_share'; createdAt: string; linkHost?: string };
type SharePayload = { type: 'mirrorville.share'; version: 1; kind: 'text' | 'link'; text: string; source: 'iphone_share'; createdAt: string };
export const SHARE_DRAFT_KEY = 'mirrorville/iphone-share-draft-v1';
export const SHARE_DRAFT_TTL = 15 * 60_000;
const MAX_BYTES = 16_384, MAX_TEXT = 12_000;
const keys = (value: Record<string, unknown>, allowed: string[]) => Object.keys(value).every(key => allowed.includes(key));
const utcDate = (value: unknown, now: number): value is string => {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(value)) return false;
  const at = Date.parse(value);
  return Number.isFinite(at) && new Date(at).toISOString().slice(0, 19) === value.slice(0, 19) && at <= now + 300_000;
};
function prepare(value: unknown, now: number): MobileShareDraft {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('This shared item could not be opened. Share it again.');
  const p = value as Record<string, unknown>;
  if (!keys(p, ['type', 'version', 'kind', 'text', 'source', 'createdAt']) || p.type !== 'mirrorville.share' || p.version !== 1 || !['text', 'link'].includes(String(p.kind))
    || p.source !== 'iphone_share' || typeof p.text !== 'string' || !p.text.trim() || p.text.length > MAX_TEXT || !utcDate(p.createdAt, now)) throw new Error('This shared item has an unsupported format, size or date.');
  let linkHost: string | undefined;
  if (p.kind === 'link') {
    let url: URL;
    try { url = new URL(p.text.trim()); } catch { throw new Error('Share an HTTP or HTTPS link without sign-in details.'); }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Share an HTTP or HTTPS link without sign-in details.');
    linkHost = url.hostname;
  }
  return { kind: p.kind as 'text' | 'link', text: redact(p.text).trim(), source: 'iphone_share', createdAt: p.createdAt, ...(linkHost ? { linkHost } : {}) };
}

// Only standalone receiver fragments belong to this feature. OIDC/query parameters remain untouched.
export function isMobileShareFragment(hash: string): boolean {
  return (hash.startsWith('#mirrorville-share=') || hash.startsWith('#mirrorville-text=')) && !hash.includes('&');
}
export function parseMobileShareFragment(hash: string, now = Date.now()): MobileShareDraft | null {
  if (!isMobileShareFragment(hash)) return null;
  if (hash.length > MAX_BYTES * 3 + 32) throw new Error('This shared item is too large. Share a shorter note.');
  let text: string;
  if (hash.startsWith('#mirrorville-text=')) {
    try { text = decodeURIComponent(hash.slice('#mirrorville-text='.length)); } catch { throw new Error('This shared text is not valid UTF-8. Share it again.'); }
    if (new TextEncoder().encode(text).length > MAX_BYTES) throw new Error('This shared item is too large.');
    let kind: SharePayload['kind'] = 'text';
    try { const url = new URL(text.trim()); if (['http:', 'https:'].includes(url.protocol)) kind = 'link'; } catch { /* ordinary deliberate shared text */ }
    return prepare({ type: 'mirrorville.share', version: 1, kind, text, source: 'iphone_share', createdAt: new Date(now).toISOString() }, now);
  }
  const encoded = hash.slice('#mirrorville-share='.length);
  if (!/^[a-zA-Z0-9_-]+$/.test(encoded) || encoded.length > Math.ceil(MAX_BYTES * 4 / 3)) throw new Error('This shared item is malformed or too large.');
  try {
    const binary = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
    if (binary.length > MAX_BYTES) throw new Error('oversized');
    text = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, char => char.charCodeAt(0)));
  } catch { throw new Error('This shared item is not valid UTF-8. Share it again.'); }
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new Error('This shared item could not be read. Share it again.'); }
  return prepare(value, now);
}
export function consumeMobileShare(location: { hash?: string; pathname: string; search: string }, history: { replaceState(data: unknown, unused: string, url: string): void }, now = Date.now()): MobileShareDraft | null {
  const hash = location.hash ?? '';
  if (!isMobileShareFragment(hash)) return null;
  try { return parseMobileShareFragment(hash, now); }
  finally { history.replaceState(null, '', `${location.pathname}${location.search}`); }
}
export function rememberMobileShare(draft: MobileShareDraft, storage: Pick<Storage, 'setItem'>, now = Date.now()): void {
  // Used only after the owner chooses email sign-in. No raw URL or original text is persisted.
  storage.setItem(SHARE_DRAFT_KEY, JSON.stringify({ expiresAt: now + SHARE_DRAFT_TTL, draft: { ...draft, text: redact(draft.text) } }));
}
export function forgetMobileShare(storage: Pick<Storage, 'removeItem'>): void { try { storage.removeItem(SHARE_DRAFT_KEY); } catch { /* memory-only mode */ } }
export function restoreMobileShare(storage: Pick<Storage, 'getItem' | 'removeItem'>, now = Date.now()): MobileShareDraft | null {
  try {
    const raw = storage.getItem(SHARE_DRAFT_KEY); if (!raw) return null;
    if (raw.length > MAX_BYTES * 2) { forgetMobileShare(storage); return null; }
    const value = JSON.parse(raw) as { expiresAt?: unknown; draft?: Record<string, unknown> };
    const draft = value.draft;
    if (!Number.isFinite(value.expiresAt) || Number(value.expiresAt) <= now || Number(value.expiresAt) > now + SHARE_DRAFT_TTL || !draft
      || !keys(draft, ['kind', 'text', 'source', 'createdAt', 'linkHost']) || !['text', 'link'].includes(String(draft.kind)) || draft.source !== 'iphone_share'
      || typeof draft.text !== 'string' || !draft.text.trim() || draft.text.length > MAX_TEXT || !utcDate(draft.createdAt, now)
      || (draft.linkHost !== undefined && (typeof draft.linkHost !== 'string' || !/^[a-zA-Z0-9.[\]:-]{1,253}$/.test(draft.linkHost)))) { forgetMobileShare(storage); return null; }
    const result = { ...draft, text: redact(draft.text) } as MobileShareDraft;
    forgetMobileShare(storage); // once restored, resume a memory-only draft
    return result;
  } catch { forgetMobileShare(storage); return null; }
}
