// Genera el SVG pixel art del encabezado: El Tunco, el volcán, los cerros de Chalate y mi Claude (viewBox 400×120).
// Todo color sale de una variable CSS (--volcan, --mar…) que el script de <head> calcula con la hora de El Salvador.

const r = (x, y, w, h = 1) => `M${x} ${y}h${w}v${h}h${-w}z`;
const P = (cls, d, extra = '') => `<path class="f${cls}"${extra} d="${d}"/>`;

function mulberry(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// filas de caracteres → un path por clase
export function sprite(rows, map, ox = 0, oy = 0) {
  const acc = {};
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      if (!map[c]) { x++; continue; }
      const s = x;
      while (x < row.length && row[x] === c) x++;
      (acc[c] ||= []).push(r(ox + s, oy + y, x - s));
    }
  });
  return Object.entries(acc).map(([c, ds]) => P(map[c], ds.join(''))).join('');
}

function skyline(x0, x1, step, f, base) {
  let d = `M${x0} ${base}`;
  for (let x = x0; x < x1; x += step) {
    const y = Math.round(f(x + step / 2));
    d += `V${y}H${Math.min(x + step, x1)}`;
  }
  return d + `V${base}Z`;
}

function disco(cx, cy, rad) {
  let d = '';
  for (let y = -rad; y < rad; y++) {
    const yc = y + 0.5;
    const h = Math.round(Math.sqrt(Math.max(0, rad * rad - yc * yc)));
    if (h > 0) d += r(cx - h, cy + y, 2 * h);
  }
  return d;
}

// --- piezas ---
const HOR = 86; // horizonte
const ARENA = 104;

function cielo() {
  let s = `<rect class="fc0" x="-20" y="-140" width="440" height="${148}"/>`;
  for (let j = 1; j <= 10; j++) s += `<rect class="fc${j}" x="-20" y="${j * 8}" width="440" height="${j === 10 ? 8 : 9}"/>`;
  return s;
}

function estrellas() {
  const rnd = mulberry(7);
  const tw = ['', ' t1', ' t2', ' t3'];
  let s = '';
  for (let i = 0; i < 54; i++) {
    const x = Math.floor(rnd() * 400), y = Math.floor(rnd() * 66) + 1;
    const c = tw[Math.floor(rnd() * 4)];
    s += `<rect class="est${c}" x="${x}" y="${y}" width="1" height="1"/>`;
  }
  // un par de estrellas grandes (cruz)
  for (const [x, y] of [[58, 14], [292, 22], [352, 8]]) s += `<path class="est t2" d="${r(x - 1, y, 3)}${r(x, y - 1, 1)}${r(x, y + 1, 1)}"/>`;
  return s;
}

function luna() {
  // media luna: disco menos otro disco corrido
  let d = '';
  const rad = 6;
  for (let y = -rad; y < rad; y++) {
    const yc = y + 0.5;
    const h = Math.sqrt(Math.max(0, rad * rad - yc * yc));
    const h2 = Math.sqrt(Math.max(0, rad * rad - (yc + 1.5) * (yc + 1.5)));
    const x0 = Math.round(-h), x1 = Math.round(h);
    const c0 = Math.round(2.6 - h2), c1 = Math.round(2.6 + h2);
    // la parte iluminada = [x0, x1] menos [c0, c1]
    if (h2 <= 0 || c0 >= x1) { if (x1 > x0) d += r(x0, y, x1 - x0); continue; }
    if (c0 > x0) d += r(x0, y, c0 - x0);
    if (c1 < x1) d += r(c1, y, x1 - c1);
  }
  return `<g class="luna"><path class="fluna" d="${d}"/></g>`;
}

function sol() {
  return `<g class="sol"><path class="fhalo" opacity=".35" d="${disco(0, 0, 12)}"/><path class="fsol" d="${disco(0, 0, 7)}"/></g>`;
}

const NUBE_A = ['....######......', '..##########....', '.##############.', '################'];
const NUBE_B = ['...####.....', '.#########..', '############'];
function nubes() {
  const def = [[NUBE_A, 20, 60], [NUBE_B, 12, 210], [NUBE_A, 34, 320], [NUBE_B, 42, 130]];
  return def.map(([rows, y, x0], i) => `<g class="nube n${i + 1}" style="--x0:${x0}">${sprite(rows, { '#': 'nube' }, 0, y)}</g>`).join('');
}

