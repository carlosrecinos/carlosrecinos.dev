#!/usr/bin/env node
// Genera la portada de carlosrecinos.dev y las páginas de cada prompt como HTML estático, dentro de dist/.
// Corre DESPUÉS de `vite build` (que deja el portafolio en dist/cv/) y no toca dist/cv/.
// Lee content/prompts/<slug>/{PROMPT.md, meta.json, medios/}. Node 20+, sin framework (esbuild solo minifica).
//   node site/build.mjs              (o npm run build, que arma todo)
//   BUSQUEDA_DESDE=1 node site/build.mjs   → fuerza la búsqueda ⌘K para verla con un solo prompt
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, copyFileSync, readdirSync, renameSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { transformSync } from 'esbuild';
import { RAIZ, SITIO, leerConfig, cargarPrompts, medioDe, fechaCorta, fechaLarga, esc, urlInstagram } from './lib.mjs';
import { escena, postalesDeViaje, MASCOTA, MC } from './escena.mjs';
import { ico, matasellos, SELLO, sprite, promptHTML } from './piezas.mjs';

const DIST = join(RAIZ, 'dist');
const config = leerConfig();
const prompts = cargarPrompts();
if (!prompts.length) throw new Error('No hay prompts publicables en content/prompts/');
const BUSQUEDA_DESDE = Number(process.env.BUSQUEDA_DESDE || config.busqueda_desde || 9);
const conBusqueda = prompts.length >= BUSQUEDA_DESDE;
const instagram = urlInstagram(config.instagram);
const CODIGO = 'https://github.com/carlosrecinos/carlosrecinos.dev';

// ---------- dist/: se limpia todo menos el portafolio ----------
mkdirSync(DIST, { recursive: true });
for (const f of readdirSync(DIST)) if (f !== 'cv') rmSync(join(DIST, f), { recursive: true, force: true });
mkdirSync(join(DIST, 'a'), { recursive: true });

// ---------- activos con hash (caché larga en /a/) ----------
const hash = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 10);
const activos = new Map();
const pesos = new Map();
function activo(ruta) {
  if (activos.has(ruta)) return activos.get(ruta);
  const buf = readFileSync(ruta);
  const ext = extname(ruta);
  const nombre = `${basename(ruta, ext)}.${hash(buf)}${ext}`;
  writeFileSync(join(DIST, 'a', nombre), buf);
  const url = `/a/${nombre}`;
  activos.set(ruta, url);
  pesos.set(url, buf.length);
  return url;
}
const estatico = (f) => join(SITIO, 'estaticos', f);
const fuente = (f) => activo(estatico(join('fuentes', f)));

// ---------- CSS y JS, minificados e incrustados ----------
const paisajeJS = readFileSync(join(SITIO, 'plantilla/paisaje.js'), 'utf8');
new Function(paisajeJS.replace("typeof window !== 'undefined' ? window : globalThis", 'globalThis'))();
const porDefecto = globalThis.__calcPaisaje(15); // sin JS, la tarde
const DEFAULTS = Object.entries(porDefecto.v).map(([k, v]) => `--${k}: ${v};`).join(' ');
const CLASES = Object.keys(porDefecto.v).filter((k) => !/^(est|luc|refl|aves|sx|sy|lx|ly)$/.test(k)).map((k) => `.f${k}{fill:var(--${k})}`).join('');

let cssFuente = readFileSync(join(SITIO, 'plantilla/estilos.css'), 'utf8');
if (conBusqueda) cssFuente += readFileSync(join(SITIO, 'plantilla/busqueda.css'), 'utf8');
cssFuente = cssFuente
  .replace(/@fuente\/([\w.-]+)/g, (_, f) => fuente(f))
  .replace('/*DEFAULTS*/', DEFAULTS)
  .replace('/*CLASES_ESCENA*/', CLASES);
const css = transformSync(cssFuente, { loader: 'css', minify: true, target: ['safari15', 'chrome100'] }).code.trim();

