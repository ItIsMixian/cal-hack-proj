import { parseMargloPackage, type MargloPackage } from './margloPackage';

export const DESKTOP_OBSERVER_URL = 'http://127.0.0.1:17358';
export type DesktopStatus = { enabled: boolean; observations: number; browserTopics: boolean; sampleState?: string; lastSampleAt?: string | null; lastClueAt?: string | null };
declare global {
  interface Window {
    mirrorvilleDesktop?: { readonly version: 1; request: (method: string, body?: object) => Promise<Record<string, unknown>> };
  }
}
export function isNativeDesktop(): boolean { return typeof window !== 'undefined' && window.mirrorvilleDesktop?.version === 1; }
export class DesktopBridgeError extends Error {
  constructor(message: string, public readonly unauthorized = false) { super(message); }
}

async function request(path: string, token: string | null, body?: object, signal?: AbortSignal): Promise<Record<string, unknown>> {
  if (isNativeDesktop()) {
    if (signal?.aborted) throw new DesktopBridgeError('Desktop connection cancelled.');
    if (path === '/health') return { service: 'mirrorville-desktop', version: 1 };
    if (path === '/pair') return { token: 'native-desktop-private-pipe-session' };
    const method = path === '/disconnect' ? 'pause' : path.slice(1);
    try { return await window.mirrorvilleDesktop!.request(method, path === '/disconnect' ? {} : body ?? {}); }
    catch { throw new DesktopBridgeError('Local observation is unavailable. Restart Mirrorville to retry.'); }
  }
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) throw new DesktopBridgeError('Desktop connection cancelled.');
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, 5_000);
  try {
    const response = await fetch(`${DESKTOP_OBSERVER_URL}${path}`, {
      method: body ? 'POST' : 'GET', credentials: 'omit', cache: 'no-store', redirect: 'error', mode: 'cors', referrerPolicy: 'no-referrer',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: controller.signal,
    });
    if (!response.ok) {
      if (response.status === 401) throw new DesktopBridgeError('Pairing expired or was disconnected. Pair this browser again.', true);
      if (response.status === 403) throw new DesktopBridgeError('The companion did not allow this browser or pairing code. Check its configured website and code.');
      if (response.status === 429) throw new DesktopBridgeError('Too many pairing attempts. Wait before trying again.');
      throw new DesktopBridgeError('The desktop companion could not complete that action. Please try again.');
    }
    if (Number(response.headers.get('content-length') ?? 0) > 256_000) throw new DesktopBridgeError('The desktop response was too large. Clear old observations and try again.');
    const raw = await response.text();
    if (new TextEncoder().encode(raw).length > 256_000) throw new DesktopBridgeError('The desktop response was too large.');
    let value: unknown;
    try { value = JSON.parse(raw); } catch { throw new DesktopBridgeError('The companion returned an unreadable response.'); }
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new DesktopBridgeError('The companion returned an unreadable response.');
    return value as Record<string, unknown>;
  } catch (error) {
    if (error instanceof DesktopBridgeError) throw error;
    if (signal?.aborted) throw new DesktopBridgeError('Desktop connection cancelled.');
    throw new DesktopBridgeError('Could not reach the desktop companion. Start it and allow local-network access if your browser asks.');
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
}

export async function findDesktopObserver(signal?: AbortSignal): Promise<void> {
  const health = await request('/health', null, undefined, signal);
  if (health.service !== 'mirrorville-desktop' || health.version !== 1) throw new DesktopBridgeError('This is not a supported Mirrorville desktop companion.');
}
export async function pairDesktopObserver(code: string, signal?: AbortSignal): Promise<string> {
  const clean = code.trim();
  if (!/^[a-zA-Z0-9-]{6,64}$/.test(clean)) throw new DesktopBridgeError('Enter the pairing code shown by your desktop companion.');
  const response = await request('/pair', null, { code: clean }, signal);
  if (typeof response.token !== 'string' || !/^[a-zA-Z0-9_-]{24,256}$/.test(response.token)) throw new DesktopBridgeError('The companion returned an invalid pairing session.');
  return response.token;
}
export async function desktopStatus(token: string, signal?: AbortSignal): Promise<DesktopStatus> {
  const value = await request('/status', token, undefined, signal);
  if (typeof value.enabled !== 'boolean' || !Number.isSafeInteger(value.observations) || Number(value.observations) < 0 || Number(value.observations) > 5_000
    || (value.browserTopics !== undefined && typeof value.browserTopics !== 'boolean')) throw new DesktopBridgeError('The companion returned an invalid status.');
  const states = ['waiting', 'paused', 'locked', 'idle', 'self', 'unsupported', 'browser_off', 'filtered', 'eligible', 'unavailable', 'error'];
  const date = (v: unknown) => typeof v === 'string' && Number.isFinite(Date.parse(v)) ? v : null;
  return { enabled: value.enabled, observations: Number(value.observations), browserTopics: value.browserTopics === true,
    sampleState: typeof value.sampleState === 'string' && states.includes(value.sampleState) ? value.sampleState : undefined,
    lastSampleAt: date(value.lastSampleAt), lastClueAt: date(value.lastClueAt) };
}
export async function setDesktopCapture(token: string, enabled: boolean, browserTopics: boolean, signal?: AbortSignal): Promise<void> {
  await request('/capture', token, { enabled, browserTopics }, signal);
}
export async function desktopObservations(token: string, signal?: AbortSignal): Promise<MargloPackage> {
  const value = await request('/observations', token, undefined, signal);
  try { return parseMargloPackage(JSON.stringify(value)); }
  catch { throw new DesktopBridgeError('The companion returned invalid observations. Nothing was handed over.'); }
}
export async function clearDesktopObservations(token: string, signal?: AbortSignal): Promise<void> {
  await request('/clear', token, {}, signal);
}
export async function disconnectDesktopObserver(token: string, signal?: AbortSignal): Promise<void> {
  await request('/disconnect', token, {}, signal);
}
