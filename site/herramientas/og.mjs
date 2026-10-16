#!/usr/bin/env node
// Genera las imágenes para compartir (Open Graph, 1200×630): la de cada prompt y la general de la portada.
// Se corre a mano cuando entra un prompt nuevo y el resultado se commitea (Vercel no tiene navegador para hacerlas).
//   npm run og               → todos los prompts + la general
//   npm run og -- mi-claude  → solo ese prompt
// Salida: content/prompts/<slug>/medios/og.jpg y site/estaticos/og.jpg (+ favicon-32.png y apple-touch-icon.png).
// Necesita Playwright con Chromium. Si no está en este proyecto, apuntá a uno instalado:
//   PLAYWRIGHT_MODULE=/ruta/a/node_modules/playwright/index.mjs npm run og
import { readFileSync, writeFileSync, mkdirSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SITIO, leerConfig, cargarPrompts, medioDe, esc } from '../lib.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const config = leerConfig();
const prompts = cargarPrompts();
const solo = process.argv[2];

const b64 = (ruta, tipo) => `data:${tipo};base64,${readFileSync(ruta).toString('base64')}`;
const fuente = (f) => b64(join(SITIO, 'estaticos/fuentes', f), 'font/woff2');
const MASCOTA = readFileSync(join(SITIO, 'estaticos/favicon.svg'), 'utf8');
const host = config.url.replace(/^https:\/\//, '');

const BASE = `
@font-face{font-family:L;src:url(${fuente('lilita-one.woff2')})}
@font-face{font-family:C;src:url(${fuente('caveat.woff2')});font-weight:600}
@font-face{font-family:S;src:url(${fuente('silkscreen.woff2')})}
@font-face{font-family:J;src:url(${fuente('jetbrains-mono.woff2')});font-weight:400 700}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;position:relative;
  background:linear-gradient(#fbe2b4 0 13%,#f9cf98 13% 26%,#f6b882 26% 39%,#f29c6b 39% 52%,#ec8059 52% 65%,#e46a4c 65% 100%)}
.mar{position:absolute;left:0;right:0;bottom:56px;height:120px;background:#1f9aa6}
.mar i{position:absolute;height:4px;background:rgb(255 255 255/.45)}
.arena{position:absolute;left:0;right:0;bottom:0;height:56px;background:#efd29a}
.sol{position:absolute;width:120px;height:120px;background:#fbe7a1;
  clip-path:polygon(30% 0,70% 0,70% 10%,90% 10%,90% 30%,100% 30%,100% 70%,90% 70%,90% 90%,70% 90%,70% 100%,30% 100%,30% 90%,10% 90%,10% 70%,0 70%,0 30%,10% 30%,10% 10%,30% 10%)}
.izq{position:absolute;left:72px;top:64px;width:640px}
.firma{font:24px/1 S;letter-spacing:.08em;text-transform:uppercase;color:#3a2010}
h1{font:82px/1 L;color:#fff6e5;margin-top:22px;
  text-shadow:4px 0 #3a2010,-4px 0 #3a2010,0 4px #3a2010,0 -4px #3a2010,3px 3px #3a2010,-3px 3px #3a2010,3px -3px #3a2010,-3px -3px #3a2010,0 9px 0 #3a2010}
.mano{font:600 44px/1.1 C;color:#3a2010;margin-top:20px}
.url{position:absolute;left:72px;bottom:84px;font:600 26px/1 J;color:#2b1a10;background:#fff6e5;padding:12px 18px;border-radius:10px;box-shadow:0 5px 0 #3a2010}
`;

async function foto(navegador, html, salida, { ancho = 1200, alto = 630, tipo = 'jpeg', transparente = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'og-'));
  const archivo = join(dir, 'x.html');
  writeFileSync(archivo, html);
  const pagina = await navegador.newPage({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 1 });
  await pagina.goto('file://' + archivo);
  await pagina.evaluate(() => document.fonts.ready);
  mkdirSync(join(salida, '..'), { recursive: true });
  await pagina.screenshot({ path: salida, type: tipo, ...(tipo === 'jpeg' ? { quality: 86 } : {}), omitBackground: transparente });
  await pagina.close();
  rmSync(dir, { recursive: true, force: true });
  console.log('  ✓', salida);
}

