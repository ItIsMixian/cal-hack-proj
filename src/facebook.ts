import { redact } from '../spacetimedb/src/redact';

export type FacebookPost = { id: string; text: string; at: string; dateLabel: string };
type GraphResult = {
  id?: string; data?: unknown[]; paging?: { cursors?: { after?: string }; next?: string };
  error?: { code?: number };
};
export type FacebookSdk = {
  init(options: Record<string, unknown>): void;
  login(callback: (response: { authResponse?: { accessToken?: string; userID?: string }; status?: string }) => void, options: Record<string, unknown>): void;
  api(path: string, method: 'get', parameters: Record<string, unknown>, callback: (response: GraphResult) => void): void;
};
declare global { interface Window { FB?: FacebookSdk } }
let sdkLoad: Promise<FacebookSdk> | undefined;
let initializedFor = '';

// Load only after a deliberate visit to this source. No Facebook script on ordinary town visits.
export function loadFacebookSdk(appId: string, version: string): Promise<FacebookSdk> {
  if (!/^\d+$/.test(appId) || !/^v\d+\.0$/.test(version)) return Promise.reject(new Error('Facebook import is not configured yet.'));
  if (sdkLoad) return sdkLoad;
  sdkLoad = new Promise<FacebookSdk>((resolve, reject) => {
    let script: HTMLScriptElement | undefined;
    const fail = () => { clearTimeout(timer); script?.remove(); sdkLoad = undefined; reject(new Error('Facebook could not load. Check your connection or content blocker, then try again.')); };
    const ready = () => {
      clearTimeout(timer);
      if (!window.FB) { fail(); return; }
      try {
        if (initializedFor !== `${appId}:${version}`) {
          window.FB.init({ appId, version, cookie: false, status: false, xfbml: false, autoLogAppEvents: false });
          initializedFor = `${appId}:${version}`;
        }
        resolve(window.FB);
      } catch { fail(); }
    };
    const timer = setTimeout(fail, 15_000);
    if (window.FB) { ready(); return; }
    script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js'; script.async = true; script.crossOrigin = 'anonymous';
    script.onload = ready; script.onerror = fail; document.head.appendChild(script);
  });
  // A failed attempt must not poison later retries (including synchronous init failures).
  sdkLoad = sdkLoad.catch(error => { sdkLoad = undefined; throw error; });
  return sdkLoad;
}

function graph(sdk: FacebookSdk, path: string, parameters: Record<string, unknown>, signal?: AbortSignal): Promise<GraphResult> {
  return new Promise((resolve, reject) => {
    let done = false;
    const finish = (error?: Error, value?: GraphResult) => {
      if (done) return; done = true; clearTimeout(timer); signal?.removeEventListener('abort', abort);
      if (error) reject(error); else resolve(value!);
    };
    const abort = () => finish(new Error('Facebook import cancelled.'));
    const timer = setTimeout(() => finish(new Error('Facebook took too long to reply. Please try again.')), 20_000);
    if (signal?.aborted) { abort(); return; }
    signal?.addEventListener('abort', abort, { once: true });
    try {
      sdk.api(path, 'get', parameters, response => {
        if (!response || response.error) {
          finish(new Error(response?.error?.code === 190 ? 'Your Facebook access expired. Connect again.' : 'Facebook could not read your posts. Check the app permission and try again.'));
        } else finish(undefined, response);
      });
    } catch { finish(new Error('Facebook could not read your posts. Please try again.')); }
  });
}