const min = (codigo) => transformSync(codigo, { minify: true, target: 'es2017', charset: 'utf8' }).code.trim();
const jsCabeza = min(paisajeJS);
const jsCuerpo = min(
  readFileSync(join(SITIO, 'plantilla/main.js'), 'utf8') + '\n' +
  readFileSync(join(SITIO, 'plantilla/mascota.js'), 'utf8').replace('/*MC*/', JSON.stringify(MC)) +
  (conBusqueda ? '\n' + readFileSync(join(SITIO, 'plantilla/busqueda.js'), 'utf8') : '')
);
const sha = (s) => `'sha256-${createHash('sha256').update(s).digest('base64')}'`;
const CSP = [
  "default-src 'self'",
  `script-src ${sha(jsCabeza)} ${sha(jsCuerpo)}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "media-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

// ---------- piezas de página ----------
const urlAbs = (ruta) => config.url + ruta;
const ogSitio = { url: urlAbs(activo(estatico('og.jpg'))), w: 1200, h: 630 };
const ogDe = (p) => { const r = medioDe(p, 'og.jpg'); return r ? { url: urlAbs(activo(r)), w: 1200, h: 630 } : ogSitio; };
const jsonTexto = (s) => JSON.stringify(s).replace(/</g, '\\u003c');

const contacto = config.contacto;
function menuContacto() {
  const vias = [];
  const wa = contacto.whatsapp;
  if (wa && wa.numero) {
    const digitos = String(wa.numero).replace(/\D/g, '');
    const href = `https://wa.me/${digitos}${wa.mensaje ? `?text=${encodeURIComponent(wa.mensaje)}` : ''}`;
    vias.push(`<div class="via"><a href="${esc(href)}" rel="noopener">${ico('chat')}<span><b>WhatsApp</b><small>${esc(wa.numero)}</small></span></a><button type="button" class="copiar-dato" data-copiar-dato="${esc(wa.numero)}" data-etiqueta="Copiar el número de WhatsApp" aria-label="Copiar el número de WhatsApp">${ico('copiar', 'i-copiar')}${ico('check', 'i-check')}</button></div>`);
  }
  if (contacto.correo) {
    vias.push(`<div class="via"><a href="mailto:${esc(contacto.correo)}">${ico('sobre')}<span><b>Correo</b><small>${esc(contacto.correo)}</small></span></a><button type="button" class="copiar-dato" data-copiar-dato="${esc(contacto.correo)}" data-etiqueta="Copiar el correo" aria-label="Copiar el correo">${ico('copiar', 'i-copiar')}${ico('check', 'i-check')}</button></div>`);
  }
  if (contacto.instagram) {
    const u = String(contacto.instagram).replace(/^@/, '');
    vias.push(`<div class="via"><a href="https://ig.me/m/${esc(u)}" rel="noopener">${ico('avion')}<span><b>Mensaje por Instagram</b><small>@${esc(u)}</small></span></a></div>`);
  }
  return `<div class="contacto-envoltura">
<button type="button" class="chip" data-contacto aria-expanded="false" aria-controls="menu-contacto">Contacto${ico('caret', 'caret')}</button>
<div class="menu-contacto" id="menu-contacto" hidden>
<p>Escribime por donde te quede más fácil</p>
${vias.join('\n')}
</div>
</div>`;
}

const barra = () => `<nav class="barra" aria-label="Principal">
<button type="button" class="chip chip-tema" data-tema aria-label="Cambiar a modo oscuro">${ico('luna', 'i-luna')}${ico('sol', 'i-sol')}</button>
<div class="chips">
${conBusqueda ? `<button type="button" class="chip chip-buscar" data-buscar aria-label="Buscar prompts" aria-keyshortcuts="Meta+K Control+K" aria-haspopup="dialog">${ico('lupa')}<kbd class="k-mod">⌘</kbd><kbd>K</kbd></button>` : ''}
<a class="chip" href="/cv/" hreflang="en">${ico('doc')}CV (EN)</a>
${menuContacto()}
${instagram ? `<a class="chip chip-seguir" href="${esc(instagram)}" rel="me noopener">${ico('camara')}<span class="txt">Seguime</span><span class="oculto"> en Instagram</span></a>` : ''}
</div>
</nav>`;

function cielo({ nombreEsH1, fija = false }) {
  const nombre = nombreEsH1 ? `<h1 class="nombre">${esc(config.nombre)}</h1>` : `<p class="nombre"><a href="/">${esc(config.nombre)}</a></p>`;
  return `<header class="cielo" id="arriba"${fija ? ' data-mascota="fija"' : ''}>
${escena()}
<div class="cabeza">${nombre}</div>
<p class="hora-chip"><i aria-hidden="true"></i><span class="normal"><span class="lugar-chip">El Tunco · </span><span data-hora>2:00 p. m.</span></span><span class="estado" aria-hidden="true"><span class="lugar-chip">Ahorita vengo · </span><span data-estado></span></span><span class="oculto" data-fase-oculta></span></p>
</header>`;
}

