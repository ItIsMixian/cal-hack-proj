// Proof is issued using the saved guest credential, never a client-supplied owner.
// Local storage allows an email magic link to return in a fresh same-origin tab.
export async function prepareGuestTransfer(host: string, database: string) {
  const key = `${host}/${database}/guest_transfer`;
  const guest = localStorage.getItem(`${host}/${database}/auth_token`);
  if (!guest) return;
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
  // Save before issuing the capability: unavailable storage must not strand it.
  localStorage.setItem(key, token);
  const base = host.replace(/^ws/, 'http');
  try {
    const result = await fetch(`${base}/v1/database/${encodeURIComponent(database)}/call/prepare_guest_transfer`, {
      method: 'POST', headers: { Authorization: `Bearer ${guest}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([token]),
    });
    if (!result.ok) throw new Error('Transfer preparation failed');
  } catch {
    if (localStorage.getItem(key) === token) localStorage.removeItem(key);
    throw new Error('Could not prepare your guest mirror. Return to guest mode and try again.');
  }
}
