import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { runInNewContext } from 'node:vm';
import { test, after } from 'node:test';
import ts from 'typescript';

const root = mkdtempSync(join(tmpdir(), 'mirrorville-preview-test-'));
mkdirSync(join(root, 'dist/assets'), { recursive: true });
writeFileSync(join(root, 'dist/index.html'), '<html><script src="/assets/app.js"></script></html>');
writeFileSync(join(root, 'dist/assets/app.js'), 'console.log("production");');
after(() => {
  assert.ok(resolve(root).startsWith(resolve(tmpdir()) + sep));
  rmSync(root, { recursive: true });
});
const exports = {};
runInNewContext(ts.transpileModule(readFileSync(new URL('./share-preview.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports, Buffer, URL, require: createRequire(import.meta.url) });
let middleware;
exports.sharePreview().configureServer({ config: { root }, middlewares: { use(fn) { middleware = fn; } } });
function request(url, host = 'preview.trycloudflare.com', encoding = '') {
  const res = { statusCode: 200, headers: {}, setHeader(key, value) { this.headers[key] = value; }, end(body) { this.body = body; } };
  let next = false;
  middleware({ url, method: 'GET', headers: { host, 'accept-encoding': encoding } }, res, () => { next = true; });
  return { ...res, next };
}
test('share index and callback serve production HTML; local development is untouched', () => {
  for (const path of ['/', '/callback?code=test&state=test']) {
    const res = request(path);
    assert.match(res.body.toString(), /\/assets\/app.js/);
    assert.equal(res.headers['Cache-Control'], 'no-cache');
    assert.equal(res.next, false);
  }
  assert.equal(request('/', 'localhost:5173').next, true);
});
test('production assets are gzip compressed and rebuilt files invalidate the cache', () => {
  let res = request('/assets/app.js', undefined, 'gzip');
  assert.equal(res.headers['Content-Encoding'], 'gzip');
  assert.equal(gunzipSync(res.body).toString(), 'console.log("production");');
  writeFileSync(join(root, 'dist/assets/app.js'), 'console.log("updated");');
  const later = new Date(Date.now() + 2000);
  utimesSync(join(root, 'dist/assets/app.js'), later, later);
  res = request('/assets/app.js');
  assert.equal(res.body.toString(), 'console.log("updated");');
});
test('source files and traversal do not fall through to the dev server', () => {
  for (const path of ['/src/SessionRoot.tsx', '/.env.local', '/assets/%2e%2e/%2e%2e/.env.local']) {
    const res = request(path);
    assert.equal(res.statusCode, 404); assert.equal(res.next, false);
  }
  assert.equal(request('/assets/%bad').statusCode, 400);
});
test('SDK routes reach the existing scoped proxy; unavailable builds give a retry response', () => {
  assert.equal(request('/v1/database/mirrorville/subscribe?compression=None').next, true);
  assert.equal(request('/v1/identity/websocket-token').next, true);
  assert.equal(request('/assets/missing.js').statusCode, 503);
});
