/// <reference types="node" />
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve, sep, extname } from 'node:path';
import { gzipSync } from 'node:zlib';
import type { Plugin } from 'vite';

// Keep local HMR while serving a compact production build through the existing share URL.
export function sharePreview(): Plugin {
  return { name: 'mirrorville-share-preview', configureServer(server) {
    const root = resolve(server.config.root, 'dist');
    const cache = new Map<string, { mtime: number; body: Buffer; gzip: Buffer }>();
    server.middlewares.use((req, res, next) => {
      const host = (req.headers.host ?? '').split(':')[0];
      if (!host.endsWith('.trycloudflare.com')) return next();
      let pathname: string;
      try { pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://preview').pathname); }
      catch { res.statusCode = 400; return res.end(); }
      if (pathname.startsWith('/v1/')) return next();
      const page = pathname === '/' || pathname === '/callback';
      if (!page && !pathname.startsWith('/assets/') && !pathname.startsWith('/fonts/')) {
        res.statusCode = 404; return res.end('Not found');
      }
      const path = resolve(root, page ? 'index.html' : `.${pathname}`);
      if (!path.startsWith(root + sep) || !existsSync(path) || !statSync(path).isFile()) {
        res.statusCode = 503; return res.end('Preview is updating. Please refresh in a moment.');
      }
      const mtime = statSync(path).mtimeMs;
      let file = cache.get(path);
      if (!file || file.mtime !== mtime) {
        const body = readFileSync(path);
        file = { mtime, body, gzip: gzipSync(body) }; cache.set(path, file);
      }
      const types: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
        '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ttf': 'font/ttf' };
      res.setHeader('Content-Type', types[extname(path)] ?? 'application/octet-stream');
      res.setHeader('Cache-Control', page ? 'no-cache' : 'public, max-age=3600');
      res.setHeader('Vary', 'Accept-Encoding');
      const compressed = /\bgzip\b/.test(req.headers['accept-encoding'] ?? '') && /\.(html|js|css|json|svg|ttf)$/.test(path);
      const body = compressed ? file.gzip : file.body;
      if (compressed) res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Content-Length', body.length);
      res.end(req.method === 'HEAD' ? undefined : body);
    });
  } };
}