export function ownFacebookPosts(rows: unknown[], ownerId: string, since: number, until: number): FacebookPost[] {
  const kept = new Map<string, FacebookPost>();
  for (const raw of rows) {
    if (!raw || typeof raw !== 'object') continue;
    const row = raw as Record<string, unknown>;
    const from = row.from as { id?: unknown } | undefined;
    // Only owner-authored text posts. Photos, link shares, tags and generated stories are excluded.
    if (from?.id !== ownerId || typeof row.id !== 'string' || typeof row.message !== 'string' || !row.message.trim()) continue;
    if (row.story || (Array.isArray(row.message_tags) ? row.message_tags.length > 0 : row.message_tags && Object.keys(row.message_tags).length > 0)) continue;
    const attachments = row.attachments as { data?: unknown[] } | undefined;
    if (attachments && (!Array.isArray(attachments.data) || attachments.data.length > 0)) continue;
    if (typeof row.created_time !== 'string') continue;
    const time = Date.parse(row.created_time);
    if (!Number.isFinite(time) || time < since || time > until) continue;
    const text = redact(row.message).trim().slice(0, 4_000);
    if (!text) continue;
    kept.set(row.id, { id: row.id, text, at: new Date(time).toISOString(), dateLabel: new Date(time).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' }) });
  }
  return [...kept.values()].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 100);
}

export function facebookLetter(posts: FacebookPost[]): { text: string; latestAt: string; included: number; characters: number } {
  if (!posts.length) return { text: '', latestAt: '', included: 0, characters: 0 };
  // Written-out dates survive the shared phone-number redactor, unlike ISO date strings.
  const blocks: string[] = [];
  let length = 0;
  const included: FacebookPost[] = [];
  let characters = 0;
  for (const post of posts) {
    const text = redact(post.text).trim().slice(0, 4_000);
    if (!text) continue;
    const block = `[Facebook own post · ${post.dateLabel}]\n${text}`;
    if (length + block.length + 2 > 29_000) break;
    blocks.push(block); included.push(post); length += block.length + 2; characters += text.length;
  }
  return { text: blocks.join('\n\n'), latestAt: included.map(post => post.at).sort().at(-1) ?? '', included: included.length, characters };
}

// Must be called directly inside the Connect button handler, after SDK loading, to keep the popup gesture.
export function readFacebookPosts(sdk: FacebookSdk, signal?: AbortSignal, now = Date.now()): Promise<FacebookPost[]> {
  return new Promise((resolve, reject) => {
    let done = false;
    const finish = (error?: Error, posts?: FacebookPost[]) => {
      if (done) return; done = true; clearTimeout(timer); signal?.removeEventListener('abort', abort);
      if (error) reject(error); else resolve(posts!);
    };
    const abort = () => finish(new Error('Facebook import cancelled.'));
    const timer = setTimeout(() => finish(new Error('Facebook sign-in was closed or took too long. Try again and allow the popup.')), 90_000);
    if (signal?.aborted) { abort(); return; }
    signal?.addEventListener('abort', abort, { once: true });
    try {
      sdk.login(response => {
        if (done) return;
        const token = response.authResponse?.accessToken, ownerId = response.authResponse?.userID;
        if (!token || !ownerId) { finish(new Error('Facebook connection cancelled. Nothing was imported.')); return; }
        clearTimeout(timer);
        void (async () => {
          const permissions = await graph(sdk, '/me/permissions', { access_token: token }, signal);
          if (!permissions.data?.some(value => { const permission = value as { permission?: string; status?: string }; return permission.permission === 'user_posts' && permission.status === 'granted'; })) throw new Error('Facebook did not grant access to your posts. You can still bring your own writing.');
          const me = await graph(sdk, '/me', { fields: 'id', access_token: token }, signal);
          if (me.id !== ownerId) throw new Error('The Facebook account changed. Please connect again.');
          const since = now - 90 * 86_400_000;
          const rows: unknown[] = []; let after: string | undefined;
          for (let page = 0; page < 5; page++) {
            const result = await graph(sdk, '/me/posts', { access_token: token, fields: 'id,from{id},message,created_time,message_tags,attachments{type}', limit: 25, since: Math.floor(since / 1000), until: Math.floor(now / 1000), ...(after ? { after } : {}) }, signal);
            if (!Array.isArray(result.data)) throw new Error('Facebook returned an unreadable post list. Please try again.');
            rows.push(...result.data);
            const next = result.paging?.cursors?.after;
            if (!result.paging?.next || !next || next === after || next.length > 2_048) break;
            after = next; // Never follow paging.next: it may contain credentials or a different host.
          }
          finish(undefined, ownFacebookPosts(rows, ownerId, since, now));
        })().catch(error => finish(error instanceof Error ? error : new Error('Facebook import failed. Please try again.')));
      }, { scope: 'public_profile,user_posts', return_scopes: true, auth_type: 'rerequest' });
    } catch { finish(new Error('Facebook sign-in could not open. Allow the popup and try again.')); }
  });
}