const pie = () => `<footer class="pie">
<div class="envoltura">
<p class="frase" data-frase>Tarde en El Tunco. Calorón, y mi Claude ni se mueve de la playa.</p>
<p class="linea"><span>${esc(config.nombre)} · Chalatenango, El Salvador</span><a href="/cv/" hreflang="en">CV (EN)</a><a href="${CODIGO}" rel="noopener">El código de este sitio</a><span>Sin cookies ni rastreo.</span></p>
</div>
</footer>`;

function fotoDe(p, { prioridad = false } = {}) {
  const r = medioDe(p, 'tarjeta.webp') || medioDe(p, 'tarjeta.jpg');
  const alt = p.video ? `Portada del video «${p.video}»` : `Portada de «${p.titulo}»`;
  if (!r) return `<div class="foto"><div class="sin-foto"><svg viewBox="2 7 20 20" shape-rendering="crispEdges" aria-hidden="true"><path fill="#f2c14e" d="${MASCOTA.corona}"/><path fill="#e04e5a" d="${MASCOTA.joyas}"/><path fill="#db7758" d="${MASCOTA.cuerpo}"/><path fill="#2a1a12" d="${MASCOTA.ojos}"/></svg></div></div>`;
  return `<div class="foto"><img src="${activo(r)}" width="720" height="450" alt="${esc(alt)}"${prioridad ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async"></div>`;
}

const posterSVG = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 768 456" shape-rendering="crispEdges"><rect width="768" height="456" fill="#1e1e22"/><g transform="translate(6 -48) scale(18)"><path fill="#f2c14e" d="${MASCOTA.corona}"/><path fill="#e04e5a" d="${MASCOTA.joyas}"/><path fill="#db7758" d="${MASCOTA.cuerpo}"/><path fill="#2a1a12" d="${MASCOTA.ojos}"/></g></svg>`);

function terminal(p) {
  const loop = medioDe(p, 'loop.mp4');
  if (!loop) return '';
  const poster = medioDe(p, 'loop-poster.webp');
  return `<figure class="terminal">
<div class="term">
<div class="term-barra"><span class="luces" aria-hidden="true"><i></i><i></i><i></i></span><span class="term-titulo">${esc(p.slug)} · en tu terminal</span>
<button type="button" class="pausa" data-pausa="loop-${p.slug}" aria-label="Reproducir la animación">${ico('pausa', 'i-pausa')}${ico('play', 'i-play')}</button></div>
<video id="loop-${p.slug}" data-loop muted loop playsinline preload="none" poster="${poster ? activo(poster) : posterSVG}" width="768" height="456" aria-label="Así se ve «${esc(p.titulo)}» en la terminal.">
<source src="${activo(loop)}" type="video/mp4">
</video>
</div>
<figcaption>Así se ve en la terminal.</figcaption>
</figure>`;
}

