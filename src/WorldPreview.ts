import type { WorldSettingsValue } from './WorldSettings';

const KEY = 'mirrorville-world-settings-preview-v1/';
const defaults: WorldSettingsValue = { name: 'Mirrorville', description: '', allowStrangers: false, maxMembers: 20 };

function readStoredWorldPreview(worldId: string): WorldSettingsValue | undefined {
  try {
    const value = JSON.parse(localStorage.getItem(KEY + worldId) ?? 'null');
    if (value && typeof value.name === 'string' && value.name.trim() && value.name.length <= 40
      && typeof value.description === 'string' && value.description.length <= 240
      && typeof value.allowStrangers === 'boolean'
      && Number.isSafeInteger(value.maxMembers) && value.maxMembers >= 1 && value.maxMembers <= 100) {
      return { name: value.name.trim(), description: value.description, allowStrangers: value.allowStrangers, maxMembers: value.maxMembers };
    }
  } catch { /* Missing, blocked or invalid local preview storage uses the defaults. */ }
  return undefined;
}

export function readWorldPreview(worldId: string): WorldSettingsValue {
  return readStoredWorldPreview(worldId) ?? { ...defaults };
}

export function readPreviewWorlds(worldIds: readonly string[]): Record<string, WorldSettingsValue> {
  const worlds: Record<string, WorldSettingsValue> = { town: readWorldPreview('town') };
  for (const id of worldIds) {
    if (id === 'town') continue;
    const value = readStoredWorldPreview(id);
    if (value) worlds[id] = value;
  }
  return worlds;
}

export function saveWorldPreview(worldId: string, value: WorldSettingsValue): void {
  // Preview preferences only. These values do not authorize access to the live town.
  localStorage.setItem(KEY + worldId, JSON.stringify(value));
}