function aves() {
  const ave = ['#...#', '.#.#.', '..#..'];
  return `<g class="aves"><g class="vuelo">${sprite(ave, { '#': 'ave' }, 150, 30)}${sprite(ave, { '#': 'ave' }, 161, 25)}${sprite(['#..#', '.##.'], { '#': 'ave' }, 171, 33)}</g></g>`;
}

const VC = 200, VT = 52, VH = 56;
function volcan() {
  const f = (x) => {
    const d = Math.abs(x - VC);
    if (d <= 2) return VT + 1;
    if (d <= 5) return VT;
    const t = Math.min(1, (d - 5) / (VH - 5));
    return VT + (HOR - VT) * (1 - Math.pow(1 - t, 1.9));
  };
  const izq = skyline(VC - VH, VC, 2, f, HOR);
  const der = skyline(VC, VC + VH, 2, f, HOR);
  // cárcavas: líneas de sombra que bajan del cráter
  let surcos = '';
  for (const [x0, dir, len] of [[193, -1, 12], [206, 1, 10], [189, -1, 6]]) {
    for (let i = 0; i < len; i++) {
      const x = x0 + dir * Math.round(i * 0.9);
      surcos += r(x, Math.round(f(x)) + 2 + i, 1);
    }
  }
  const humo = [[198, 47, 3, 2, 'h1'], [201, 43, 4, 2, 'h2'], [197, 39, 3, 2, 'h3']]
    .map(([x, y, w, h, c]) => `<path class="fhumo humo ${c}" d="${r(x, y, w, h)}"/>`).join('');
  return P('volcan', izq) + P('volcanS', der) + P('volcanS', surcos, ' opacity=".7"') + humo;
}

function lomas() {
  const f = (x) => {
    let y = 78 - 4 * Math.sin(x / 21) - 3 * Math.sin(x / 8.5 + 1.3);
    if (x > 176) y += (x - 176) * 0.32;
    return Math.min(HOR, y);
  };
  return P('lomas', skyline(0, 214, 2, f, HOR + 1));
}

function cerros() {
  const f = (x) => {
    const y = 86 - (24 * Math.exp(-(((x - 42) / 40) ** 2)) + 15 * Math.exp(-(((x - 112) / 26) ** 2)) + 1.5 * Math.sin(x / 6));
    return Math.min(HOR + 1, y);
  };
  const base = skyline(0, 160, 2, f, HOR + 2);
  // sombra en las laderas que miran al mar
  let sombra = '';
  for (let x = 46; x < 160; x += 2) {
    const y = Math.round(f(x + 1));
    if (x > 50 && x < 80) sombra += r(x, y + 3, 2, HOR + 2 - y - 3);
    if (x > 116) sombra += r(x, y + 2, 2, HOR + 2 - y - 2);
  }
  const pino = ['..#..', '.###.', '..#..', '.###.', '#####', '..#..'];
  let pinos = '';
  for (const x of [8, 15, 24, 31, 63, 69, 98, 121, 127, 135]) pinos += sprite(pino, { '#': 'pino' }, x - 2, Math.round(f(x)) - 5);
  const casa = ['..ttt..', '.ttttt.', 'ttttttt', '.ccccc.', '.cvccc.'];
  let casas = '';
  for (const [x, flip] of [[40, 0], [54, 1], [86, 0], [107, 1]]) {
    const rows = flip ? casa.map((s) => s.split('').reverse().join('')) : casa;
    casas += sprite(rows, { t: 'teja', c: 'casa', v: 'ventana' }, x - 3, Math.round(f(x)) - 3);
  }
  return P('cerro', base) + P('cerroS', sombra, ' opacity=".55"') + pinos + casas;
}

function mar() {
  let s = `<rect class="fmar" x="-20" y="${HOR}" width="440" height="${ARENA - HOR + 1}"/>`;
  s += `<rect class="fmarC" x="-20" y="${HOR}" width="440" height="2"/>`;
  const filas = [[90, 4, 8, 'o1', '.55'], [94, 24, 6, 'o2', '.4'], [98, 12, 10, 'o3', '.5'], [101, 30, 7, 'o4', '.6']];
  for (const [y, off, w, c, op] of filas) {
    let d = '';
    for (let k = 0; k < 12; k++) d += r(off + k * 40 - 20, y, w);
    s += `<path class="fespuma ola ${c}" opacity="${op}" d="${d}"/>`;
  }
  return s;
}

