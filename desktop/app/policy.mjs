export const ORIGIN = 'http://127.0.0.1:17431';
export function trustedFrame(event, window) {
  return !!window && event.sender === window.webContents && event.senderFrame === window.webContents.mainFrame
    && new URL(event.senderFrame.url).origin === ORIGIN;
}
export function validOperation(method, body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  if (['status', 'observations', 'pause', 'clear', 'codexSources','backgroundStatus','backgroundQuit'].includes(method)) return Object.keys(body).length === 0;
  if(method==='backgroundStartup')return Object.keys(body).join(',')==='enabled'&&typeof body.enabled==='boolean';
  if (method==='codexSelect') return Object.keys(body).join(',')==='threadIds' && Array.isArray(body.threadIds) && body.threadIds.length<=10
    && new Set(body.threadIds).size===body.threadIds.length && body.threadIds.every(id=>typeof id==='string' && /^[a-f0-9-]{36}$/.test(id));
  if(method==='codexAuto') return Object.keys(body).join(',')==='enabled' && typeof body.enabled==='boolean';
  if (method === 'capture') return ['browserTopics,enabled','browserTopics,contextTitles,enabled'].includes(Object.keys(body).sort().join(','))
    && typeof body.enabled === 'boolean' && typeof body.browserTopics === 'boolean' && (body.contextTitles === undefined || typeof body.contextTitles === 'boolean');
  if (typeof body.scope !== 'string' || body.scope.length<8 || body.scope.length>240 || JSON.stringify(body).length>30000) return false;
  const fields=Object.keys(body).sort().join(',');
  if(method==='backgroundConfigure')return typeof body.enabled==='boolean' && Object.keys(body).every(k=>['scope','enabled','mirrorId','background'].includes(k))
    && /^activity\|[^|]+\|[^|]+\|[a-f0-9]{64}$/.test(body.scope) && (body.mirrorId===undefined||(typeof body.mirrorId==='string'&&/^\d{1,20}$/.test(body.mirrorId)))
    && (body.background===undefined||(typeof body.background==='string'&&body.background.length<=3000));
  if(method==='backgroundRun')return fields==='scope';
  if(method==='dailyReports') return fields==='scope';
  const day=typeof body.date==='string' && /^\d{4}-\d{2}-\d{2}T\d{2}:00[+-]\d{4}$/.test(body.date);
  if(method==='dailyContext') return fields==='date,scope' && day;
  if(method==='saveDailyReport') return fields==='date,episodeIds,generation,hash,scope,themes' && day && typeof body.hash==='string' && /^[a-f0-9]{24}$/.test(body.hash) && Number.isInteger(body.generation) && Array.isArray(body.episodeIds) && body.episodeIds.length<=40 && Array.isArray(body.themes) && body.themes.length===1;
  if(method==='dailyDelivered') return fields==='date,hash,mirrorId,scope' && day && typeof body.mirrorId==='string' && /^\d{1,20}$/.test(body.mirrorId) && typeof body.hash==='string' && /^[a-f0-9]{24}$/.test(body.hash);
  if (method==='context') return fields==='scope';
  if (method==='saveUnderstanding') return fields==='episodeIds,generation,scope,themes' && Array.isArray(body.episodeIds) && body.episodeIds.length<=80 && Array.isArray(body.themes) && body.themes.length<=5 && Number.isInteger(body.generation);
  if (method==='reviseUnderstanding') return fields==='id,scope,state,text' && typeof body.id==='string' && typeof body.text==='string' && body.text.length<=400 && ['confirmed','dismissed'].includes(body.state);
  return false;
}
export function authNavigation(raw) {
  try {
    const url = new URL(raw);
    if (url.origin !== 'https://auth.spacetimedb.com' || !url.pathname.startsWith('/oidc/')) return null;
    const redirect = url.searchParams.get('redirect_uri') ?? url.searchParams.get('post_logout_redirect_uri');
    if (!redirect || ![ORIGIN + '/callback', ORIGIN + '/'].includes(redirect)) return null;
    return { url: url.href, state: url.searchParams.get('state'), logout: url.searchParams.has('post_logout_redirect_uri') };
  } catch { return null; }
}
export function validAuthReturn(url, pending, now = Date.now()) {
  return !!pending && pending.expires >= now && !!pending.state && url.searchParams.get('state') === pending.state
    && (pending.logout || url.searchParams.has('code') || url.searchParams.has('error'));
}
