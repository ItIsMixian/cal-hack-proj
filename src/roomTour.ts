import { TOUR_STATIONS, type RoomStation } from './roomJourneyMath';

export type RoomTour = { version: 1; name: string; look: number; station: RoomStation; mirrorId: string | null };
export const roomTourKey = (owner: string, database: string) => owner ? `mirrorville-room-tour-v1/${database}/${owner}` : '';
export function readRoomTour(key: string, storage: Pick<Storage, 'getItem'> = localStorage): RoomTour | null {
  if (!key) return null;
  try {
    const value = JSON.parse(storage.getItem(key) ?? 'null');
    if (!value || value.version !== 1 || typeof value.name !== 'string' || !value.name.trim() || value.name.length > 24
      || !Number.isInteger(value.look) || value.look < 0 || value.look > 7
      || !TOUR_STATIONS.includes(value.station)
      || !(value.mirrorId === null || (typeof value.mirrorId === 'string' && /^\d+$/.test(value.mirrorId)))) return null;
    return value;
  } catch { return null; }
}
export function saveRoomTour(key: string, value: RoomTour | null, storage: Pick<Storage, 'setItem' | 'removeItem'> = localStorage) {
  if (!key) return;
  try { if (value) storage.setItem(key, JSON.stringify(value)); else storage.removeItem(key); } catch { /* Current visit remains usable. */ }
}
