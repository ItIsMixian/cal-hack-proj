export type SessionMode = 'guest' | 'account' | null;

export function readSessionMode(persistent: Storage, legacy: Storage, key: string): SessionMode {
  let value: string | null = null;
  try { value = persistent.getItem(key); } catch { /* Try the tab fallback. */ }
  if (value === null) {
    try {
      value = legacy.getItem(key);
      if (value === 'guest' || value === 'account') persistent.setItem(key, value);
    } catch { /* No saved mode or persistent storage unavailable. */ }
  }
  return value === 'guest' || value === 'account' ? value : null;
}

export function writeSessionMode(persistent: Storage, legacy: Storage, key: string, mode: SessionMode) {
  for (const storage of [persistent, legacy]) {
    try { if (mode) storage.setItem(key, mode); else storage.removeItem(key); } catch { /* Storage can be unavailable. */ }
  }
}

// Migrate only this client's OIDC user; never copy share drafts or unrelated credentials.
export function migrateOidcUser(persistent: Storage, legacy: Storage, authority: string, clientId: string) {
  const key = `oidc.user:${authority}:${clientId}`;
  try {
    const value = legacy.getItem(key);
    if (!persistent.getItem(key) && value) persistent.setItem(key, value);
    legacy.removeItem(key);
  } catch { /* Keep the legacy record if migration cannot finish. */ }
}
