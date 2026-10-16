#!/usr/bin/env node
// Sirve dist/ como lo sirve Vercel con este vercel.json: /x → 308 /x/, /x/ → /x/index.html, 404.html,
// .md como text/markdown. Para revisar el build en local y para herramientas/verificar.mjs.
//   npm run preview            → http://localhost:4173
//   PUERTO=0 → puerto libre (lo usa verificar.mjs importando servir())
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RAIZ } from './lib.mjs';

const DIST = join(RAIZ, 'dist');
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp4': 'video/mp4',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.pdf': 'application/pdf',
};

export function servir(puerto = 4173) {
  const servidor = createServer((req, res) => {
    const ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let f = join(DIST, ruta);
    if (!f.startsWith(DIST)) { res.writeHead(400).end(); return; }
    // trailingSlash: true → lo que no parece archivo lleva barra al final
    if (!ruta.endsWith('/') && !extname(ruta)) { res.writeHead(308, { Location: ruta + '/' }).end(); return; }
    if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
    if (!existsSync(f)) { res.writeHead(404, { 'Content-Type': TIPOS['.html'] }).end(readFileSync(join(DIST, '404.html'))); return; }
    const cuerpo = readFileSync(f);
    const tipo = TIPOS[extname(f)] || 'application/octet-stream';
    const rango = req.headers.range && /bytes=(\d+)-(\d*)/.exec(req.headers.range);
    if (rango) {
      const ini = +rango[1], fin = rango[2] ? +rango[2] : cuerpo.length - 1;
      res.writeHead(206, { 'Content-Type': tipo, 'Content-Range': `bytes ${ini}-${fin}/${cuerpo.length}`, 'Content-Length': fin - ini + 1, 'Accept-Ranges': 'bytes' });
      res.end(cuerpo.subarray(ini, fin + 1));
      return;
    }
    res.writeHead(200, { 'Content-Type': tipo, 'Content-Length': cuerpo.length, 'Accept-Ranges': 'bytes' });
    res.end(cuerpo);
  });
  return new Promise((r) => servidor.listen(puerto, '127.0.0.1', () => r(servidor)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const s = await servir(Number(process.env.PUERTO ?? 4173));
  console.log(`dist/ en http://localhost:${s.address().port}  (?hora=19 fija la hora · ?mascota=apurada acelera a mi Claude)`);
}