function ogPrompt(p) {
  const tarjeta = medioDe(p, 'tarjeta.webp');
  const foto = tarjeta
    ? `<div class="postal"><img src="${b64(tarjeta, 'image/webp')}"><p>Postal Nº ${p.num} · gratis, para copiar</p><span class="sello">PROMPT</span></div>`
    : `<div class="grande">${MASCOTA}</div>`;
  const largo = p.titulo.length;
  return `<!doctype html><meta charset="utf-8"><style>${BASE}
h1{font-size:${largo > 34 ? 68 : 82}px}
.postal{position:absolute;right:66px;top:70px;width:420px;background:#fffaf0;padding:14px 14px 0;transform:rotate(4deg);box-shadow:0 22px 40px -16px rgb(58 32 16/.7)}
.postal img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover}
.postal p{font:600 30px/1 C;color:#6a4630;padding:14px 4px 18px}
.sello{position:absolute;top:-18px;right:-14px;background:#f2c14e;color:#2b1a10;font:18px/1 S;padding:10px 12px;border:3px dotted #fffaf0;outline:3px solid #f2c14e;transform:rotate(8deg)}
.grande{position:absolute;right:120px;bottom:40px;width:300px}
</style><body><div class="mar"><i style="left:6%;top:30px;width:16%"></i><i style="left:44%;top:70px;width:12%"></i><i style="left:70%;top:24px;width:10%"></i></div><div class="arena"></div>
<div class="izq"><p class="firma">Prompt para ${esc(p.herramienta)}</p><h1>${esc(p.titulo)}</h1><p class="mano">Copialo, pegalo y listo.</p></div>
${foto}<p class="url">${esc(host)}/${esc(p.slug)}</p></body>`;
}

function ogSitio() {
  return `<!doctype html><meta charset="utf-8"><style>${BASE}
.grande{position:absolute;right:150px;bottom:14px;width:300px}
.grande svg{width:300px;height:300px}
.sello{position:absolute;right:96px;top:70px;background:#f2c14e;color:#2b1a10;font:20px/1.25 S;padding:12px 14px;border:3px dotted #fffaf0;outline:3px solid #f2c14e;transform:rotate(6deg);text-align:center}
</style><body><i class="sol" style="right:120px;top:180px"></i><div class="mar"><i style="left:6%;top:30px;width:16%"></i><i style="left:44%;top:70px;width:12%"></i><i style="left:70%;top:24px;width:10%"></i></div><div class="arena"></div>
<div class="izq"><p class="firma">${esc(config.nombre)}</p><h1>${esc(config.titulo)}</h1><p class="mano">Copialo, pegalo en tu Claude Code y listo.</p></div>
<div class="grande">${MASCOTA}</div><p class="sello">PROMPTS<br>GRATIS</p><p class="url">${esc(host)}</p></body>`;
}

const icono = (fondo) =>
  `<!doctype html><meta charset="utf-8"><style>*{margin:0}html,body{width:100%;height:100%}body{display:grid;place-items:center;background:${fondo}}svg{width:86%;height:86%}</style><body>${MASCOTA}</body>`;

const navegador = await chromium.launch();
try {
  for (const p of prompts) {
    if (solo && p.slug !== solo) continue;
    if (!existsSync(join(p.dir, 'medios'))) mkdirSync(join(p.dir, 'medios'));
    await foto(navegador, ogPrompt(p), join(p.dir, 'medios', 'og.jpg'));
  }
  if (!solo) {
    await foto(navegador, ogSitio(), join(SITIO, 'estaticos/og.jpg'));
    await foto(navegador, icono('#fbf1df'), join(SITIO, 'estaticos/apple-touch-icon.png'), { ancho: 180, alto: 180, tipo: 'png' });
    await foto(navegador, icono('transparent'), join(SITIO, 'estaticos/favicon-32.png'), { ancho: 32, alto: 32, tipo: 'png', transparente: true });
  }
} finally {
  await navegador.close();
}
