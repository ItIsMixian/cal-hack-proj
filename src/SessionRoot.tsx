import { useCallback, useMemo, useState } from 'react';
import { AuthProvider, useAuth } from 'react-oidc-context';
import { WebStorageStateStore } from 'oidc-client-ts';
import { SpacetimeDBProvider } from 'spacetimedb/react';
import { DbConnection } from './module_bindings';
import App from './App';
import LoginScreen from './LoginScreen';

const HOST = import.meta.env.VITE_SPACETIMEDB_HOST ?? 'ws://localhost:3000';
const DB_NAME = import.meta.env.VITE_SPACETIMEDB_DB_NAME ?? 'mirrorville';
// Preserve existing anonymous identities and their mirrors.
const GUEST_TOKEN_KEY = `${HOST}/${DB_NAME}/auth_token`;
const MODE_KEY = `${HOST}/${DB_NAME}/session_mode`;
const CLIENT_ID = import.meta.env.VITE_SPACETIMEAUTH_CLIENT_ID?.trim();
const AUTHORITY = import.meta.env.VITE_SPACETIMEAUTH_AUTHORITY ?? 'https://auth.spacetimedb.com/oidc';
type Mode = 'guest' | 'account' | null;

function readStorage(storage: Storage, key: string) {
  try { return storage.getItem(key) ?? undefined; } catch { return undefined; }
}
function saveMode(mode: Mode) {
  try { if (mode) sessionStorage.setItem(MODE_KEY, mode); else sessionStorage.removeItem(MODE_KEY); } catch { /* tab-only mode */ }
}
function initialMode(): Mode {
  // Magic links can open a fresh tab, without the initiating tab's sessionStorage.
  if (window.location.pathname === '/callback' && new URLSearchParams(window.location.search).has('state')) return 'account';
  const value = readStorage(sessionStorage, MODE_KEY);
  return value === 'guest' || value === 'account' ? value : null;
}

export default function SessionRoot() {
  if (!CLIENT_ID) return <GuestOnlyGateway />;
  return <AuthProvider authority={AUTHORITY} client_id={CLIENT_ID}
    redirect_uri={import.meta.env.VITE_SPACETIMEAUTH_REDIRECT_URI ?? `${window.location.origin}/callback`}
    post_logout_redirect_uri={window.location.origin} response_type="code" scope="openid profile email offline_access"
    automaticSilentRenew userStore={new WebStorageStateStore({ store: sessionStorage })}
    onSigninCallback={() => { saveMode('account'); window.history.replaceState({}, document.title, '/'); }}>
    <AccountGateway />
  </AuthProvider>;
}

function GuestOnlyGateway() {
  const [guest, setGuest] = useState(() => initialMode() === 'guest');
  const [error, setError] = useState('');
  if (guest) return <WorldSession mode="guest" onExit={() => { saveMode(null); setGuest(false); }} />;
  return <LoginScreen error={error}
    onAccount={async () => setError('Account sign-in is not ready yet. You can explore as a guest for now.')}
    onGuest={() => { saveMode('guest'); setGuest(true); }} />;
}

function AccountGateway() {
  const auth = useAuth();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false);
  const refresh = useCallback(async () => {
    const user = await auth.signinSilent();
    if (!user?.id_token) throw new Error('Account session expired');
    return user.id_token;
  }, [auth.signinSilent]);
  const chooseMode = (next: Mode) => { saveMode(next); setMode(next); };
  const leave = async () => {
    if (mode === 'guest') { chooseMode(null); return; }
    const idToken = auth.user?.id_token;
    chooseMode(null);
    await auth.removeUser();
    try { await auth.signoutRedirect({ id_token_hint: idToken }); }
    catch { setError('You have signed out of this browser. The sign-in service could not be reached.'); }
  };
  const signIn = async (email: string) => {
    setError(''); setRedirecting(true);
    try {
      chooseMode('account');
      await auth.signinRedirect({ prompt: 'login', login_hint: email || undefined });
    } catch { setError('Could not open secure sign-in. Please try again.'); }
    finally { setRedirecting(false); }
  };
  if (mode === 'guest') return <WorldSession mode="guest" onExit={() => void leave()} />;
  if (mode === 'account' && auth.isAuthenticated && auth.user?.id_token) {
    if (!auth.user.profile.email || auth.user.profile.email_verified === false) {
      return <LoginScreen error="Use a verified email account to sign in, or choose guest mode."
        onAccount={signIn} onGuest={() => chooseMode('guest')} />;
    }
    return <WorldSession key={auth.user.profile.sub} mode="account" token={auth.user.id_token}
      label={auth.user.profile.email ?? auth.user.profile.name ?? 'Signed in'} refresh={refresh} onExit={() => void leave()} />;
  }
  return <LoginScreen busy={auth.isLoading || !!auth.activeNavigator || redirecting}
    error={error || (auth.error ? 'Secure sign-in did not complete. Please try again.' : '')}
    onAccount={signIn} onGuest={() => { setError(''); chooseMode('guest'); }} />;
}

function WorldSession({ mode, token, label, refresh, onExit }: {
  mode: 'guest' | 'account'; token?: string; label?: string; refresh?: () => Promise<string>; onExit: () => void;
}) {
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState(false);
  const connectionBuilder = useMemo(() => {
    if (mode === 'account' && !token) throw new Error('Account token required');
    const builder = DbConnection.builder().withUri(HOST).withDatabaseName(DB_NAME)
      .withToken(mode === 'guest' ? readStorage(localStorage, GUEST_TOKEN_KEY) : token)
      .withAutomaticReconnect()
      .onConnect(() => setError(false))
      .onConnectError(() => setError(true));
    if (mode === 'guest') builder.onConnect((_connection, _identity, guestToken) => {
      try { localStorage.setItem(GUEST_TOKEN_KEY, guestToken); } catch { /* connection-only identity */ }
    });
    if (refresh) builder.withTokenProvider(refresh);
    return builder;
  }, [mode, token, attempt, refresh]);
  if (error) return <section className="connection-error">
    <h1>We couldn't reach the town</h1><p>Your session has not been changed. Try connecting again.</p>
    <button onClick={() => { setError(false); setAttempt(value => value + 1); }}>Try again</button>
    <button onClick={onExit}>Back to login</button>
  </section>;
  return <SpacetimeDBProvider key={`${mode}-${attempt}`} connectionBuilder={connectionBuilder}>
    <App sessionLabel={mode === 'guest' ? 'Guest' : label ?? 'Signed in'} onExit={onExit} accountMode={mode === 'account'} />
  </SpacetimeDBProvider>;
}