function reflejo() {
  const filas = [[88, 7], [90, 5], [92, 6], [95, 4], [98, 5], [101, 2]];
  return `<g class="reflejo"><path class="fsol brillo" d="${filas.map(([y, w]) => r(-w, y, 2 * w)).join('')}"/></g>`;
}

function roca() {
  // La roca de El Tunco: un domo grande y uno chico, con su hueco abajo
  const domo = (cx, base, rx, ry) => {
    const filas = [];
    for (let y = base - ry; y < base; y++) {
      const yc = base - (y + 0.5);
      const w = rx * Math.sqrt(Math.max(0, 1 - (yc / ry) ** 2));
      const a = Math.round(cx - w), b = Math.round(cx + w * 1.08);
      if (b > a) filas.push([y, a, b]);
    }
    return filas;
  };
  let luz = '', sombra = '';
  for (const filas of [domo(229, ARENA, 15, 23), domo(246, ARENA, 7, 11)]) {
    for (const [y, a, b] of filas) {
      const corte = Math.round(a + (b - a) * 0.62);
      luz += r(a, y, corte - a);
      sombra += r(corte, y, b - corte);
    }
  }
  const hueco = r(222, 97, 5, 7) + r(221, 99, 7, 5);
  const espuma = r(212, 103, 12, 1) + r(232, 103, 22, 1) + r(226, 102, 3, 1);
  return P('roca', luz) + P('rocaS', sombra) + P('mar', hueco) + `<path class="fespuma ola o5" d="${espuma}"/>`;
}

function lancha() {
  const rows = ['......p.....', '......p.....', '.lllllllllll', '..bbbbbbbbb.', '...lllllll..'];
  return `<g class="lancha">${sprite(rows, { l: 'lancha', b: 'casa', p: 'm4' }, 312, 88)}</g>`;
}

function playa() {
  let s = `<rect class="farena" x="-20" y="${ARENA}" width="440" height="20"/>`;
  s += `<rect class="farenaM" x="-20" y="${ARENA}" width="440" height="2"/>`;
  let orilla = '';
  for (let k = 0; k < 14; k++) orilla += r(k * 32 - 20, ARENA - 1, 18) + r(k * 32 - 4, ARENA, 6);
  s += `<path class="fespuma orilla" d="${orilla}"/>`;
  const rnd = mulberry(11);
  let granos = '';
  for (let i = 0; i < 44; i++) granos += r(Math.floor(rnd() * 400), ARENA + 4 + Math.floor(rnd() * 15), 1);
  // huellas: alguien caminó hasta aquí desde la orilla
  let huellas = '';
  for (let i = 0; i < 9; i++) huellas += r(172 + i * 9, 113 - (i % 2) * 2 - Math.floor(i / 3), 2);
  s += P('arenaS', granos) + P('arenaS', huellas, ' opacity=".8"');
  return s;
}

function palmera(base, top, alto, escala = 1, espejo = false) {
  const [bx, by] = base;
  const [tx, ty] = top;
  let tronco = '', anillos = '';
  for (let y = by; y >= ty; y--) {
    const t = (by - y) / (by - ty);
    const x = Math.round(bx + (tx - bx) * Math.pow(t, 1.7));
    const w = y > ty + (by - ty) * 0.45 ? 3 : 2;
    if ((by - y) % 4 === 3) anillos += r(x, y, w);
    else tronco += r(x, y, w);
  }
  const hojas = [[195, 15, 7, 'palma'], [222, 13, 6, 'palma'], [262, 9, 4, 'palma'], [305, 13, 6, 'palma'], [340, 16, 8, 'palma'], [160, 12, 7, 'palmaS'], [25, 13, 8, 'palmaS']];
  const acc = { palma: '', palmaS: '' };
  const cx = tx + 1, cy = ty - 1;
  for (const [deg, L0, droop, cls] of hojas) {
    const L = Math.round(L0 * escala);
    const a = ((espejo ? 180 - deg : deg) * Math.PI) / 180;
    for (let s = 1; s <= L; s++) {
      const x = Math.round(cx + Math.cos(a) * s);
      const y = Math.round(cy + Math.sin(a) * s + (droop * s * s) / (L * L) * escala);
      const w = s < L * 0.7 ? 2 : 1;
      acc[cls] += r(x, y, w);
      if (s > 3 && s % 2 === 0 && s < L - 1) acc[cls] += r(x, y + 1, 1); // hojitas que cuelgan
    }
  }
  const cocos = r(cx - 2, cy + 1, 2, 2) + r(cx + 1, cy + 2, 2, 2);
  return P('tronco', tronco) + P('troncoS', anillos) + P('palmaS', acc.palmaS) + P('palma', acc.palma) + P('coco', cocos);
}

