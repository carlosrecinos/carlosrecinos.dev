#!/usr/bin/env node
// Revisa el sitio en navegadores de verdad antes de publicar (o contra un preview de Vercel):
//  · capturas a 390×844, 390×664 (el alto que deja Instagram) y 1280×800, en claro y oscuro, y a dos horas
//  · «Copiar» deja el texto EXACTO de PROMPT.md: Chromium (moderno, sin API y con agente de Instagram)
//    y WebKit con perfil de iPhone (también con agente de Instagram)
//  · Copiar visible sin scroll a 390×664 · sin scroll horizontal · botones de ≥ 44 px · sin errores en consola
//  · mi Claude: se duerme, se va, manda postal y vuelve con aviso (y con «menos movimiento», sin moverse)
//  · /cv/, /<slug>.md idéntico, /Carlos-Recinos-CV.pdf, la 404 · peso de la primera carga y JS propio
//   npm run verificar                         → contra dist/ servido en local
//   npm run verificar -- https://<preview>    → contra un deploy (capturas en la carpeta de salida)
//   SALIDA=/ruta/capturas npm run verificar
import { readFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { cargarPrompts, leerConfig } from '../lib.mjs';
import { servir } from '../servir.mjs';

const pw = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { chromium, webkit, devices } = pw;
const config = leerConfig();
const prompts = cargarPrompts();
const SALIDA = resolve(process.env.SALIDA || join(tmpdir(), 'capturas-carlosrecinos-dev'));
mkdirSync(SALIDA, { recursive: true });
let servidor = null;
let BASE = process.argv[2];
if (!BASE) { servidor = await servir(0); BASE = `http://127.0.0.1:${servidor.address().port}`; }
BASE = BASE.replace(/\/+$/, '');
const remoto = !servidor;
// Si el preview tiene protección de Vercel: VERCEL_BYPASS=<secreto> agrega la cabecera de bypass.
const cabeceras = process.env.VERCEL_BYPASS ? { 'x-vercel-protection-bypass': process.env.VERCEL_BYPASS, 'x-vercel-set-bypass-cookie': 'true' } : {};

const fallas = [];
const ok = (cond, msj) => { console.log(`  ${cond ? '✓' : '✗'} ${msj}`); if (!cond) fallas.push(msj); };
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const p0 = prompts[0];

const MOVIL = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
const IG = { viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
const ESCRITORIO = { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 };
const UA_IG = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22F76 Instagram 390.0.0.27.81 (iPhone14,5; iOS 18_5; es_SV; es; scale=3.00; 1170x2532; 712345678)';

const nav = await chromium.launch();
const navWk = await webkit.launch();
async function abrir(b, opciones, ruta, { init } = {}) {
  const ctx = await b.newContext({ ...opciones, extraHTTPHeaders: { ...cabeceras, ...(opciones.extraHTTPHeaders || {}) } });
  if (init) await ctx.addInitScript(init);
  const pagina = await ctx.newPage();
  const errores = [];
  pagina.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  pagina.on('pageerror', (e) => errores.push(e.message));
  const resp = await pagina.goto(BASE + ruta, { waitUntil: 'networkidle' });
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.waitForTimeout(400);
  return { ctx, pagina, errores, resp };
}
async function revisarDiseno(pagina, nombre, ancho) {
  const r = await pagina.evaluate(() => {
    const chicos = [...document.querySelectorAll('button, a.btn, a.chip, .volver')]
      .filter((e) => e.offsetParent && !e.closest('[hidden], [inert], .dorso'))
      .map((e) => ({ t: (e.getAttribute('aria-label') || e.textContent).trim().slice(0, 30), h: Math.round(e.getBoundingClientRect().height), w: Math.round(e.getBoundingClientRect().width) }))
      .filter((e) => e.h < 44 || e.w < 44);
    return { ancho: document.documentElement.scrollWidth, chicos };
  });
  ok(r.ancho <= ancho, `${nombre}: sin scroll horizontal (${r.ancho}px)`);
  ok(!r.chicos.length, `${nombre}: botones de ≥ 44 px ${r.chicos.length ? JSON.stringify(r.chicos) : ''}`);
}

try {
  // 1) Capturas y diseño
  console.log('· capturas →', SALIDA);
  const TOMAS = [
    ['portada-390-claro', MOVIL, 'light', '/?hora=15:20', true],
    ['portada-390-oscuro', MOVIL, 'dark', '/?hora=15:20', true],
    ['portada-1280-claro', ESCRITORIO, 'light', '/?hora=15:20', true],
    ['portada-1280-oscuro', ESCRITORIO, 'dark', '/?hora=15:20', true],
    ['portada-390-noche-oscuro', MOVIL, 'dark', '/?hora=21:10'],
    ['portada-390-atardecer-claro', MOVIL, 'light', '/?hora=17:35'],
    ['portada-1280-noche-oscuro', ESCRITORIO, 'dark', '/?hora=21:10'],
    ['portada-1280-amanecer-claro', ESCRITORIO, 'light', '/?hora=6:10'],
    ['portada-390x664-ig', IG, 'light', '/?hora=15:20'],
    [`${p0.slug}-390-claro`, MOVIL, 'light', `/${p0.slug}/?hora=15:20`, true],
    [`${p0.slug}-1280-oscuro`, ESCRITORIO, 'dark', `/${p0.slug}/?hora=21:10`, true],
    ['404-390-claro', MOVIL, 'light', '/no-existe/?hora=15:20'],
    ['404-1280-oscuro', ESCRITORIO, 'dark', '/no-existe/?hora=21:10'],
  ];
  for (const [nombre, vista, esquema, ruta, completa] of TOMAS) {
    const { ctx, pagina, errores } = await abrir(nav, { ...vista, colorScheme: esquema, locale: 'es-SV' }, ruta);
    await pagina.screenshot({ path: join(SALIDA, `${nombre}.png`) });
    if (completa) await pagina.screenshot({ path: join(SALIDA, `${nombre}-completa.png`), fullPage: true });
    await revisarDiseno(pagina, nombre, vista.viewport.width);
    const errs = nombre.startsWith('404') ? errores.filter((x) => !/status of 404/.test(x)) : errores; // la 404 responde 404, a propósito
    ok(!errs.length, `${nombre}: sin errores en consola ${errs.join(' | ')}`);
    if (vista === IG) {
      const c = await pagina.locator('.btn-copiar').first().boundingBox();
      const t = await pagina.locator('.postal .pie-postal h3, .postal .pie-postal h1').first().boundingBox();
      ok(c && c.y + c.height <= 664, `${nombre}: «Copiar» se ve sin scroll (termina en y=${c && Math.round(c.y + c.height)} de 664)`);
      ok(t && t.y < 664, `${nombre}: el prompt destacado asoma sin scroll (título en y=${t && Math.round(t.y)})`);
    }
    await ctx.close();
  }

  // 2) Peso de la primera carga y JS propio (Chromium, contexto nuevo = sin caché)
  {
    const ctx = await nav.newContext({ ...MOVIL, extraHTTPHeaders: cabeceras });
    const pagina = await ctx.newPage();
    const cdp = await ctx.newCDPSession(pagina);
    await cdp.send('Network.enable');
    const urls = new Map(), fin = new Map();
    cdp.on('Network.requestWillBeSent', (e) => urls.set(e.requestId, e.request.url.replace(BASE, '')));
    cdp.on('Network.loadingFinished', (e) => fin.set(e.requestId, e.encodedDataLength));
    await pagina.goto(BASE + '/', { waitUntil: 'networkidle' });
    await pagina.waitForTimeout(1500);
    const detalle = [...urls].map(([id, u]) => [u, fin.get(id) || 0]);
    const total = detalle.reduce((a, [, n]) => a + n, 0);
    const js = await pagina.evaluate(() => [...document.querySelectorAll('script:not([type])')].reduce((n, s) => n + new Blob([s.textContent]).size, 0));
    const externos = await pagina.evaluate(() => [...document.querySelectorAll('script[src]')].length);
    console.log(`· primera carga de / a 390: ${kb(total)} ${remoto ? '(por la red, comprimido)' : '(servidor local, sin comprimir: es un techo)'}`);
    for (const [u, n] of detalle) console.log(`    ${u.slice(0, 70)} ${kb(n)}`);
    ok(total < 500 * 1024, `primera carga < 500 KB (${kb(total)})`);
    ok(js < 30 * 1024 && externos === 0, `JS propio < 30 KB (${kb(js)}, ${externos} scripts externos)`);
    await ctx.close();
  }

  // 3) Copiar: el texto exacto de PROMPT.md
  const esperado = readFileSync(join(p0.dir, 'PROMPT.md'), 'utf8');
  const ESPIA = () => {
    window.__copiado = [];
    const ex = document.execCommand.bind(document);
    document.execCommand = function (c) { const r = ex.apply(document, arguments); if (c === 'copy') { const ta = document.querySelector('body > textarea[readonly]'); window.__copiado.push(['vieja', r, ta && ta.value]); } return r; };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      const w = navigator.clipboard.writeText.bind(navigator.clipboard);
      navigator.clipboard.writeText = (t) => w(t).then((x) => { window.__copiado.push(['moderna', true, t]); return x; }, (e) => { window.__copiado.push(['moderna', false, t]); throw e; });
    }
  };
  const SIN_API = () => Object.defineProperty(Navigator.prototype, 'clipboard', { get: () => undefined });
  const CASOS = [
    ['chromium · portapapeles moderno', nav, { ...MOVIL, permissions: ['clipboard-read', 'clipboard-write'] }, null],
    ['chromium · sin API (vía vieja)', nav, { ...MOVIL, permissions: ['clipboard-read', 'clipboard-write'] }, SIN_API],
    ['chromium · agente de Instagram', nav, { ...MOVIL, userAgent: UA_IG, permissions: ['clipboard-read', 'clipboard-write'] }, null],
    ['webkit · iPhone', navWk, { ...devices['iPhone 13'] }, null],
    ['webkit · iPhone 390×664 con agente de Instagram', navWk, { ...devices['iPhone 13'], viewport: { width: 390, height: 664 }, userAgent: UA_IG }, null],
  ];
  for (const [nombre, b, vista, init] of CASOS) {
    for (const ruta of ['/', `/${p0.slug}/`]) {
      const { ctx, pagina, errores } = await abrir(b, vista, ruta + '?hora=15:20', { init: init ? `(${ESPIA})();(${init})();` : `(${ESPIA})();` });
      const btn = pagina.locator(`.acciones [data-copiar="${p0.slug}"]`);
      await btn.click();
      await pagina.waitForTimeout(250);
      const etiqueta = (await btn.locator('.etiqueta').textContent()).trim();
      const espia = await pagina.evaluate(() => window.__copiado);
      const exitoso = espia.find((x) => x[1]);
      if (ruta === '/' && nombre.startsWith('webkit · iPhone 390')) await pagina.screenshot({ path: join(SALIDA, 'copiado-webkit-390x664-ig.png') });
      if (ruta === '/' && nombre === 'chromium · portapapeles moderno') await pagina.screenshot({ path: join(SALIDA, 'copiado-390-confeti.png') });
      let pegado = null;
      if (b === nav) {
        // el portapapeles es del navegador entero: se lee desde otro contexto, con la API intacta
        const lector = await (await nav.newContext({ permissions: ['clipboard-read', 'clipboard-write'], extraHTTPHeaders: cabeceras })).newPage();
        await lector.goto(BASE + '/no-existe/');
        pegado = await lector.evaluate(() => navigator.clipboard.readText());
        await lector.context().close();
      } else {
        // WebKit: se pega con el teclado en un campo nuevo, como lo haría la gente
        pegado = await pagina.evaluate(() => { const ta = document.createElement('textarea'); ta.id = '__pega'; document.body.appendChild(ta); ta.focus(); return null; });
        await pagina.keyboard.press('Meta+v');
        await pagina.waitForTimeout(200);
        pegado = await pagina.evaluate(() => document.getElementById('__pega').value) || null;
      }
      const sello = await pagina.evaluate(() => document.querySelector('[data-postal]').classList.contains('sellada'));
      ok(exitoso && exitoso[2] === esperado, `copiar · ${nombre} · ${ruta}: se copió el texto exacto por la vía ${exitoso ? exitoso[0] : '—'} (${exitoso && exitoso[2] ? exitoso[2].length : 0}/${esperado.length})`);
      if (pegado !== null) ok(pegado === esperado, `copiar · ${nombre} · ${ruta}: lo pegado es idéntico a PROMPT.md`);
      else console.log(`  · copiar · ${nombre} · ${ruta}: este navegador sin pantalla no deja pegar; vale la verificación de arriba`);
      ok(etiqueta === '¡Copiado!' && sello, `copiar · ${nombre} · ${ruta}: el botón dice «${etiqueta}» y la postal quedó sellada`);
      ok(!errores.length, `copiar · ${nombre} · ${ruta}: sin errores ${errores.join(' | ')}`);
      await ctx.close();
    }
  }

  // 4) Voltear, contacto y el reverso
  {
    const { ctx, pagina } = await abrir(nav, { ...MOVIL, colorScheme: 'light' }, '/?hora=17:35');
    await pagina.locator('.btn-voltear').click();
    await pagina.waitForTimeout(1000);
    ok(await pagina.evaluate(() => document.querySelector('.frente').hasAttribute('inert') && !document.querySelector('.dorso').hasAttribute('inert')), 'voltear: el reverso queda activo y el frente inerte');
    await pagina.screenshot({ path: join(SALIDA, 'volteada-390.png') });
    await pagina.locator('.btn-voltear').click();
    await pagina.waitForTimeout(900);
    await pagina.locator('[data-contacto]').click();
    await pagina.waitForTimeout(250);
    const vias = await pagina.locator('.menu-contacto .via a').evaluateAll((as) => as.map((a) => a.href));
    ok(vias.length === 3 && /^https:\/\/wa\.me\/\d+\?text=/.test(vias[0]) && /^mailto:/.test(vias[1]) && /ig\.me/.test(vias[2]), `contacto: WhatsApp, correo e Instagram, en ese orden (${vias.map((v) => v.split(/[?:]/)[0] + ':' + v.split(/[/:@]/).pop().slice(0, 18)).join(' · ')})`);
    await pagina.screenshot({ path: join(SALIDA, 'contacto-390.png') });
    await ctx.close();
  }

  // 5) Mi Claude con los tiempos apurados (?mascota=apurada: todo ÷ 10)
  for (const quieto of [false, true]) {
    const etiqueta = quieto ? 'con menos movimiento' : 'normal';
    const { ctx, pagina, errores } = await abrir(nav, { ...MOVIL, reducedMotion: quieto ? 'reduce' : 'no-preference' }, '/?mascota=apurada&hora=15:20');
    const estado = () => pagina.evaluate(() => ({ modo: __mascota.M.modo, x: __mascota.M.x, rotulo: document.getElementById('rotulo').getAttribute('class'), mc: document.getElementById('mc').getAttribute('transform'), viaje: !!document.querySelector('.llegadas .viaje'), brindis: document.querySelector('.brindis').textContent }));
    await pagina.waitForTimeout(2600);
    ok((await estado()).modo === 'dormido', `mi Claude (${etiqueta}): a los 20 s se duerme`);
    await pagina.waitForTimeout(quieto ? 2300 : 9500);
    let e = await estado();
    ok(e.modo === 'fuera' && /alzado/.test(e.rotulo), `mi Claude (${etiqueta}): a los 45 s clava el rótulo y se va (${e.modo})`);
    await pagina.waitForTimeout(800);
    e = await estado();
    ok(e.viaje, `mi Claude (${etiqueta}): manda una postal de dónde anda`);
    if (!quieto) await pagina.screenshot({ path: join(SALIDA, 'mascota-fuera-postal-390.png') });
    await pagina.mouse.click(30, 270);
    await pagina.waitForTimeout(quieto ? 300 : 3100);
    e = await estado();
    // (con los tiempos apurados se vuelve a dormir enseguida: lo que importa es que volvió y avisó)
    ok(/^¡Tu Claude volvió .+! · estuviste fuera \d/.test(e.brindis) && e.modo !== 'fuera' && !/alzado/.test(e.rotulo), `mi Claude (${etiqueta}): vuelve, arranca el rótulo y avisa «${e.brindis}»`);
    if (!quieto) await pagina.screenshot({ path: join(SALIDA, 'mascota-volvio-390.png') });
    ok(!errores.length, `mi Claude (${etiqueta}): sin errores ${errores.join(' | ')}`);
    await ctx.close();
  }

  // 6) Lo que tiene que responder igual que siempre
  const pedir = (r, o) => fetch(BASE + r, { redirect: 'manual', headers: cabeceras, ...o });
  for (const p of prompts) {
    const r = await pedir(`/${p.slug}.md`);
    const crudo = await r.text();
    ok(r.status === 200 && crudo === readFileSync(join(p.dir, 'PROMPT.md'), 'utf8'), `/${p.slug}.md: 200 e idéntico a PROMPT.md`);
    ok(/text\/markdown/.test(r.headers.get('content-type') || ''), `/${p.slug}.md: Content-Type ${r.headers.get('content-type')}`);
  }
  const pdf = await pedir('/Carlos-Recinos-CV.pdf');
  ok(pdf.status === 200 && /pdf/.test(pdf.headers.get('content-type') || ''), `/Carlos-Recinos-CV.pdf: ${pdf.status} ${pdf.headers.get('content-type')}`);
  const nada = await pedir('/no-existe/');
  ok(nada.status === 404 && /se fue a la playa/.test(await nada.text()), `/no-existe/: 404 con la página propia`);
  const sinBarra = await pedir(`/${p0.slug}`);
  ok([301, 308].includes(sinBarra.status), `/${p0.slug} → ${sinBarra.status} ${sinBarra.headers.get('location')}`);
  for (const f of ['/robots.txt', '/sitemap.xml']) {
    const r = await pedir(f);
    const t = await r.text();
    ok(r.status === 200 && t.includes(`${config.url}/`) && (f === '/robots.txt' || (t.includes('/cv/') && prompts.every((p) => t.includes(`/${p.slug}/`)))), `${f}: 200 y con lo que tiene que listar`);
  }
  {
    const { ctx, pagina, errores } = await abrir(nav, { ...MOVIL }, '/cv/');
    const info = await pagina.evaluate(() => ({ titulo: document.title, canon: document.querySelector('link[rel=canonical]')?.href, og: document.querySelector('meta[property="og:image"]')?.content, pdf: [...document.querySelectorAll('a')].some((a) => a.getAttribute('href') === '/Carlos-Recinos-CV.pdf'), alto: document.documentElement.scrollHeight }));
    ok(/Carlos Recinos/.test(info.titulo) && info.canon === `${config.url}/cv/` && info.og === `${config.url}/cv/og.png` && info.pdf, `/cv/: el portafolio carga (canonical ${info.canon}, og ${info.og}, PDF en la raíz)`);
    ok(!errores.length, `/cv/: sin errores ${errores.join(' | ')}`);
    await ctx.close();
  }
} finally {
  await nav.close();
  await navWk.close();
  if (servidor) servidor.close();
}

console.log(`\nCapturas en ${SALIDA}`);
if (fallas.length) { console.error(`✗ ${fallas.length} falla(s)`); process.exit(1); }
console.log('✓ todo bien');
