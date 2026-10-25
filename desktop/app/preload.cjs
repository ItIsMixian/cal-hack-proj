const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('mirrorvilleDesktop', Object.freeze({
  version: 1,
  request: (method, body = {}) => ipcRenderer.invoke('observer:request', method, body),
}));
ipcRenderer.on('desktop:auth-callback', (_event, search) => {
  // OIDC validates state + PKCE using this app's own persistent origin storage.
  const params = new URLSearchParams(search);
  window.location.assign(params.has('code') || params.has('error') ? '/desktop-auth' + search : '/');
});