// ---------- mi Claude, vivo ----------
// El mismo pixel art del favicon (rejilla de 20). Cada pieza es un path y mascota.js prende y apaga las variantes
// (ojos, brazos, patas, utilería) con atributos data-* sobre <g class="mc">. Todo en coordenadas del paisaje.
export const MASCOTA = {
  corona: 'M7 8h1v2h1v2h2V8h2v4h2v-2h1V8h1v8H7z',
  joyas: 'M9 14h2v2H9zM13 14h2v2h-2z',
  cuerpo: 'M6 16h12v4h2v2h-2v2H6v-2H4v-2h2zM7 24h1v2H7zM9 24h1v2H9zM14 24h1v2h-1zM16 24h1v2h-1z',
  ojos: 'M9 18h1v2H9zM14 18h1v2h-1z',
};
// Dónde vive: x de su borde izquierdo (local) y la base. El rótulo «AHORITA VENGO» se clava en RX.
export const MC = { x0: 136, y: 90, RX: 168, RW: 38 };

const TRONCO_MC = 'M6 16h12v8H6z';
const BRAZOS = {
  abajo: 'M4 20h2v2H4zM18 20h2v2h-2z',
  arriba: 'M4 16h2v2H4zM4 14h1v2H4zM18 16h2v2h-2zM19 14h1v2h-1z',
  saludo: 'M4 20h2v2H4zM18 16h2v2h-2zM19 14h1v2h-1z',
};
const PATAS = { a: 'M7 24h1v2H7zM9 24h1v2H9zM14 24h1v2h-1zM16 24h1v2h-1z', b: 'M8 24h1v2H8zM10 24h1v2h-1zM13 24h1v2h-1zM15 24h1v2h-1z' };
const OJOS = {
  abiertos: MASCOTA.ojos,
  cerrados: 'M8 19h2v1H8zM14 19h2v1h-2z',
  felices: 'M8 19h1v1H8zM9 18h1v1H9zM10 19h1v1h-1zM13 19h1v1h-1zM14 18h1v1h-1zM15 19h1v1h-1z',
};
const Z = 'M0 0h4v1H0zM2 1h1v1H2zM1 2h1v1H1zM0 3h4v1H0z';

function chispas(fase) {
  let d = '';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * 6.283 + fase, rr = 12;
    d += r(Math.round(12 + Math.cos(a) * rr), Math.round(20 + Math.sin(a) * rr * 0.75), 1);
  }
  return d;
}
function atado(dir) {
  let palo = '';
  for (let i = 0; i < 6; i++) palo += r(dir > 0 ? 17 + i : 6 - i, 17 - i, 1);
  const b = dir > 0 ? 21 : -1;
  return `<g class="atado a-${dir > 0 ? 'der' : 'izq'}">${P('palo', palo)}<path class="fm3" d="${r(b, 9, 4, 3)}${r(b + 1, 8, 2)}"/><path fill="#ffd0d4" d="${r(b + 1, 10, 1)}"/></g>`;
}

