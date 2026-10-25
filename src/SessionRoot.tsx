import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AuthProvider, useAuth } from 'react-oidc-context';
import { WebStorageStateStore } from 'oidc-client-ts';
import { SpacetimeDBProvider, useReducer, useSpacetimeDB } from 'spacetimedb/react';
import { DbConnection, reducers } from './module_bindings';
import { prepareGuestTransfer } from './guestTransfer';
import App from './App';
import LoginScreen from './LoginScreen';
import { consumeMobileShare, forgetMobileShare, parseMobileShareFragment, rememberMobileShare, restoreMobileShare, type MobileShareDraft } from './mobileShare';
import './mobile-share.css';
import { migrateOidcUser, readSessionMode, writeSessionMode } from './sessionPersistence';

const configuredHost = new URL(import.meta.env.VITE_SPACETIMEDB_HOST ?? 'ws://localhost:3000');
// A teammate opening the LAN URL must connect to this machine, not their own localhost.
if (['localhost', '127.0.0.1', '[::1]'].includes(configuredHost.hostname)
  && !['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)) {
  if (window.location.protocol === 'https:') {
    configuredHost.protocol = 'wss:';
    configuredHost.host = window.location.host;
    configuredHost.port = window.location.port;
  } else configuredHost.hostname = window.location.hostname;
}
const HOST = configuredHost.origin;
const DB_NAME = import.meta.env.VITE_SPACETIMEDB_DB_NAME ?? 'mirrorville';
// Preserve existing anonymous identities and their mirrors.
const GUEST_TOKEN_KEY = `${HOST}/${DB_NAME}/auth_token`;
const MODE_KEY = `${HOST}/${DB_NAME}/session_mode`;
const CLIENT_ID = import.meta.env.VITE_SPACETIMEAUTH_CLIENT_ID?.trim();
const APP_BASE = import.meta.env.BASE_URL ?? '/';
const AUTHORITY = import.meta.env.VITE_SPACETIMEAUTH_AUTHORITY ?? 'https://auth.spacetimedb.com/oidc';
if (CLIENT_ID) migrateOidcUser(localStorage, sessionStorage, AUTHORITY, CLIENT_ID);
const accountUserStore = new WebStorageStateStore({ store: localStorage });
type Mode = 'guest' | 'account' | null;
type SharedSession = { mobileShare: MobileShareDraft | null; discardShare: () => void; keepShareForSignIn: () => void };

function readStorage(storage: Storage, key: string) {
  try { return storage.getItem(key) ?? undefined; } catch { return undefined; }
}
function saveMode(mode: Mode) {
  writeSessionMode(localStorage, sessionStorage, MODE_KEY, mode);
  if (mode === null) void window.mirrorvilleDesktop?.request('pause').catch(() => {});
}
function initialMode(): Mode {
  // Magic links can open a fresh tab, without the initiating tab's sessionStorage.
  if (window.location.pathname === `${APP_BASE}callback` && new URLSearchParams(window.location.search).has('state')) return 'account';
  return readSessionMode(localStorage, sessionStorage, MODE_KEY);
}

export default function SessionRoot() {
  const [shared, setShared] = useState<{ draft: MobileShareDraft | null; error: string }>(() => {
    // Pure on purpose: StrictMode may call this initializer twice. Clear history only after mount.
    try { return { draft: parseMobileShareFragment(window.location.hash ?? ''), error: '' }; }
    catch (e) { return { draft: null, error: e instanceof Error ? e.message : 'This shared item could not be opened.' }; }
  });
  const discardShare = () => { forgetMobileShare(sessionStorage); setShared({ draft: null, error: '' }); };
  const keepShareForSignIn = () => {
    if (!shared.draft) return;
    try { rememberMobileShare(shared.draft, sessionStorage); }
    catch { setShared(value => ({ ...value, error: 'This browser cannot retain the draft during email sign-in. Return here or share it again afterwards.' })); }
  };
  useEffect(() => {
    const receive = () => {
      try { const draft = consumeMobileShare(window.location, window.history); if (draft) { forgetMobileShare(sessionStorage); setShared({ draft, error: '' }); return true; } }
      catch (e) { forgetMobileShare(sessionStorage); setShared({ draft: null, error: e instanceof Error ? e.message : 'This shared item could not be opened.' }); return true; }
      return false;
    };
    if (!receive() && !shared.draft && !shared.error) { const draft = restoreMobileShare(sessionStorage); if (draft) setShared({ draft, error: '' }); }
    const changed = () => { receive(); };
    window.addEventListener('hashchange', changed);
    return () => window.removeEventListener('hashchange', changed);
  }, []);
  const shareProps: SharedSession = { mobileShare: shared.draft, discardShare, keepShareForSignIn };
  const arrival = shared.draft || shared.error ? <aside className="mobile-share-arrival" aria-label="Shared iPhone item">
    <p role={shared.error ? 'alert' : 'status'}>{shared.error || 'A shared item is waiting. Nothing has been imported. Sign in or explore as a guest, then choose Review shared item in town.'}</p>
    {shared.draft && <small>If you choose email sign-in, a redacted draft stays in this browser tab for up to 15 minutes. If sign-in opens a different tab, return here or share again.</small>}
    <button onClick={discardShare}>Discard shared item</button>
  </aside> : null;
  if (!CLIENT_ID) return <>{arrival}<GuestOnlyGateway {...shareProps} /></>;
  return <>{arrival}<AuthProvider authority={AUTHORITY} client_id={CLIENT_ID}
    redirect_uri={import.meta.env.VITE_SPACETIMEAUTH_REDIRECT_URI ?? `${window.location.origin}${APP_BASE}callback`}
    post_logout_redirect_uri={`${window.location.origin}${APP_BASE}`} response_type="code" scope="openid profile email offline_access"
    automaticSilentRenew userStore={accountUserStore}
    onSigninCallback={() => { saveMode('account'); window.history.replaceState({}, document.title, APP_BASE); }}>
    <AccountGateway {...shareProps} />
  </AuthProvider></>;
}

function GuestOnlyGateway(share: SharedSession) {
  const [guest, setGuest] = useState(() => initialMode() === 'guest');
  const [error, setError] = useState('');
  if (guest) return <WorldSession {...share} mode="guest" onExit={() => { share.discardShare(); localStorage.removeItem(GUEST_TOKEN_KEY); saveMode(null); setGuest(false); }} />;
  return <LoginScreen error={error}
    onAccount={async () => setError('Account sign-in is not ready yet. You can explore as a guest for now.')}
    onGuest={() => { saveMode('guest'); setGuest(true); }} />;
}

function AccountGateway(share: SharedSession) {
  const auth = useAuth();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const restoreAttempted = useRef(false);
  useEffect(() => {
    if (mode !== 'account' || auth.isLoading || auth.activeNavigator || auth.isAuthenticated
      || !auth.user || restoreAttempted.current) return;
    restoreAttempted.current = true;
    setRestoring(true);
    void auth.signinSilent().catch(() => {
      setError('Your saved session could not be renewed. Please sign in again.');
    }).finally(() => setRestoring(false));
  }, [mode, auth.isLoading, auth.activeNavigator, auth.isAuthenticated, auth.user, auth.signinSilent]);
  const refresh = useCallback(async () => {
    const user = await auth.signinSilent();
    if (!user?.id_token) throw new Error('Account session expired');
    return user.id_token;
  }, [auth.signinSilent]);
  const chooseMode = (next: Mode) => { saveMode(next); setMode(next); };
  const leave = async () => {
    share.discardShare();
    if (mode === 'guest') { localStorage.removeItem(GUEST_TOKEN_KEY); chooseMode(null); return; }
    const idToken = auth.user?.id_token;
    chooseMode(null);
    await auth.removeUser();
    try { await auth.signoutRedirect({ id_token_hint: idToken }); }
    catch { setError('You have signed out of this browser. The sign-in service could not be reached.'); }
  };
  const signIn = async () => {
    setError(''); setRedirecting(true);
    try {
      share.keepShareForSignIn();
      await prepareGuestTransfer(HOST, DB_NAME);
      chooseMode('account');
      await auth.signinRedirect();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open secure sign-in. Please try again.');
      if (mode === 'guest') throw e;
    }
    finally { setRedirecting(false); }
  };
  if (mode === 'guest') return <WorldSession {...share} mode="guest" onExit={() => void leave()} onSignIn={signIn} />;
  if (mode === 'account' && (auth.isLoading || restoring || auth.activeNavigator === 'signinSilent'
    || (!!auth.user && !auth.isAuthenticated && !restoreAttempted.current))) {
    return <section className="connection-error" role="status"><h1>Returning to Mirrorville</h1><p>Restoring your signed-in session…</p></section>;
  }
  if (mode === 'account' && auth.isAuthenticated && auth.user?.id_token) {
    if (!auth.user.profile.email || auth.user.profile.email_verified !== true) {
      return <LoginScreen error="Use a verified email account to sign in, or choose guest mode."
        onAccount={signIn} onGuest={() => chooseMode('guest')} />;
    }
    return <WorldSession {...share} key={auth.user.profile.sub} mode="account" token={auth.user.id_token}
      label={auth.user.profile.email ?? auth.user.profile.name ?? 'Signed in'} refresh={refresh} onExit={() => void leave()} />;
  }
  return <LoginScreen busy={auth.isLoading || !!auth.activeNavigator || redirecting}
    error={error || (auth.error ? 'Secure sign-in did not complete. Please try again.' : '')}
    onAccount={signIn} onGuest={() => { setError(''); chooseMode('guest'); }} />;
}

function WorldSession({ mode, token, label, refresh, onExit, onSignIn, mobileShare, discardShare }: SharedSession & {
  mode: 'guest' | 'account'; token?: string; label?: string; refresh?: () => Promise<string>; onExit: () => void; onSignIn?: () => Promise<void>;
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
    <TransferGate accountMode={mode === 'account'} onExit={onExit}>
      <App mobileShare={mobileShare} onDiscardShare={discardShare} sessionLabel={mode === 'guest' ? 'Guest' : label ?? 'Signed in'} onExit={onExit} accountMode={mode === 'account'} onSignIn={onSignIn} />
    </TransferGate>
  </SpacetimeDBProvider>;
}

function TransferGate({ accountMode, onExit, children }: { accountMode: boolean; onExit: () => void; children: React.ReactNode }) {
  const { isActive } = useSpacetimeDB();
  const claim = useReducer(reducers.claimGuestMirrors);
  const key = `${HOST}/${DB_NAME}/guest_transfer`;
  const [pending, setPending] = useState(() => accountMode ? readStorage(localStorage, key) : undefined);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!isActive || !pending) return;
    let cancelled = false;
    claim({ token: pending }).then(() => {
      if (cancelled) return;
      if (readStorage(localStorage, key) === pending) localStorage.removeItem(key);
      setPending(undefined);
    }).catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : String(e)); });
    return () => { cancelled = true; };
  }, [isActive, pending, claim, key, attempt]);
  if (!pending) return children;
  return <section className="connection-error"><h1>Bringing your guest mirror with you</h1>
    <p>{error || 'Your mirror, cards and diary will stay together.'}</p>
    {error && <><button onClick={() => { setError(''); setAttempt(n => n + 1); }}>Try again</button><button onClick={onExit}>Back to login</button></>}
  </section>;
}
