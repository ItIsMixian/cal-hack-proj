export type DiaryHistory = { all: bigint; mirrors: ReadonlyMap<bigint, bigint> };
type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;
const KEY = 'mirrorville-diary-closed-v1/';
const memory = new Map<string, DiaryHistory>();

function timestamp(value: unknown): bigint {
  try { return typeof value === 'string' && /^\d+$/u.test(value) ? BigInt(value) : 0n; }
  catch { return 0n; }
}

function browserStorage(): StorageLike | undefined {
  try { return localStorage; } catch { return undefined; }
}

export function readDiaryHistory(owner: string, storage = browserStorage()): DiaryHistory {
  const cached = memory.get(owner) ?? { all: 0n, mirrors: new Map<bigint, bigint>() };
  try {
    const raw = JSON.parse(storage?.getItem(KEY + owner) ?? '{}');
    const all = timestamp(raw?.all);
    const mirrors = new Map(cached.mirrors);
    for (const [id, value] of Object.entries(raw?.mirrors ?? {})) {
      if (!/^\d+$/u.test(id)) continue;
      const at = timestamp(value), mirrorId = BigInt(id);
      if (at > (mirrors.get(mirrorId) ?? 0n)) mirrors.set(mirrorId, at);
    }
    return { all: all > cached.all ? all : cached.all, mirrors };
  } catch { return cached; }
}

export function diaryCutoff(history: DiaryHistory, mirrorId: bigint): bigint {
  const own = history.mirrors.get(mirrorId) ?? 0n;
  return own > history.all ? own : history.all;
}

export function closeDiary(owner: string, mirrorId: bigint | undefined, at: bigint,
  storage = browserStorage()): void {
  const history = readDiaryHistory(owner, storage);
  const mirrors = new Map(history.mirrors);
  let all = history.all;
  if (mirrorId === undefined) {
    if (at > all) all = at;
  } else if (at > (mirrors.get(mirrorId) ?? 0n)) mirrors.set(mirrorId, at);
  const next = { all, mirrors };
  memory.set(owner, next);
  try {
    storage?.setItem(KEY + owner, JSON.stringify({ all: String(all),
      mirrors: Object.fromEntries([...mirrors].map(([id, value]) => [String(id), String(value)])) }));
  } catch { /* Keep the cutoff for this session when browser storage is unavailable. */ }
}
