// Lo que comparten site/build.mjs y las herramientas: config, prompts y formatos. Solo módulos de Node.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SITIO = dirname(fileURLToPath(import.meta.url));
export const RAIZ = resolve(SITIO, '..');
export const DIR_PROMPTS = join(RAIZ, 'content/prompts');

export function leerConfig() {
  const config = JSON.parse(readFileSync(join(SITIO, 'sitio.config.json'), 'utf8'));
  config.url = String(config.url || '').replace(/\/+$/, '');
  if (!/^https:\/\//.test(config.url)) throw new Error('site/sitio.config.json: "url" tiene que ser https://…');
  config.contacto = config.contacto || {};
  return config;
}

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
// Dónde se sella cada postal si el meta.json no dice "lugar" (va por número de postal).
const LUGARES = ['El Tunco', 'Chalate', 'Suchitoto', 'Coatepeque', 'Juayúa', 'Ataco', 'El Zonte', 'Perquín'];

// Lee content/prompts/<slug>/{meta.json,PROMPT.md,medios/}. Se salta carpetas con _ o . y los borradores.
export function cargarPrompts(dir = DIR_PROMPTS) {
  if (!existsSync(dir)) throw new Error(`No hay carpeta de prompts en ${dir}`);
  const prompts = [];
  for (const slug of readdirSync(dir).sort()) {
    if (slug.startsWith('.') || slug.startsWith('_')) continue;
    const base = join(dir, slug);
    if (!statSync(base).isDirectory()) continue;
    const metaPath = join(base, 'meta.json');
    const mdPath = join(base, 'PROMPT.md');
    if (!existsSync(metaPath) || !existsSync(mdPath)) {
      console.warn(`  · ${slug}: falta meta.json o PROMPT.md, lo salto`);
      continue;
    }
    let meta;
    try {
      meta = JSON.parse(readFileSync(metaPath, 'utf8'));
    } catch (e) {
      throw new Error(`${slug}/meta.json no es JSON válido: ${e.message}`);
    }
    if (meta.borrador === true) continue;
    const errores = [];
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) errores.push('el nombre de la carpeta tiene que ser-asi (minúsculas y guiones)');
    if (meta.slug && meta.slug !== slug) errores.push(`"slug" (${meta.slug}) no coincide con la carpeta`);
    for (const campo of ['titulo', 'bajada', 'fecha']) {
      if (typeof meta[campo] !== 'string' || !meta[campo].trim()) errores.push(`falta "${campo}"`);
    }
    if (meta.fecha && !FECHA.test(meta.fecha)) errores.push('"fecha" va como AAAA-MM-DD');
    if (meta.como_usarlo != null && !Array.isArray(meta.como_usarlo)) errores.push('"como_usarlo" tiene que ser una lista');
    if (meta.etiquetas != null && !Array.isArray(meta.etiquetas)) errores.push('"etiquetas" tiene que ser una lista');
    // El texto se copia tal cual: no se normaliza nada (ni finales de línea), así Copiar = PROMPT.md.
    const texto = readFileSync(mdPath, 'utf8');
    if (!texto.trim()) errores.push('PROMPT.md está vacío');
    if (/\r/.test(texto)) errores.push('PROMPT.md trae finales de línea de Windows (\\r\\n): guardalo con \\n');
    if (errores.length) throw new Error(`content/prompts/${slug}: ${errores.join('; ')}`);

    const bajada = meta.bajada.trim();
    // La nota a mano del frente de la postal: "nota" en meta.json, o lo que va después de los dos puntos de la bajada.
    let nota = typeof meta.nota === 'string' ? meta.nota.trim() : '';
    if (!nota) {
      const tras = bajada.includes(':') ? bajada.slice(bajada.indexOf(':') + 1).trim() : bajada;
      nota = tras.charAt(0).toUpperCase() + tras.slice(1);
    }
    prompts.push({
      slug,
      titulo: meta.titulo.trim(),
      bajada,
      nota,
      fecha: meta.fecha,
      herramienta: (meta.herramienta || 'Claude Code').trim(),
      etiquetas: (meta.etiquetas || []).map((e) => String(e).trim()).filter(Boolean),
      video: typeof meta.video === 'string' ? meta.video.trim() : '',
      pasos: (meta.como_usarlo || []).map((p) => String(p).trim()).filter(Boolean),
      probado: !!meta.probado,
      lugarMeta: typeof meta.lugar === 'string' ? meta.lugar.trim() : '',
      texto,
      dir: base,
    });
  }
  // Nº de postal = orden de salida (la más vieja es la Nº 1). Se muestran de la más nueva a la más vieja.
  prompts.sort((a, b) => (a.fecha === b.fecha ? a.slug.localeCompare(b.slug) : a.fecha < b.fecha ? -1 : 1));
  prompts.forEach((p, i) => {
    p.num = i + 1;
    p.lugar = p.lugarMeta || LUGARES[i % LUGARES.length];
  });
  return prompts.reverse();
}

export const medioDe = (p, archivo) => {
  const r = join(p.dir, 'medios', archivo);
  return existsSync(r) ? r : null;
};

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export function fechaPartes(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return { a, m, d, mes: MESES[m - 1], mes3: MESES[m - 1].slice(0, 3) };
}
export const fechaCorta = (iso) => { const f = fechaPartes(iso); return `${f.d} ${f.mes3} ${f.a}`; };
export const fechaLarga = (iso) => { const f = fechaPartes(iso); return `${f.d} de ${f.mes} de ${f.a}`; };

export function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function urlInstagram(valor) {
  if (!valor) return null;
  const v = String(valor).trim();
  if (/^https:\/\//.test(v)) return v;
  return `https://www.instagram.com/${v.replace(/^@/, '')}/`;
}
