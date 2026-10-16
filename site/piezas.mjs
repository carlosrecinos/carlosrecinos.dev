// Piezas de la postal: íconos pixelados, estampilla, matasellos, sello de «¡COPIADO!» y el prompt reacomodado
// para leerse en el reverso. Todo sale como texto SVG/HTML: el build lo incrusta.
import { MASCOTA } from './escena.mjs';
import { esc, fechaPartes } from './lib.mjs';

// ---------- íconos pixelados de 12×12 ----------
function filasAPath(rows) {
  let d = '';
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (row[x] !== '#') { x++; continue; }
      const s = x;
      while (row[x] === '#') x++;
      d += `M${s} ${y}h${x - s}v1h${s - x}z`;
    }
  });
  return d;
}
const ICONOS = {
  copiar: ['#######.....', '#.....#.....', '#.....#.....', '#..#######..', '#..#.....#..', '#..#.....#..', '####.....#..', '...#.....#..', '...#.....#..', '...#######..', '............', '............'],
  check: ['............', '..........##', '.........##.', '........##..', '.......##...', '##....##....', '.##..##.....', '..####......', '...##.......', '............', '............', '............'],
  voltear: ['...######...', '..#......#..', '.#........#.', '.#.......###', '#.........#.', '#...........', '...........#', '.#.........#', '###.......#.', '.#........#.', '..#......#..', '...######...'],
  camara: ['............', '..####......', '############', '#..........#', '#...####...#', '#..#....#..#', '#..#....#..#', '#..#....#..#', '#...####...#', '#..........#', '############', '............'],
  sobre: ['............', '............', '############', '##........##', '#.#......#.#', '#..#....#..#', '#...#..#...#', '#....##....#', '#..........#', '############', '............', '............'],
  chat: ['..########..', '.#........#.', '#..........#', '#..#..#..#.#', '#..........#', '#..........#', '.#........#.', '..###.####..', '....#.#.....', '....##......', '............', '............'],
  avion: ['...........#', '.........###', '.......##.#.', '.....##...#.', '...##....#..', '.##.....#...', '...#...#....', '....#.#.....', '....##......', '....#.......', '............', '............'],
  sol: ['.....##.....', '.#........#.', '..#......#..', '....####....', '...######...', '#..######..#', '#..######..#', '...######...', '....####....', '..#......#..', '.#........#.', '.....##.....'],
  luna: ['..####....#.', '.###.....###', '###.......#.', '###.........', '##..........', '##..........', '##.........#', '###.......##', '###......###', '.####..####.', '..########..', '....####....'],
  doc: ['.######.....', '.#....##....', '.#....#.#...', '.#....####..', '.#.......#..', '.#.####..#..', '.#.......#..', '.#.#####.#..', '.#.......#..', '.#.#####.#..', '.#.......#..', '.#########..'],
  caret: ['............', '............', '............', '############', '.##########.', '..########..', '...######...', '....####....', '.....##.....', '............', '............', '............'],
  abajo: ['.....##.....', '.....##.....', '.....##.....', '.....##.....', '.....##.....', '.##..##..##.', '..##.##.##..', '...######...', '....####....', '.....##.....', '............', '############'],
  play: ['............', '...##.......', '...####.....', '...######...', '...########.', '...########.', '...######...', '...####.....', '...##.......', '............', '............', '............'],
  pausa: ['............', '...##..##...', '...##..##...', '...##..##...', '...##..##...', '...##..##...', '...##..##...', '...##..##...', '...##..##...', '............', '............', '............'],
  compartir: ['.....##.....', '....####....', '...######...', '.....##.....', '.....##.....', '.....##.....', '.....##.....', '##........##', '##........##', '##........##', '############', '############'],
  lupa: ['..#####.....', '.#.....#....', '#.......#...', '#.......#...', '#.......#...', '#.......#...', '.#.....#....', '..#####.#...', '.........#..', '..........#.', '...........#', '............'],
  flecha: ['............', '......#.....', '.......#....', '........#...', '.........#..', '############', '.........#..', '........#...', '.......#....', '......#.....', '............', '............'],
};
export const ico = (nombre, clase = '') =>
  `<svg class="ico${clase ? ' ' + clase : ''}" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="${filasAPath(ICONOS[nombre])}"/></svg>`;