// La postal grande: frente (foto) y reverso (el prompt), con sus acciones.
function mesa(p, { enPortada }) {
  const hT = enPortada ? 'h3' : 'h1';
  const hP = enPortada ? 'h3' : 'h2';
  const url = urlAbs(`/${p.slug}/`);
  const probado = p.probado
    ? `<p class="probado">${ico('check')}<span>Probado en una instalación limpia de ${esc(p.herramienta)}<small>Vos solo lo pegás; lo demás lo hace tu Claude.</small></span></p>`
    : '';
  const pasos = p.pasos.length ? `<div class="pasos"><${hP}>Cómo usarlo</${hP}><ol>${p.pasos.map((x) => `<li><span>${esc(x)}</span></li>`).join('')}</ol></div>` : '';
  const etiquetas = p.etiquetas.length ? `<ul class="etiquetas" aria-label="Etiquetas">${p.etiquetas.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>` : '';
  const masAcciones = `<div class="mas-acciones">
<a class="btn btn-sec" href="/${p.slug}.md" download="${p.slug}.md">${ico('abajo')}<span>Descargar .md</span></a>
<button type="button" class="btn btn-sec" data-compartir data-titulo="${esc(p.titulo)}" data-texto="${esc(p.bajada)}" data-url="${esc(url)}">${ico('compartir')}<span>Compartir</span></button>
</div>`;
  return `<div class="mesa">
<div class="postal" data-postal>
<div class="giro">
<article class="cara frente" aria-labelledby="t-${p.slug}">
<p class="num">Postal Nº ${p.num} · ${esc(fechaCorta(p.fecha))}</p>
<div class="foto-marco">${fotoDe(p, { prioridad: true })}<span class="pista" aria-hidden="true">tocala y se voltea</span></div>
<svg class="estampilla" viewBox="0 0 60 72" aria-hidden="true"><use href="#estampilla"/></svg>
<svg class="matasellos" viewBox="0 0 120 64" aria-hidden="true"><use href="#matasellos-${p.slug}"/></svg>
${SELLO}
<div class="pie-postal">
<${hT} id="t-${p.slug}">${esc(p.titulo)}</${hT}>
<p class="nota">${esc(p.nota)}</p>
</div>
<button type="button" class="tocar" data-voltear aria-label="Voltear la postal para leer el prompt"></button>
</article>
<article class="cara dorso" aria-label="Reverso de la postal: el prompt completo" inert>
<div class="dorso-cabeza">
<p class="titulo-dorso">Postal<small>Nº ${p.num} · para ${esc(p.herramienta)}</small></p>
<svg class="estampilla" viewBox="0 0 60 72" aria-hidden="true"><use href="#estampilla"/></svg>
<svg class="matasellos" viewBox="0 0 120 64" aria-hidden="true"><use href="#matasellos-${p.slug}"/></svg>
${SELLO}
</div>
<div class="carta-marco">
<p class="saludo">Para tu ${esc(p.herramienta)}, tal cual:</p>
<div class="carta" id="carta-${p.slug}" tabindex="0" role="region" aria-label="Texto del prompt">${promptHTML(p.texto)}</div>
<span class="desvanece" aria-hidden="true"></span>
</div>
<p class="direccion" aria-hidden="true"><small>Para</small><span>tu ${esc(p.herramienta)}</span><span>la terminal de tu compu</span><span>donde sea que estés</span></p>
<div class="dorso-pie">
<button type="button" class="mini" data-entera aria-expanded="false" aria-controls="carta-${p.slug}">${ico('abajo')}<span>Ver todo</span></button>
<p class="de">De: Carlos, Chalate</p>
<button type="button" class="mini" data-voltear aria-label="Voltear la postal y ver la foto">${ico('voltear')}<span>Foto</span></button>
</div>
</article>
</div>
</div>
<div class="intro">
<p class="meta">Postal Nº ${p.num} · ${esc(fechaLarga(p.fecha))} · ${esc(p.herramienta)}</p>
${p.video ? `<p class="del-video"><span>Del video</span>«${esc(p.video)}»</p>` : ''}
</div>
<div class="acciones">
<button type="button" class="btn btn-copiar" data-copiar="${p.slug}">${ico('copiar', 'i-copiar')}${ico('check', 'i-check')}<span class="etiqueta">Copiar el prompt</span></button>
<button type="button" class="btn btn-sec btn-voltear" data-voltear aria-pressed="false" aria-label="Voltear la postal">${ico('voltear')}<span>Voltear</span></button>
<p class="aviso" role="status" aria-live="polite"></p>
</div>
<div class="info">
<p class="bajada">${esc(p.bajada)}</p>
${probado}
${masAcciones}
${pasos}
${etiquetas}
${terminal(p)}
</div>
</div>`;
}

// Las demás postales, en chiquito: el frente nada más y un enlace a su página.
function otras(lista, titulo) {
  if (!lista.length) return '';
  return `<section class="otras" aria-labelledby="t-otras">
<h2 id="t-otras">${titulo}</h2>
<ol class="otras-lista">
${lista.map((p) => `<li class="otra"><article class="cara" aria-labelledby="t-o-${p.slug}">
<p class="num">Postal Nº ${p.num} · ${esc(fechaCorta(p.fecha))}</p>
${fotoDe(p)}
<div class="pie-postal"><h3 id="t-o-${p.slug}">${esc(p.titulo)}</h3><p class="nota">${esc(p.nota)}</p></div>
<a class="tapa" href="/${p.slug}/" aria-label="Ver la postal Nº ${p.num}: ${esc(p.titulo)}"></a>
</article></li>`).join('\n')}
</ol>
</section>`;
}

