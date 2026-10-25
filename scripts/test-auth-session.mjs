import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const guestKey = 'ws://localhost:3000/mirrorville/auth_token';
const modeKey = 'ws://localhost:3000/mirrorville/session_mode';
const persistence = {};
runInNewContext(ts.transpileModule(readFileSync(new URL('../src/sessionPersistence.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: persistence });
const account = { id_token: 'verified-oidc-token', profile: { sub: 'account-a', email: 'account@example.test', email_verified: true } };
function storage(values = {}) {
  const valuesMap = new Map(Object.entries(values));
  return { getItem: key => valuesMap.get(key) ?? null, setItem: (key, value) => valuesMap.set(key, value), removeItem: key => valuesMap.delete(key) };
}
function render({ mode = null, persistentMode = null, user = null, authenticated = !!user, callback = false, configured = true, hostname = 'localhost', protocol = 'http:', appBase = '/', pending = false } = {}) {
  const base = `${protocol === 'https:' ? 'wss' : 'ws'}://${hostname}${protocol === 'https:' ? '' : ':3000'}/mirrorville`;
  const local = storage({ [`${base}/auth_token`]: 'existing-guest-token' });
  if (persistentMode) local.setItem(`${base}/session_mode`, persistentMode);
  if (pending) local.setItem(`${base}/guest_transfer`, 'test-transfer');
  const session = storage(mode ? { [`${base}/session_mode`]: mode } : {});
  const connections = [];
  const auth = { user, isAuthenticated: authenticated, isLoading: false, signinSilent: async () => user };
  const mockRequire = name => {
    if (name === './sessionPersistence') return persistence;
    if (name === './mobileShare') return { parseMobileShareFragment: () => null, consumeMobileShare: () => null, restoreMobileShare: () => null, forgetMobileShare() {}, rememberMobileShare() {} };
    if (name.endsWith('.css')) return {};
    if (name === 'react-oidc-context') return { AuthProvider: props => props.children, useAuth: () => auth };
    if (name === 'oidc-client-ts') return { WebStorageStateStore: class {} };
    if (name === 'spacetimedb/react') return { SpacetimeDBProvider: props => props.children, useSpacetimeDB: () => ({ isActive: true }), useReducer: () => async () => {} };
    if (name === './guestTransfer') return { prepareGuestTransfer: async () => {} };
    if (name === './LoginScreen') return { __esModule: true, default: () => React.createElement('p', null, 'login screen') };
    if (name === './App') return { __esModule: true, default: props => React.createElement('p', null, `${props.accountMode ? 'account' : 'guest'}:${props.sessionLabel}`) };
    if (name === './module_bindings') return { reducers: { claimGuestMirrors: {} }, DbConnection: { builder() {
      const state = { onConnect: [] }; connections.push(state);
      const builder = {
        withUri(uri) { state.uri = uri; return builder; }, withDatabaseName() { return builder; },
        withToken(token) { state.token = token; return builder; },
        withAutomaticReconnect() { return builder; }, onConnectError() { return builder; },
        onConnect(fn) { state.onConnect.push(fn); return builder; },
        withTokenProvider(fn) { state.refresh = fn; return builder; },
      }; return builder;
    } } };
    return require(name);
  };
  const code = ts.transpileModule(readFileSync(new URL('../src/SessionRoot.tsx', import.meta.url), 'utf8')
    .replaceAll('import.meta.env', 'testEnv'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const exports = {};
  runInNewContext(code, { exports, require: mockRequire, URL, URLSearchParams,
    testEnv: { BASE_URL: appBase, VITE_SPACETIMEAUTH_CLIENT_ID: configured ? 'public-test-client' : '' },
    localStorage: local, sessionStorage: session,
    window: { location: { hostname, protocol, host: `${hostname}${protocol === 'https:' ? '' : ':5173'}`, port: protocol === 'https:' ? '' : '5173', origin: `${protocol}//${hostname}${protocol === 'https:' ? '' : ':5173'}`, pathname: callback ? `${appBase}callback` : appBase, search: callback ? '?code=test&state=test' : '' } },
  });
  const html = renderToStaticMarkup(React.createElement(exports.default));
  return { html, connections, local };
}

test('LAN visitors connect to the host machine rather than their own localhost', () => {
  const result = render({ mode: 'guest', hostname: '10.0.19.207' });
  assert.equal(result.connections[0].uri, 'ws://10.0.19.207:3000');
  assert.equal(result.connections[0].token, 'existing-guest-token');
});
test('HTTPS share links use the same secure origin without leaking localhost port 3000', () => {
  const result = render({ mode: 'guest', hostname: 'share.example.test', protocol: 'https:' });
  assert.equal(result.connections[0].uri, 'wss://share.example.test');
  assert.equal(result.connections[0].token, 'existing-guest-token');
});

test('account mode uses the verified account token, never the saved anonymous token', () => {
  const result = render({ mode: 'account', user: account });
  assert.match(result.html, /account:account@example.test/);
  assert.equal(result.connections[0].token, account.id_token);
  assert.equal(typeof result.connections[0].refresh, 'function');
  assert.equal(result.local.getItem(guestKey), 'existing-guest-token');
});
test('an existing authenticated account does not replace the explicitly chosen guest identity', () => {
  const result = render({ mode: 'guest', user: account });
  assert.match(result.html, /guest:Guest/);
  assert.equal(result.connections[0].token, 'existing-guest-token');
  result.connections[0].onConnect.at(-1)({}, {}, 'same-guest-credential');
  assert.equal(result.local.getItem(guestKey), 'same-guest-credential');
});
test('failed or expired account sign-in never opens an anonymous connection', () => {
  for (const user of [null, account]) {
    const result = render({ mode: 'account', user, authenticated: false });
    assert.match(result.html, user ? /Restoring your signed-in session/ : /login screen/);
    assert.equal(result.connections.length, 0);
  }
});

test('a reopened tab restores persistent account mode without a tab-local mode', () => {
  const result = render({ persistentMode: 'account', user: account });
  assert.match(result.html, /account:account@example.test/);
  assert.equal(result.connections[0].token, account.id_token);
});

test('legacy mode migrates to persistent storage; explicit exit clears both stores', () => {
  const local = storage(), session = storage({ [modeKey]: 'account' });
  assert.equal(persistence.readSessionMode(local, session, modeKey), 'account');
  assert.equal(persistence.readSessionMode(local, storage(), modeKey), 'account');
  persistence.writeSessionMode(local, session, modeKey, null);
  assert.equal(persistence.readSessionMode(local, session, modeKey), null);
});

test('OIDC migration preserves current persistent credentials and only touches this client', () => {
  const key = 'oidc.user:https://issuer.example:client';
  const session = storage({ [key]: 'legacy-user', 'private-share': 'draft', 'oidc.user:other:client': 'other-user' });
  const local = storage();
  persistence.migrateOidcUser(local, session, 'https://issuer.example', 'client');
  assert.equal(local.getItem(key), 'legacy-user');
  assert.equal(session.getItem(key), null);
  assert.equal(local.getItem('private-share'), null);
  assert.equal(session.getItem('oidc.user:other:client'), 'other-user');
  session.setItem(key, 'stale-user');
  persistence.migrateOidcUser(local, session, 'https://issuer.example', 'client');
  assert.equal(local.getItem(key), 'legacy-user');
});
test('an authenticated anonymous or unverified provider user cannot masquerade as an email account', () => {
  for (const profile of [{ sub: 'anonymous' }, { ...account.profile, email_verified: false }, { ...account.profile, email_verified: undefined }]) {
    const result = render({ mode: 'account', user: { ...account, profile } });
    assert.equal(result.connections.length, 0);
    assert.match(result.html, /login screen/);
  }
});
test('a magic-link callback in a fresh tab enters account mode after provider verification', () => {
  const result = render({ callback: true, user: account });
  assert.match(result.html, /account:account@example.test/);
  assert.equal(result.connections[0].token, account.id_token);
});
test('a Pages subpath callback in a fresh tab enters the verified account', () => {
  const result = render({ callback: true, user: account, appBase: '/cal-hack-proj/' });
  assert.match(result.html, /account:/);
});

test('a forged callback URL alone does not authenticate anyone', () => {
  const result = render({ callback: true, authenticated: false });
  assert.equal(result.connections.length, 0);
  assert.match(result.html, /login screen/);
});
test('a missing public client configuration never turns an account mode into guest mode', () => {
  const result = render({ mode: 'account', configured: false });
  assert.equal(result.connections.length, 0);
  assert.match(result.html, /login screen/);
});
test('an unconfigured development build still preserves explicitly selected guests', () => {
  const result = render({ mode: 'guest', configured: false });
  assert.equal(result.connections[0].token, 'existing-guest-token');
  assert.match(result.html, /guest:Guest/);
});

test('a pending transfer blocks account creation UI but never blocks guest access', () => {
  const result = render({ mode: 'account', user: account, pending: true });
  assert.match(result.html, /Bringing your guest mirror with you/);
  assert.doesNotMatch(result.html, /account:account@example.test/);
  assert.match(render({ mode: 'guest', pending: true }).html, /guest:Guest/);
});