// ---------- estampilla, matasellos y sello de «copiado» ----------
function perforaciones(w, h, paso, rad) {
  let c = '';
  for (let x = paso / 2; x < w; x += paso) c += `<circle cx="${x}" cy="0" r="${rad}"/><circle cx="${x}" cy="${h}" r="${rad}"/>`;
  for (let y = paso / 2; y < h; y += paso) c += `<circle cx="0" cy="${y}" r="${rad}"/><circle cx="${w}" cy="${y}" r="${rad}"/>`;
  return c;
}
function estampilla() {
  const bandas = ['#fbe2b4', '#f9cf98', '#f6b882', '#f29c6b', '#ec8059'];
  let cielo = '';
  bandas.forEach((c, i) => (cielo += `<rect x="5" y="${13 + i * 6}" width="50" height="6" fill="${c}"/>`));
  let solD = '';
  for (let y = -6; y < 6; y++) { const yc = y + 0.5; const h = Math.round(Math.sqrt(36 - yc * yc)); if (h) solD += `M${42 - h} ${40 + y}h${2 * h}v1h${-2 * h}z`; }
  return `<symbol id="estampilla" viewBox="0 0 60 72">
<mask id="perf" maskUnits="userSpaceOnUse" x="-2" y="-2" width="64" height="76"><rect x="-2" y="-2" width="64" height="76" fill="#fff"/><g fill="#000">${perforaciones(60, 72, 6, 2.3)}</g></mask>
<g mask="url(#perf)"><rect width="60" height="72" fill="#fffdf6"/>
<g shape-rendering="crispEdges">${cielo}<path fill="#fbe7a1" d="${solD}"/><rect x="5" y="41" width="50" height="9" fill="#1f9aa6"/><path fill="#e8fbff" opacity=".6" d="M8 43h6v1H8zM26 45h8v1h-8zM44 43h7v1h-7zM14 47h5v1h-5z"/><rect x="5" y="50" width="50" height="6" fill="#efd29a"/>
<g transform="translate(18 29)"><path fill="#f2c14e" d="${MASCOTA.corona}"/><path fill="#e04e5a" d="${MASCOTA.joyas}"/><path fill="#db7758" d="${MASCOTA.cuerpo}"/><path fill="#2a1a12" d="${MASCOTA.ojos}"/></g></g>
<rect x="5" y="5" width="50" height="62" fill="none" stroke="#2a1d14" stroke-width=".8"/>
<text x="30" y="11.2" text-anchor="middle" font-family="Silkscreen,monospace" font-size="5" fill="#2a1d14">EL SALVADOR</text>
<text x="30" y="64.6" text-anchor="middle" font-family="Silkscreen,monospace" font-size="5.6" fill="#b4342b">GRATIS</text></g>
</symbol>`;
}
export function matasellos(id, lugar, fechaIso) {
  const f = fechaPartes(fechaIso);
  let ondas = '';
  for (const y of [18, 27, 36, 45]) ondas += `<path d="M60 ${y}q6-4 12 0t12 0t12 0t12 0t10 0"/>`;
  const L = esc(lugar.toUpperCase());
  return `<symbol id="matasellos-${id}" viewBox="0 0 120 64">
<g fill="none" stroke="currentColor"><circle cx="32" cy="32" r="27" stroke-width="1.8"/><circle cx="32" cy="32" r="19" stroke-width="1"/><g stroke-width="1.6">${ondas}</g></g>
<path id="ms-a-${id}" d="M11 32a21 21 0 0 1 42 0" fill="none"/><path id="ms-b-${id}" d="M7.6 32a24.4 24.4 0 0 0 48.8 0" fill="none"/>
<g fill="currentColor" font-family="Silkscreen,monospace" text-anchor="middle"><text font-size="${L.length > 9 ? 4.8 : 5.6}"><textPath href="#ms-a-${id}" startOffset="50%">${L}</textPath></text>
<text font-size="5.2"><textPath href="#ms-b-${id}" startOffset="50%">EL SALVADOR</textPath></text>
<text x="32" y="32" font-size="7.4">${f.d} ${f.mes3.toUpperCase()}</text><text x="32" y="41" font-size="6.4">${f.a}</text></g>
</symbol>`;
}
export const SELLO = `<svg class="sello-copiado" viewBox="0 0 120 56" aria-hidden="true"><g filter="url(#tinta)"><g fill="none" stroke="currentColor"><rect x="3" y="3" width="114" height="50" rx="6" stroke-width="3.2"/><rect x="9" y="9" width="102" height="38" rx="3" stroke-width="1.2"/></g><g fill="currentColor" text-anchor="middle"><text x="60" y="32" font-family="Lilita One,system-ui,sans-serif" font-size="20">¡COPIADO!</text><text class="sello-hora" x="60" y="42.5" font-family="Silkscreen,monospace" font-size="6.2">LISTO PARA PEGAR</text></g></g></svg>`;