function miClaude() {
  const tabla = ['.tt.', 'tttt', 'trtt', 'trtt', 'trtt', 'trtt', 'trtt', 'trtt', 'trtt', 'trtt', 'trtt', 'trtt', 'trtt', 'tttt', 'tttt', 'tttt', 'tttt', 'tttt', '.tt.'];
  const brazos = Object.entries(BRAZOS).map(([k, d]) => `<path class="fm1 b b-${k}" d="${d}"/>`).join('');
  const patas = Object.entries(PATAS).map(([k, d]) => `<path class="fm1 p p-${k}" d="${d}"/>`).join('');
  const ojos = Object.entries(OJOS).map(([k, d]) => `<path class="fm4 o o-${k}" d="${d}"/>`).join('');
  const compu =
    `<g class="util u-compu"><path fill="#262a33" d="${r(20, 15, 11, 8)}"/><path fill="#14161c" d="${r(21, 16, 9, 6)}"/>` +
    `<path fill="#4fc1c9" d="${r(22, 17, 1)}${r(23, 18, 1)}${r(22, 19, 1)}"/><path class="cursor" fill="#f4ead9" d="${r(25, 19, 2)}"/><path fill="#9aa0aa" d="${r(19, 23, 13, 2)}"/></g>`;
  const libro =
    `<g class="util u-libro"><path fill="#7a4a2a" d="${r(19, 18, 10, 7)}"/><path fill="#f3e6c8" d="${r(20, 18, 4, 6)}${r(24, 18, 4, 6)}"/>` +
    `<path fill="#b9a98a" d="${r(21, 19, 2)}${r(25, 20, 2)}${r(25, 22, 2)}${r(21, 21, 2)}"/></g>`;
  return (
    `<g class="tabla">${sprite(tabla, { t: 'tabla', r: 'tablaR' }, 159, 97)}</g>` +
    `<g class="mc" id="mc" transform="translate(${MC.x0} ${MC.y})" data-b="abajo" data-o="abiertos" data-p="a">` +
    `<path class="farenaS" opacity=".7" d="${r(6, 26, 12)}"/>` +
    `<g class="mc-yo"><g class="mc-corona"><path class="fm2" d="${MASCOTA.corona}"/><path class="fm3" d="${MASCOTA.joyas}"/></g>` +
    `<path class="fm1" d="${TRONCO_MC}"/>${brazos}${patas}<g class="mc-ojos">${ojos}</g></g>` +
    compu + libro + atado(1) + atado(-1) +
    `<g class="util u-chispas"><path fill="#f2c14e" class="ch1" d="${chispas(0)}"/><path fill="#fff4dc" class="ch2" d="${chispas(0.5)}"/></g>` +
    `<g class="zzz"><path class="z z1" d="${Z}" transform="translate(18 10)"/><path class="z z2" d="${Z}" transform="translate(23 4)"/><path class="z z3" d="${Z}" transform="translate(28 -2)"/></g>` +
    `</g>`
  );
}

// El rótulo que clava antes de irse, la corona colgada, la telaraña que le crece y el cardo que pasa rodando.
function rotulo() {
  const { RX, RW } = MC;
  const top = 93, bh = 14, base = 116, poste = RX + RW / 2 - 1;
  const tabla = r(RX, top, RW, bh);
  const marco = r(RX, top, 1, bh) + r(RX + RW - 1, top, 1, bh) + r(poste, top + bh, 2, base - top - bh);
  let tela = '';
  for (let n = 1; n <= 4; n++) {
    const X = poste + 2, Y = top + bh, rr = n * 2 + 1;
    let d = '';
    for (let i = 0; i < rr; i++) d += r(X + i, Y + i, 1) + r(X + i, Y, 1) + r(X, Y + i, 1);
    for (let k = 3; k <= rr; k += 3) for (let j = 1; j < k; j++) d += r(X + k - j, Y + j, 1);
    tela += `<path class="ftela tela tl${n}" d="${d}"/>`;
  }
  const cx = RX + RW / 2;
  return (
    `<clipPath id="arena-corte"><rect x="${RX - 4}" y="70" width="${RW + 8}" height="${base - 70}"/></clipPath>` +
    `<g clip-path="url(#arena-corte)"><g class="rotulo" id="rotulo">` +
    `<path class="fletrero" d="${tabla}"/><path class="fpalo" d="${marco}"/>` +
    `<g class="fletra" font-family="Silkscreen,monospace" font-size="5.4" text-anchor="middle"><text x="${cx}" y="${top + 6.2}">AHORITA</text><text x="${cx}" y="${top + 12}">VENGO</text></g>` +
    `<g class="corona-colgada" transform="translate(${cx - 12} ${top - 16})"><path class="fm2" d="${MASCOTA.corona}"/><path class="fm3" d="${MASCOTA.joyas}"/></g>` +
    `${tela}</g></g>` +
    `<g class="corona-suelta" id="corona-suelta"><path class="fm2" d="${MASCOTA.corona}"/><path class="fm3" d="${MASCOTA.joyas}"/></g>`
  );
}
function cardo() {
  const c = (o) => `<path fill="#a8865a" d="${r(1, 0, 4)}${r(0, 1, 6, 4)}${r(1, 5, 4)}"/><path fill="#7a5c39" d="${o}"/>`;
  return `<g class="cardo" id="cardo"><g class="cf1">${c(r(1, 2, 1) + r(4, 3, 1) + r(2, 4, 2))}</g><g class="cf2">${c(r(3, 1, 1) + r(1, 3, 1) + r(4, 4, 1))}</g></g>`;
}
function burbuja() {
  return `<g class="burbuja" id="burbuja"><rect class="burbuja-fondo" x="0" y="0" width="30" height="9" rx="1"/><path class="burbuja-pico" d="M6 9h3v1H6zM7 10h1v1H7z"/><text x="2.4" y="6.6" font-family="Silkscreen,monospace" font-size="5.6"></text></g>`;
}

