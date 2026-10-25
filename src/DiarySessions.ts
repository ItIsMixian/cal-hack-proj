import type { DiaryItem } from './module_bindings/types';

export const DIARY_MERGE_WINDOW_US = 30n * 60n * 1_000_000n;
export type DiarySession = { entries: [DiaryItem, ...DiaryItem[]] };

export function diarySessions(entries: readonly DiaryItem[]): DiarySession[] {
  const sorted = [...entries].sort((a, b) => a.createdAt.microsSinceUnixEpoch > b.createdAt.microsSinceUnixEpoch ? -1
    : a.createdAt.microsSinceUnixEpoch < b.createdAt.microsSinceUnixEpoch ? 1 : 0);
  const sessions: DiarySession[] = [];
  const previous = new Map<string, DiarySession>();
  for (const entry of sorted) {
    const pair = `${entry.mirrorId}:${entry.otherName}`;
    const session = previous.get(pair);
    const latest = session?.entries[0];
    // Bound the whole visit, so a chain of short gaps cannot merge hours of notes.
    // An intervening venue change starts a separate visit for this mirror/person pair.
    if (session && latest && latest.place === entry.place
      && latest.createdAt.microsSinceUnixEpoch - entry.createdAt.microsSinceUnixEpoch <= DIARY_MERGE_WINDOW_US) {
      session.entries.push(entry);
    } else {
      const next: DiarySession = { entries: [entry] };
      sessions.push(next);
      previous.set(pair, next);
    }
  }
  return sessions;
}
