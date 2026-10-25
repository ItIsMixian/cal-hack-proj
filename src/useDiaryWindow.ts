import { useEffect, useMemo, useRef } from 'react';
import { closeDiary, readDiaryHistory } from './DiaryHistory';

export const DIARY_CLOSED_EVENT = 'mirrorville-diary-closed';

export function useDiaryWindow(owner: string | undefined, mirrorId?: bigint) {
  // Freeze the previous close boundary while this window is open. New subscription
  // records may appear, but reading them must never clear the current view.
  const history = useMemo(() => readDiaryHistory(owner ?? ''), [owner, mirrorId]);
  const generation = useRef<{ owner?: string; mirrorId?: bigint } | null>(null);
  useEffect(() => {
    const current = { owner, mirrorId };
    generation.current = current;
    if (!owner) return;
    let saved = false;
    const save = (at: bigint) => {
      if (saved) return;
      saved = true;
      closeDiary(owner, mirrorId, at);
      window.dispatchEvent(new Event(DIARY_CLOSED_EVENT));
    };
    const pageHide = () => save(BigInt(Date.now()) * 1000n);
    window.addEventListener('pagehide', pageHide);
    return () => {
      window.removeEventListener('pagehide', pageHide);
      const at = BigInt(Date.now()) * 1000n;
      // StrictMode replays effect setup/cleanup in development. Only a real
      // unmount (close button, Escape, backdrop, room exit) advances the cutoff.
      queueMicrotask(() => {
        const next = generation.current;
        if (next === current || next?.owner !== owner || next?.mirrorId !== mirrorId) save(at);
      });
    };
  }, [owner, mirrorId]);
  return history;
}