function luciernagas() {
  const rnd = mulberry(23);
  let s = '';
  for (let i = 0; i < 22; i++) {
    const enCerro = i < 15;
    const x = enCerro ? 6 + Math.floor(rnd() * 190) : 100 + Math.floor(rnd() * 70);
    const y = enCerro ? 58 + Math.floor(rnd() * 26) : 92 + Math.floor(rnd() * 12);
    s += `<g class="lu l${(i % 4) + 1}" style="animation-delay:${(-rnd() * 4).toFixed(1)}s"><rect x="${x - 1}" y="${y - 1}" width="3" height="3" opacity=".28"/><rect x="${x}" y="${y}" width="1" height="1"/></g>`;
  }
  return `<g class="luciernagas">${s}</g>`;
}

export function escena() {
  return (
    `<svg class="paisaje" viewBox="0 0 400 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false" shape-rendering="crispEdges">` +
    `<g data-par=".35">${cielo()}<g class="estrellas">${estrellas()}</g>${luna()}${sol()}${nubes()}${aves()}</g>` +
    `<g data-par=".24">${volcan()}</g>` +
    `<g data-par=".15">${lomas()}</g>` +
    `<g data-par=".09">${cerros()}</g>` +
    `<g data-par=".04">${mar()}${reflejo()}${lancha()}${roca()}</g>` +
    `<g>${playa()}${palmera([116, 118], [125, 64], 54)}${palmera([366, 118], [357, 74], 44, 0.8, true)}${rotulo()}${miClaude()}${cardo()}${burbuja()}${luciernagas()}</g>` +
    `</svg>`
  );
}

