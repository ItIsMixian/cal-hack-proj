import { redact } from '../spacetimedb/src/redact';

export type GitHubPiece = { id: string; kind: 'background' | 'activity'; text: string; at: string; dateLabel: string };
export type GitHubMaterial = { login: string; pieces: GitHubPiece[] };
type Row = Record<string, unknown>;
const object = (value: unknown): Row => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Row : {};
const clean = (value: unknown, length = 500) => typeof value === 'string' ? redact(value).trim().slice(0, length) : '';
const dateLabel = (at: string) => new Date(at).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' });

export function githubUsername(value: string): string {
  const text = value.trim();
  let name = text;
  if (/^https?:\/\//i.test(text)) {
    let url: URL;
    try { url = new URL(text); } catch { throw new Error('Enter your GitHub username or profile URL.'); }
    if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.username || url.password || url.port || url.search || url.hash) throw new Error('Use an https://github.com/username profile URL.');
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length !== 1) throw new Error('Use your profile URL, not a repository URL.');
    name = parts[0];
  }
  if (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(name) || name.includes('--')) throw new Error('Enter a valid GitHub username.');
  return name;
}

// Public metadata describes a repository, never the owner's sole contribution or personal skill.
export function githubPieces(user: unknown, repositories: unknown[], events: unknown[], now = Date.now()): GitHubMaterial {
  const person = object(user);
  if (typeof person.login !== 'string' || typeof person.id !== 'number' || person.type !== 'User') throw new Error('Choose a personal GitHub account, not an organization.');
  const login = githubUsername(person.login), pieces: GitHubPiece[] = [];
  const ids = new Set<string>();
  for (const raw of repositories.slice(0, 50)) {
    const repo = object(raw), owner = object(repo.owner);
    if (owner.id !== person.id || owner.login !== login || repo.private !== false || repo.fork !== false || typeof repo.id !== 'number' || typeof repo.name !== 'string') continue;
    const id = `repo:${repo.id}`;
    if (ids.has(id)) continue;
    ids.add(id);
    const name = clean(repo.name, 100), description = clean(repo.description, 800), language = clean(repo.language, 80);
    const at = typeof repo.created_at === 'string' && Number.isFinite(Date.parse(repo.created_at)) && Date.parse(repo.created_at) <= now ? new Date(repo.created_at).toISOString() : '';
    pieces.push({ id, kind: 'background', at, dateLabel: at ? dateLabel(at) : 'Creation date unknown', text: `My public GitHub account hosts the non-fork repository "${name}".${description ? ` Repository description: ${description}` : ''}${language ? ` Main repository language: ${language}.` : ''} This is project background; repository ownership alone does not establish my role, skill level, completion, or recent activity.` });
  }
  for (const raw of events.slice(0, 100)) {
    const event = object(raw), actor = object(event.actor), repo = object(event.repo), payload = object(event.payload);
    if (actor.id !== person.id || typeof actor.login !== 'string' || actor.login.toLowerCase() !== login.toLowerCase() || event.public !== true || typeof event.id !== 'string' || typeof event.created_at !== 'string' || typeof repo.name !== 'string') continue;
    const time = Date.parse(event.created_at);
    if (!Number.isFinite(time) || time > now || time < now - 30 * 86_400_000) continue;
    let action = '';
    if (event.type === 'PushEvent') action = 'pushed commits';
    if (event.type === 'PullRequestEvent' && ['opened', 'closed', 'reopened'].includes(String(payload.action))) action = `${payload.action} a pull request`;
    if (event.type === 'IssuesEvent' && ['opened', 'closed', 'reopened'].includes(String(payload.action))) action = `${payload.action} an issue`;
    if (event.type === 'CreateEvent' && ['repository', 'branch', 'tag'].includes(String(payload.ref_type))) action = `created a ${payload.ref_type}`;
    if (!action || ids.has(`event:${event.id}`)) continue;
    ids.add(`event:${event.id}`);
    const at = new Date(time).toISOString();
    pieces.push({ id: `event:${event.id}`, kind: 'activity', at, dateLabel: dateLabel(at), text: `My GitHub account ${action} in ${clean(repo.name, 150)}. This records an account action, not a completed project or the contents of anyone else's work.` });
  }
  return { login, pieces };
}

export function githubLetter(pieces: GitHubPiece[]): { text: string; latestAt: string; characters: number; included: number } {
  const blocks: string[] = [], activityDates: string[] = [];
  let characters = 0, length = 0;
  // Recent actions must not disappear behind a large portfolio when the letter reaches its cap.
  const ordered = [...pieces].sort((a, b) => a.kind === b.kind ? b.at.localeCompare(a.at) : a.kind === 'activity' ? -1 : 1);
  for (const piece of ordered) {
    const body = redact(piece.text).trim().slice(0, 2_000);
    if (!body) continue;
    const block = `[GitHub ${piece.kind === 'activity' ? 'account action' : 'project background, not a recent event'} · ${piece.dateLabel}]\n${body}`;
    if (length + block.length + 2 > 29_000) break;
    blocks.push(block); length += block.length + 2; characters += body.length;
    if (piece.kind === 'activity' && piece.at) activityDates.push(piece.at);
  }
  return { text: blocks.join('\n\n'), latestAt: activityDates.sort().at(-1) ?? '', characters, included: blocks.length };
}

async function githubGet(path: string, signal?: AbortSignal, request: typeof fetch = fetch): Promise<unknown> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) throw new Error('GitHub lookup cancelled.');
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, 15_000);
  try {
    const response = await request(`https://api.github.com${path}`, { method: 'GET', headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }, credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer', signal: controller.signal });
    if (response.status === 404) throw new Error('That public GitHub account could not be found.');
    if (response.status === 403 || response.status === 429) throw new Error('GitHub public API access is limited right now. Wait before trying again; no private token is needed.');
    if (!response.ok) throw new Error('GitHub could not return your public activity. Please try again later.');
    const text = await response.text();
    if (text.length > 2_000_000) throw new Error('GitHub returned too much data. Nothing was imported.');
    try { return JSON.parse(text); } catch { throw new Error('GitHub returned an unreadable response.'); }
  } catch (error) {
    if (controller.signal.aborted) throw new Error(signal?.aborted ? 'GitHub lookup cancelled.' : 'GitHub took too long to reply. Please try again.');
    if (error instanceof Error && (error.message.startsWith('GitHub') || error.message.startsWith('That public'))) throw error;
    throw new Error('GitHub could not be reached. Check your connection and try again.');
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
}

export async function readGitHub(value: string, signal?: AbortSignal, request: typeof fetch = fetch, now = Date.now()): Promise<GitHubMaterial> {
  const name = githubUsername(value);
  const user = await githubGet(`/users/${encodeURIComponent(name)}`, signal, request);
  const profile = object(user);
  if (typeof profile.login !== 'string' || profile.login.toLowerCase() !== name.toLowerCase() || profile.type !== 'User') throw new Error('Choose a personal GitHub account, not an organization.');
  const [repos, events] = await Promise.all([
    githubGet(`/users/${encodeURIComponent(name)}/repos?type=owner&sort=pushed&per_page=50&page=1`, signal, request),
    githubGet(`/users/${encodeURIComponent(name)}/events/public?per_page=100&page=1`, signal, request),
  ]);
  if (!Array.isArray(repos) || !Array.isArray(events)) throw new Error('GitHub returned an unreadable activity list.');
  return githubPieces(user, repos, events, now);
}