export function sprite(simbolos) {
  return `<svg width="0" height="0" style="position:absolute;overflow:hidden" aria-hidden="true" focusable="false"><defs>
<filter id="tinta" x="-6%" y="-6%" width="112%" height="112%"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2" seed="4" result="r"/><feDisplacementMap in="SourceGraphic" in2="r" scale="2.4"/></filter>
${estampilla()}${simbolos}</defs></svg>`;
}

// ---------- el prompt: se copia tal cual; se muestra reacomodado para leer en la postal ----------
function enLinea(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code><i>`</i>$1<i>`</i></code>')
    .replace(/\*\*([^*]+?)\*\*/g, '<b><i>**</i>$1<i>**</i></b>');
}
export function promptHTML(md) {
  const bloques = [];
  let act = null, cerco = null;
  const cerrar = () => { if (act) bloques.push(act); act = null; };
  for (const l of md.replace(/\n+$/, '').split('\n')) {
    if (cerco) {
      cerco.push(l);
      if (/^\s*(```|~~~)/.test(l)) { bloques.push({ t: 'pre', lineas: cerco }); cerco = null; }
      continue;
    }
    if (/^\s*(```|~~~)/.test(l)) { cerrar(); cerco = [l]; continue; }
    let m;
    if (!l.trim()) { cerrar(); if (bloques.length && bloques.at(-1).t !== 'v') bloques.push({ t: 'v' }); continue; }
    if ((m = l.match(/^(#{1,6})\s+(.*)$/))) { cerrar(); bloques.push({ t: 'h', marca: m[1], texto: m[2] }); continue; }
    if ((m = l.match(/^(\s*)([-*+]|\d{1,3}[.)])\s+(.*)$/))) { cerrar(); act = { t: 'li', s: m[1].length, marca: m[2], texto: m[3] }; continue; }
    if (/^\s*(\||>)/.test(l)) { cerrar(); bloques.push({ t: 'pre', lineas: [l] }); continue; }
    if (act) act.texto += ' ' + l.trim();
    else act = { t: 'p', texto: l.trim() };
  }
  cerrar();
  if (cerco) bloques.push({ t: 'pre', lineas: cerco });
  return bloques.map((b) => {
    if (b.t === 'v') return '<span class="md-v"></span>';
    if (b.t === 'pre') return `<pre>${esc(b.lineas.join('\n'))}</pre>`;
    if (b.t === 'h') return `<span class="md-h"><i>${b.marca} </i>${enLinea(b.texto)}</span>`;
    if (b.t === 'li') return `<span class="md-li"${b.s ? ` style="--s:${b.s}ch"` : ''}><i>${esc(b.marca)}</i> ${enLinea(b.texto)}</span>`;
    return `<span class="md-p">${enLinea(b.texto)}</span>`;
  }).join('');
}