function proximas() {
  const ultimo = Math.max(...prompts.map((p) => p.num));
  const cuantas = Math.max(1, 4 - prompts.length);
  const notas = ['Sale con el próximo video.', 'Todavía sin destino.'];
  const items = [];
  for (let i = 1; i <= cuantas; i++) {
    const n = ultimo + i;
    const final = i === cuantas;
    const cuerpo = final
      ? `<p class="blanca-num">Postal Nº ${n}</p><p class="blanca-nota">¿Qué querés que haga tu Claude?</p>${contacto.instagram ? `<a href="https://ig.me/m/${esc(String(contacto.instagram).replace(/^@/, ''))}" rel="noopener">Pedímela →</a>` : ''}`
      : `<p class="blanca-num">Postal Nº ${n}</p><p class="blanca-nota">${notas[(i - 1) % notas.length]}</p>`;
    items.push(`<li class="blanca"><div class="blanca-msj">${cuerpo}</div><div class="blanca-dir" aria-hidden="true"><span class="sello-vacio">Espe­rando sello</span><i></i><i></i><i></i></div></li>`);
  }
  return `<section class="proximas" aria-labelledby="t-proximas">
<h2 id="t-proximas">Próximas postales</h2>
<p class="sub">Cada video trae su prompt. Estas todavía están en blanco, esperando sello.</p>
<ol class="en-blanco">
${items.join('\n')}
</ol>
${instagram ? `<div class="seguir"><a class="btn btn-sec" href="${esc(instagram)}" rel="me noopener">${ico('camara')}Seguime para que te llegue la próxima</a></div>` : ''}
</section>`;
}

const paleta = () => !conBusqueda ? '' : `<dialog id="paleta" aria-label="Buscar prompts">
<div class="pal-caja">
<div class="pal-entrada">${ico('lupa')}<input id="pal-q" type="text" role="combobox" aria-expanded="true" aria-controls="pal-lista" aria-autocomplete="list" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Buscá un prompt…" aria-label="Buscá un prompt" enterkeyhint="go"><button class="pal-cerrar" type="button" data-cerrar-paleta aria-label="Cerrar">×</button></div>
<div id="pal-lista" role="listbox" aria-label="Resultados"></div>
</div>
</dialog>
<script type="application/json" id="indice-prompts">${jsonTexto(prompts.map((p) => ({ s: p.slug, t: p.titulo, b: p.bajada, e: p.etiquetas, n: p.num })))}</script>`;