// ---------- las postales que manda mientras anda fuera (40×26, para <use>) ----------
export function postalesDeViaje() {
  const C = { coral: '#db7758', ojo: '#2a1a12', palo: '#6b4226', rojo: '#e04e5a' };
  const lugar = (id, dibujo) => {
    const acc = {};
    const R = (x, y, w, h, c) => ((acc[c] ||= []).push(r(x, y, w, h)));
    dibujo(R);
    const cuerpo = Object.entries(acc).map(([c, ds]) => `<path fill="${c}" d="${ds.join('')}"/>`).join('');
    return `<symbol id="pc-${id}" viewBox="0 0 40 26">${cuerpo}</symbol>`;
  };
  const mini = (R, x, y, sombrero) => { // mi Claude sin corona (la dejó colgada en el rótulo)
    if (sombrero) { R(x + 2, y - 2, 5, 1, '#e8c27a'); R(x, y - 1, 9, 1, '#e8c27a'); }
    R(x + 1, y, 7, 4, C.coral); R(x, y + 2, 9, 1, C.coral);
    R(x + 2, y + 1, 1, 1, C.ojo); R(x + 6, y + 1, 1, 1, C.ojo);
    for (const k of [1, 3, 5, 7]) R(x + k, y + 4, 1, 1, C.coral);
  };
  const bandas = (R, cs, alto) => cs.forEach((c, i) => R(0, i * alto, 40, alto, c));
  return [
    lugar('tunco', (R) => {
      bandas(R, ['#fbe2b4', '#f9cf98', '#f6b882', '#f29c6b', '#ec8059'], 3);
      R(10, 11, 5, 1, '#fbe7a1'); R(9, 12, 7, 1, '#fbe7a1'); R(8, 13, 9, 2, '#fbe7a1');
      R(0, 15, 40, 6, '#1f9aa6'); R(3, 17, 6, 1, '#7fd3d6'); R(19, 18, 6, 1, '#7fd3d6'); R(30, 16, 4, 1, '#7fd3d6');
      R(28, 8, 5, 2, '#5b3a29'); R(26, 10, 9, 4, '#5b3a29'); R(25, 13, 11, 4, '#5b3a29'); R(29, 14, 2, 3, '#1f9aa6');
      R(0, 21, 40, 5, '#efd29a'); R(14, 23, 2, 1, '#d9b877'); R(33, 22, 2, 1, '#d9b877');
      mini(R, 4, 19, true);
    }),
    lugar('pupusas', (R) => {
      R(0, 0, 40, 16, '#f4e1bd'); R(0, 11, 40, 1, '#e3c99f');
      for (let i = 2; i < 40; i += 5) R(i, 2 + (i % 2), 1, 1, ['#e04e5a', '#f2c14e', '#1f9aa6'][i % 3]);
      R(0, 1, 40, 1, '#c9a77c');
      R(0, 16, 40, 10, '#8a5a3b'); R(0, 16, 40, 1, '#a7744f');
      R(14, 14, 16, 2, '#2b2b2b'); R(16, 13, 12, 1, '#2b2b2b');
      for (const x of [15, 20, 25]) { R(x, 11, 4, 2, '#f1d9a0'); R(x + 1, 11, 1, 1, '#a46b3a'); R(x + 2, 12, 1, 1, '#c98a4b'); }
      R(33, 8, 4, 6, '#cfe8e4'); R(33, 10, 4, 4, '#e8a33c'); R(34, 11, 1, 1, '#5e9c3a'); R(35, 12, 1, 1, '#5e9c3a'); R(33, 7, 4, 1, '#9b6b3a');
      mini(R, 3, 11, false);
    }),
    lugar('volcan', (R) => {
      bandas(R, ['#cfeaf2', '#bfe3ee', '#aedbe9', '#9fd3e3'], 7);
      for (let k = 0; k < 15; k++) R(17 - k, 6 + k, 6 + 2 * k, 1, k < 2 ? '#4a3631' : '#6b5149');
      R(18, 2, 3, 2, '#f3f1ec'); R(20, 0, 4, 2, '#f3f1ec'); R(16, 4, 3, 1, '#e6e3dc');
      R(19, 6, 1, 4, C.palo); R(20, 6, 4, 1, '#2f5fcf'); R(20, 7, 4, 1, '#ffffff'); R(20, 8, 4, 1, '#2f5fcf');
      R(0, 20, 40, 6, '#5e8c3a'); R(0, 20, 12, 1, '#76a34a'); R(26, 21, 14, 1, '#76a34a');
      mini(R, 4, 15, false);
    }),
    lugar('coatepeque', (R) => {
      R(0, 0, 40, 8, '#cfeaf2');
      R(0, 6, 40, 6, '#3f6a30'); R(0, 5, 9, 1, '#3f6a30'); R(24, 4, 16, 2, '#3f6a30'); R(10, 7, 12, 1, '#4f7a3a');
      R(0, 11, 40, 15, '#1fa3b4'); R(4, 15, 5, 1, '#6fd3dc'); R(30, 20, 6, 1, '#6fd3dc'); R(22, 24, 4, 1, '#6fd3dc');
      R(28, 9, 7, 3, '#5e8c3a'); R(30, 8, 3, 1, '#5e8c3a');
      R(7, 19, 12, 2, '#8a5a3b'); R(8, 21, 10, 1, '#6b4226');
      mini(R, 9, 14, true);
      for (let j = 0; j < 6; j++) R(18 + j, 15 - j, 1, 1, C.palo);
      R(24, 10, 1, 10, '#eef8f8'); R(24, 20, 1, 1, C.rojo);
    }),
  ].join('');
}
