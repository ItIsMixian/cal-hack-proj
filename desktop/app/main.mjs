import { app, BrowserWindow, ipcMain, safeStorage, shell, dialog } from 'electron';
import { createServer } from 'node:http';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { ObserverClient } from './observer-client.mjs';
import { AgentClient } from './agent-client.mjs';
import { authNavigation, ORIGIN, trustedFrame, validOperation, validAuthReturn } from './policy.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
let window, observer, tray, server, polling, expectedAuth = null;
let status = { enabled: false, observations: 0, browserTopics: false }, unavailable = false;
const smoke = process.argv.includes('--desktop-smoke');
if (smoke) app.disableHardwareAcceleration();
if (smoke) app.setPath('userData', path.join(app.getPath('temp'), 'Mirrorville-desktop-smoke'));

function refreshMenu() {
  const label = unavailable ? 'Observation disconnected' : status.enabled ? 'Observing in background' : 'Observation paused';
  window?.setTitle('Mirrorville · ' + label);
}
async function pause() {
  try { await observer?.request('pause'); } catch { /* Already stopped. */ }
  status.enabled = false; refreshMenu();
}
function startAuth(auth) {
  if (!auth.state && auth.logout) {
    auth.state = randomBytes(32).toString('hex');
    const url = new URL(auth.url); url.searchParams.set('state', auth.state); auth.url = url.href;
  }
  expectedAuth = { ...auth, expires: Date.now() + 15 * 60_000 };
  void pause(); void shell.openExternal(auth.url);
}
function openNavigation(event, raw) {
  const url = new URL(raw);
  if (url.origin === ORIGIN) return;
  event.preventDefault();
  const auth = authNavigation(raw);
  if (auth) startAuth(auth);
}
async function serve() {
  const root = path.resolve(here, '../../dist-desktop');
  server = createServer(async (req, res) => {
    const send = (code, value, type = 'text/plain; charset=utf-8') => {
      res.writeHead(code, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store',
        // SDK 2.13 compiles binary serializers with Function(). Inline scripts stay blocked.
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' ws://127.0.0.1:3000 http://127.0.0.1:3000 ws://127.0.0.1:3011 http://127.0.0.1:3011 https://auth.spacetimedb.com wss://maincloud.spacetimedb.com https://maincloud.spacetimedb.com https://api.github.com https://www.facebook.com https://graph.facebook.com; frame-src https://auth.spacetimedb.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'" });
      res.end(value);
    };
    if (req.headers.host !== '127.0.0.1:17431' || req.method !== 'GET') return send(403, 'Unavailable');
    let url;
    try { url = new URL(req.url, ORIGIN); } catch { return send(400, 'Invalid URL'); }
    if (url.pathname === '/callback' || (url.pathname === '/' && url.searchParams.has('state'))) {
      const pending = expectedAuth;
      if (!validAuthReturn(url, pending)) return send(400, 'No matching Mirrorville sign-in. Start sign-in inside the app.');
      expectedAuth = null;
      window.webContents.send('desktop:auth-callback', url.search);
      window.show(); window.restore(); window.focus();
      return send(200, 'You can return to the Mirrorville app. This browser tab can be closed.');
    }
    let name;
    try { name = decodeURIComponent(url.pathname); } catch { return send(400, 'Invalid path'); }
    if (name === '/' || name === '/desktop-auth') name = '/index.html';
    const target = path.resolve(root, '.' + name);
    if (!target.startsWith(root + path.sep)) return send(403, 'Unavailable');
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon' };
    try { if (!(await stat(target)).isFile()) return send(404, 'Not found'); send(200, await readFile(target), types[path.extname(target)] ?? 'application/octet-stream'); }
    catch { send(404, 'Not found'); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(17431, '127.0.0.1', resolve); });
}

const backgroundMode=process.argv.includes('--background-agent')||process.argv.includes('--background-smoke');
if(backgroundMode){
  const agentSmoke=process.argv.includes('--background-smoke');
  const base=agentSmoke&&process.env.MIRRORVILLE_AGENT_TEST_DIR?path.resolve(process.env.MIRRORVILLE_AGENT_TEST_DIR):app.getPath('userData');
  // Select the independent Chromium/safeStorage profile before app readiness.
  mkdirSync(path.join(base,'background-agent'),{recursive:true,mode:0o700});
  app.setPath('userData',path.join(base,'background-agent'));
  const {startBackgroundAgent}=await import('./background-agent.mjs');
  void startBackgroundAgent(base,{smoke:agentSmoke}).catch(()=>app.exit(1));
}
else {
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { window?.show(); window?.restore(); window?.focus(); });
  app.whenReady().then(async () => {
    try {
      await serve();
      const data = path.join(app.getPath('userData'), 'observer');
      const command = app.isPackaged ? path.join(process.resourcesPath, 'observer', 'mirrorville-observer.exe') : (process.env.MIRRORVILLE_PYTHON || 'python');
      const args = app.isPackaged ? ['--data-dir', data] : [path.join(here, '../native_host.py'), '--data-dir', data];
      observer = smoke?new ObserverClient(command, args, () => { unavailable = true; status.enabled = false; refreshMenu(); }):new AgentClient({base:app.getPath('userData'),executable:process.execPath,isPackaged:app.isPackaged,decrypt:value=>safeStorage.decryptString(value)});
      if(!smoke)await observer.ready();
      window = new BrowserWindow({ width: 1180, height: 820, minWidth: 720, minHeight: 600, show: false,
        backgroundColor: '#f5f0df', icon: path.join(here, 'icon.png'),
        webPreferences: { preload: path.join(here, 'preload.cjs'), contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true, offscreen: smoke } });
      window.removeMenu();
      window.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
      window.webContents.setWindowOpenHandler(({ url }) => {
        const auth = authNavigation(url);
        if (auth) startAuth(auth);
        else if (/^https:\/\//.test(url)) void shell.openExternal(url);
        return { action: 'deny' };
      });
      window.webContents.on('will-navigate', openNavigation);
      window.webContents.on('will-redirect', openNavigation);
      // A town renderer crash no longer changes independently authorized background capture.
      window.webContents.on('page-title-updated', event => { event.preventDefault(); refreshMenu(); });
      window.on('minimize', () => { if (!smoke) window.hide(); });
      window.on('closed', () => app.quit());
      ipcMain.handle('observer:request', async (event, method, body) => {
        if (!trustedFrame(event, window) || !validOperation(method, body)) throw new Error('Unsupported desktop request.');
        const value = await observer.request(method, body);
        unavailable=false;
        if (method === 'status') status = value;
        else if (method !== 'observations') status = await observer.request('status');
        refreshMenu(); return value;
      });
      refreshMenu();
      polling = setInterval(async () => { try { status = await observer.request('status'); unavailable=false; refreshMenu(); } catch { unavailable = true; refreshMenu(); } }, 5000);
      await window.loadURL(ORIGIN + '/'); window.show();
      if (smoke) {
        const { runSmoke } = await import('./smoke.mjs');
        await runSmoke(window, observer); app.quit();
      }
    } catch (error) {
      if (smoke) await writeFile('output/desktop-smoke/error.txt', String(error.message));
      if (!smoke) dialog.showErrorBox('Mirrorville could not start', 'The local app could not start. Check whether another Mirrorville app is using port 17431.');
      app.exit(1);
    }
  });
}
app.on('before-quit', () => { clearInterval(polling); observer?.stop(); server?.close(); tray?.destroy(); });
app.on('window-all-closed', () => app.quit());

}