function pagina({ titulo, descripcion, ruta, og, ogTitulo, ogAlt, tipo = 'website', cuerpo, clase = '', indexar = true, matas = [], saltar = '#prompt', saltarTexto = 'Saltar al prompt' }) {
  const canon = urlAbs(ruta);
  const metaOg = [
    `<meta property="og:type" content="${tipo}">`,
    `<meta property="og:site_name" content="${esc(config.nombre)}">`,
    `<meta property="og:locale" content="es_SV">`,
    `<meta property="og:title" content="${esc(ogTitulo || titulo)}">`,
    `<meta property="og:description" content="${esc(descripcion)}">`,
    `<meta property="og:url" content="${esc(canon)}">`,
    `<meta property="og:image" content="${esc(og.url)}">`,
    `<meta property="og:image:width" content="${og.w}"><meta property="og:image:height" content="${og.h}">`,
    `<meta property="og:image:alt" content="${esc(ogAlt || ogTitulo || titulo)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(ogTitulo || titulo)}">`,
    `<meta name="twitter:description" content="${esc(descripcion)}">`,
    `<meta name="twitter:image" content="${esc(og.url)}">`,
  ].join('\n');
  const simbolos = matas.map((p) => matasellos(p.slug, p.lugar, p.fecha)).join('') + postalesDeViaje();
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#f2e8d5" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0f1629" media="(prefers-color-scheme: dark)">
<meta name="format-detection" content="telephone=no">
${indexar ? `<link rel="canonical" href="${esc(canon)}">` : '<meta name="robots" content="noindex">'}
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="${fuente('lilita-one.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${fuente('caveat.woff2')}" as="font" type="font/woff2" crossorigin>
${metaOg}
<script>${jsCabeza}</script>
<style>${css}</style>
</head>
<body${clase ? ` class="${clase}"` : ''}>
${sprite(simbolos)}
<a class="saltar" href="${saltar}">${saltarTexto}</a>
${cuerpo}
<div class="llegadas" aria-live="polite"></div>
<div class="brindis" role="status" aria-live="polite"></div>
${paleta()}
<script>${jsCuerpo}</script>
</body>
</html>
`;
}

// ---------- la portada ----------
function portada() {
  const [nuevo, ...resto] = prompts;
  const cuerpo = `${barra()}
${cielo({ nombreEsH1: true })}
<main>
<div class="envoltura">
<p class="lema">${esc(config.lema)}</p>
<section class="destacada" id="prompt" aria-labelledby="t-kicker">
<h2 class="kicker" id="t-kicker">${esc(config.titulo)}</h2>
${mesa(nuevo, { enPortada: true })}
<script type="application/json" id="prompt-${nuevo.slug}">${jsonTexto(nuevo.texto)}</script>
</section>
${otras(resto, 'Más postales')}
${proximas()}
</div>
</main>
${pie()}`;
  return pagina({
    titulo: `${config.nombre} · ${config.titulo}`,
    ogTitulo: `${config.titulo} · ${config.nombre}`,
    descripcion: config.descripcion,
    ruta: '/',
    og: ogSitio,
    ogAlt: `${config.titulo}, de ${config.nombre}`,
    cuerpo,
    clase: 'p-portada',
    matas: [nuevo],
  });
}

// ---------- la página de un prompt ----------
function paginaPrompt(p) {
  const resto = prompts.filter((x) => x !== p);
  const cuerpo = `${barra()}
${cielo({ nombreEsH1: false })}
<main>
<div class="envoltura">
<a class="volver" href="/"><span aria-hidden="true">←</span> Todas las postales</a>
<section class="destacada" id="prompt" aria-labelledby="t-${p.slug}">
<p class="kicker">Prompt para ${esc(p.herramienta)}</p>
${mesa(p, { enPortada: false })}
<script type="application/json" id="prompt-${p.slug}">${jsonTexto(p.texto)}</script>
</section>
${otras(resto, 'Más postales')}
${instagram ? `<div class="seguir"><a class="btn btn-sec" href="${esc(instagram)}" rel="me noopener">${ico('camara')}Seguime para que te llegue la próxima</a></div>` : ''}
</div>
</main>
${pie()}`;
  return pagina({
    titulo: `${p.titulo} · prompt para ${p.herramienta} · ${config.nombre}`,
    ogTitulo: p.titulo,
    descripcion: p.bajada,
    ruta: `/${p.slug}/`,
    og: ogDe(p),
    ogAlt: `${p.titulo}: prompt para ${p.herramienta}`,
    tipo: 'article',
    cuerpo,
    clase: 'p-prompt',
    matas: [p],
  });
}

// ---------- la 404: mi Claude anda fuera ----------
function pagina404() {
  const cuerpo = `${barra()}
${cielo({ nombreEsH1: false, fija: true })}
<main id="contenido" class="envoltura perdido">
<h1>Esta página se fue a la playa.</h1>
<p>Clavó el rótulo y ahorita viene… o mejor andate a la portada: ahí están todos los prompts.</p>
<a class="btn btn-copiar" href="/">${ico('flecha')}<span>Ver los prompts</span></a>
</main>
${pie()}`;
  return pagina({ titulo: `No encontré esa página · ${config.nombre}`, descripcion: config.descripcion, ruta: '/404', og: ogSitio, cuerpo, indexar: false, saltar: '#contenido', saltarTexto: 'Saltar al contenido' });
}

// ---------- escribir ----------
const escribir = (ruta, contenido) => {
  const destino = join(DIST, ruta);
  mkdirSync(join(destino, '..'), { recursive: true });
  writeFileSync(destino, contenido);
};
const paginas = { 'index.html': portada(), '404.html': pagina404() };
for (const p of prompts) paginas[`${p.slug}/index.html`] = paginaPrompt(p);
for (const [ruta, html] of Object.entries(paginas)) escribir(ruta, html);
// El crudo, byte por byte igual a PROMPT.md (es lo que se descarga).
for (const p of prompts) copyFileSync(join(p.dir, 'PROMPT.md'), join(DIST, `${p.slug}.md`));
for (const f of ['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png']) copyFileSync(estatico(f), join(DIST, f));
// El PDF del CV se queda en la raíz: esa URL está impresa en CV que ya se mandaron.
const pdfCv = join(DIST, 'cv', 'Carlos-Recinos-CV.pdf');
if (existsSync(pdfCv)) renameSync(pdfCv, join(DIST, 'Carlos-Recinos-CV.pdf'));
else if (existsSync(join(RAIZ, 'public', 'Carlos-Recinos-CV.pdf'))) copyFileSync(join(RAIZ, 'public', 'Carlos-Recinos-CV.pdf'), join(DIST, 'Carlos-Recinos-CV.pdf'));
escribir('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${config.url}/sitemap.xml\n`);
const hoy = new Date().toISOString().slice(0, 10);
const urls = [
  { loc: '/', mod: prompts[0].fecha },
  { loc: '/cv/', mod: null },
  ...prompts.map((p) => ({ loc: `/${p.slug}/`, mod: p.fecha })),
];
escribir('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
  .map((u) => `  <url><loc>${config.url}${u.loc}</loc>${u.mod ? `<lastmod>${u.mod > hoy ? hoy : u.mod}</lastmod>` : ''}</url>`)
  .join('\n')}\n</urlset>\n`);

// ---------- guardas ----------
const fallas = [];
// Reglas de la marca (ver CLAUDE.md): la mascota es «mi Claude», y la portada habla de los prompts, no de cómo
// se hace nada. Si una de estas frases aparece, el build para y alguien la revisa.
const PROHIBIDO = /cangrejo|clawd|hech[oa]s? con |generad[oa]s? con |todo es c[oó]digo/i;
// Repo y sitio públicos: nada de rutas de las máquinas de Carlos.
const INTERNO = /\/Users\/|\/home\/[a-z]|\/mnt\/datos|\/private\/tmp|PRUEBA\.md/;
(function revisar(dir) {
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const r = join(dir, f.name);
    if (f.isDirectory()) { if (!(dir === DIST && f.name === 'cv')) revisar(r); continue; }
    if (!/\.(html|md|txt|xml)$/.test(f.name)) continue;
    const s = readFileSync(r, 'utf8');
    const visible = s.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
    let m;
    if ((m = visible.match(PROHIBIDO)) || (/\.md$/.test(f.name) && (m = s.match(PROHIBIDO)))) fallas.push(`${r.replace(DIST, 'dist')}: dice «${m[0]}»`);
    if ((m = s.match(INTERNO))) fallas.push(`${r.replace(DIST, 'dist')}: ruta interna «${m[0]}»`);
  }
})(DIST);
// Copiar copia PROMPT.md exacto: el JSON incrustado tiene que volver a dar el mismo texto.
for (const p of prompts) {
  for (const ruta of [`${p.slug}/index.html`, ...(p === prompts[0] ? ['index.html'] : [])]) {
    const m = paginas[ruta].match(new RegExp(`<script type="application/json" id="prompt-${p.slug}">([\\s\\S]*?)</script>`));
    if (!m || JSON.parse(m[1]) !== readFileSync(join(p.dir, 'PROMPT.md'), 'utf8')) fallas.push(`${ruta}: el texto incrustado de ${p.slug} no es idéntico a PROMPT.md`);
  }
}
const kbJs = (Buffer.byteLength(jsCabeza) + Buffer.byteLength(jsCuerpo)) / 1024;
if (kbJs > 30) fallas.push(`el JS propio pesa ${kbJs.toFixed(1)} KB (tope 30 KB)`);
const kbHtml = Buffer.byteLength(paginas['index.html']) / 1024;
const primera = Buffer.byteLength(paginas['index.html']) + ['lilita-one.woff2', 'caveat.woff2', 'silkscreen.woff2', 'jetbrains-mono.woff2'].reduce((n, f) => n + pesos.get(fuente(f)), 0) + (pesos.get(activo(medioDe(prompts[0], 'tarjeta.webp') || estatico('og.jpg'))) || 0);
if (primera > 500 * 1024) fallas.push(`la primera carga de / pesa ${(primera / 1024).toFixed(0)} KB sin comprimir (tope 500 KB)`);
if (fallas.length) {
  console.error('✗ El sitio no sale así:\n  ' + fallas.join('\n  '));
  process.exit(1);
}
console.log(`✓ dist/ listo: ${prompts.length} prompt(s) [${prompts.map((p) => p.slug).join(', ')}] · búsqueda ${conBusqueda ? 'sí' : `no (aparece desde ${BUSQUEDA_DESDE})`}`);
console.log(`  JS propio ${kbJs.toFixed(1)} KB · CSS ${(Buffer.byteLength(css) / 1024).toFixed(1)} KB · index.html ${kbHtml.toFixed(1)} KB · primera carga de / ≈ ${(primera / 1024).toFixed(0)} KB sin comprimir`);
