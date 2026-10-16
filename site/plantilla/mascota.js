// Mi Claude, vivo dentro del paisaje. La misma lógica de la mascota del prompt:
// trabaja o camina cuando hay scroll o toques · a los 20 s sin nadie se duerme (de noche ya amanece dormido) ·
// a los 45 s clava el rótulo «AHORITA VENGO», cuelga la corona y se va · manda postales de dónde anda ·
// al volver a tocar la página regresa y avisa cuánto rato lo dejaste solo · al copiar celebra con confeti.
// Con «menos movimiento» cambia de estado sin moverse. ?mascota=apurada divide los tiempos entre 10.
(function () {
  'use strict';
  var d = document, W = window, R = d.documentElement;
  var cielo = d.querySelector('.cielo'), mc = d.getElementById('mc');
  if (!cielo || !mc) return;
  var svg = cielo.querySelector('.paisaje');
  var mqQ = W.matchMedia ? W.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var quieto = mqQ.matches;
  if (mqQ.addEventListener) mqQ.addEventListener('change', function (e) { quieto = e.matches; });
  var ahora = Date.now;
  var k = /[?&]mascota=apurada/.test(location.search) ? 0.1 : 1;
  // Los tiempos, en un solo lugar.
  var T = { dormir: 20e3 * k, irse: 45e3 * k, primeraPostal: 5e3 * k, postal: 14e3 * k, asomo: 11e3 * k, cardo: 17e3 * k, telarana: 9e3 * k };
  var MC = /*MC*/; // posición de mi Claude y del rótulo, igual que en site/escena.mjs
  var Y = MC.y, PARADO = MC.RX + MC.RW - 3, CORONA_RX = MC.RX + MC.RW / 2 - 12, CORONA_RY = 77;

  var rot = d.getElementById('rotulo'), coronaS = d.getElementById('corona-suelta'), cardoEl = d.getElementById('cardo');
  var burb = d.getElementById('burbuja'), burbTxt = burb.querySelector('text'), burbFondo = burb.querySelector('rect'), burbPico = burb.querySelector('.burbuja-pico');
  var ojos = mc.querySelector('.mc-ojos');
  var chipEstado = cielo.querySelector('[data-estado]');
  var llegadas = d.querySelector('.llegadas'), elBrindis = d.querySelector('.brindis');

  var LUGARES = [
    { id: 'tunco', de: 'de la playa', anda: 'en la playa', titulo: 'El Tunco', nota: 'Viendo el atardecer. No me esperés.' },
    { id: 'pupusas', de: 'de comer pupusas', anda: 'comiendo pupusas', titulo: 'Pupusas', nota: 'De queso con loroco. Te guardé una (mentira).' },
    { id: 'volcan', de: 'del volcán', anda: 'subiendo el volcán', titulo: 'El volcán', nota: 'Ya casi llego arriba… creo.' },
    { id: 'coatepeque', de: 'de Coatepeque', anda: 'pescando en Coatepeque', titulo: 'Coatepeque', nota: 'No he pescado nada, pero qué vista.' }
  ];
  var DICHOS = ['¡epa!', '¡quiubo!', 'aquí ando', '¿qué onda?', '¡vos!'];

  var fija = cielo.getAttribute('data-mascota') === 'fija'; // la 404: anda fuera y no vuelve
  var M = {
    modo: fija ? 'fuera' : R.hasAttribute('data-duerme') ? 'dormido' : 'despierto',
    act: null, actHasta: 0, bur: '', burHasta: 0, x: MC.x0, dir: 1, ultimo: ahora(), t0: 0, xSalida: MC.x0,
    lugar: null, idx: 0, postales: 0, proxPostal: 0, proxAsomo: 0, proxCardo: 0, proxTela: 0, asomo: 0, cardo: 0, tela: fija ? 2 : 0
  };

  function toque(act, ms, b) {
    var t = ahora();
    M.act = act; M.actHasta = t + ms;
    if (b) { M.bur = b; M.burHasta = t + Math.min(ms, 2200); }
  }

  // ---- lo visible del paisaje (el SVG se recorta a lo ancho en el teléfono) ----
  var VIS = [0, 400];
  function medir() {
    var w = svg.clientWidth, h = svg.clientHeight;
    if (!w) return;
    var ancho = w / Math.max(w / 400, h / 120);
    VIS = [200 - ancho / 2, 200 + ancho / 2];
    M.x = Math.max(VIS[0] + 1, Math.min(VIS[1] - 21, M.x));
  }

  // ---- escribir en el SVG solo lo que cambió ----
  function at(el, n, v) {
    var c = el._c || (el._c = {});
    if (c[n] === v) return;
    c[n] = v;
    if (v === null || v === false) el.removeAttribute(n); else el.setAttribute(n, v === true ? '' : v);
  }
  function lerp(a, b, q) { return a + (b - a) * Math.max(0, Math.min(1, q)); }
  function burbuja(txt, x) {
    if (!txt) { at(burb, 'class', 'burbuja'); return; }
    at(burb, 'class', 'burbuja ver');
    if (burbTxt.textContent !== txt) { burbTxt.textContent = txt; burb._w = 0; }
    if (!burb._w) { try { burb._w = burbTxt.getComputedTextLength() + 4.8; } catch (e) { burb._w = txt.length * 4.6 + 5; } burbFondo.setAttribute('width', burb._w.toFixed(1)); }
    var w = burb._w, bx = Math.round(Math.max(VIS[0] + 1, Math.min(VIS[1] - w - 1, x + 12 - w / 2)));
    at(burb, 'transform', 'translate(' + bx + ' 80)');
    at(burbPico, 'transform', 'translate(' + Math.round(Math.max(1, Math.min(w - 10, x + 12 - bx - 7))) + ' 0)');
  }

  // ---- cada cuadro: qué está haciendo ----
  function pintar(t) {
    var m = M.modo, e = t - M.t0, f = quieto ? 0 : Math.floor(t / 220);
    var o = { b: 'abajo', o: 'abiertos', p: 'a', u: null, zzz: false, sinCorona: false, fuera: false, x: M.x, mira: M.dir };
    var alzado = false, colgada = false, suelta = null, bur = t < M.burHasta ? M.bur : '';
    var estado = '';
    if (m === 'despierto') {
      var a = t < M.actHasta ? M.act : null;
      if (a === 'camina') o.p = f % 2 ? 'b' : 'a';
      if (a === 'trabaja') { o.u = 'compu'; o.mira = 1; }
      if (a === 'lee') { o.u = 'libro'; o.mira = 1; }
      if (a === 'fiesta') { o.b = 'arriba'; o.o = 'felices'; o.u = 'chispas'; o.mira = 0; }
      if (a === 'saluda') { o.b = f % 2 ? 'saludo' : 'abajo'; o.o = 'felices'; o.mira = 0; }
      if (a === 'despierta') o.o = f % 2 ? 'abiertos' : 'cerrados';
      if (!a && t % 3600 < 160) o.o = 'cerrados'; // parpadea
    } else if (m === 'dormido') {
      o.o = 'cerrados'; o.zzz = true; o.mira = 0;
    } else if (m === 'yendo') {
      // 0–1.4 s se estira · 1.4–2.4 camina al rótulo · 2.4–3 lo clava · 3–3.9 cuelga la corona · 3.9–4.9 «¡chao!» · 4.7–7 se va
      var fin = VIS[1] + 4;
      o.x = e < 1400 ? M.xSalida : e < 2400 ? lerp(M.xSalida, PARADO, (e - 1400) / 1000) : e < 4700 ? PARADO : lerp(PARADO, fin, (e - 4700) / 2300);
      o.mira = e < 1400 ? 0 : 1;
      if (e < 1400) { o.b = 'arriba'; o.o = 'cerrados'; bur = '¿y si me voy?'; }
      if ((e > 1400 && e < 2400) || e > 4700) o.p = f % 2 ? 'b' : 'a';
      alzado = e >= 2400;
      if (e >= 3000) {
        o.sinCorona = true;
        if (e < 3900) { o.b = 'arriba'; var q = (e - 3000) / 900; suelta = [lerp(o.x, CORONA_RX, q), lerp(Y, CORONA_RY, q)]; } else colgada = true;
      }
      if (e > 3900) { o.u = 'atado-der'; if (e < 4900) bur = '¡chao!'; }
      estado = 'se va…';
    } else if (m === 'fuera') {
      o.fuera = true; alzado = true; colgada = true;
      estado = M.lugar ? M.lugar.anda : 'por ahí';
      if (M.asomo && t - M.asomo < 1800 && !quieto) { // se asoma por la orilla a ver si ya volviste
        o.fuera = false; o.sinCorona = true; o.mira = 1;
        o.x = VIS[0] - 20 + Math.round(Math.sin(Math.min(1, (t - M.asomo) / 1800) * Math.PI) * 13);
      }
    } else if (m === 'volviendo') {
      // 0–1.5 s entra caminando · 1.5–2.3 recoge la corona · 2.3–2.9 arranca el rótulo
      o.x = lerp(VIS[1] + 4, PARADO, e / 1500); o.mira = -1; o.sinCorona = e < 2300;
      if (e < 1500) { o.p = f % 2 ? 'b' : 'a'; o.u = 'atado-izq'; colgada = true; }
      else if (e < 2300) { o.b = 'arriba'; var q2 = (e - 1500) / 800; suelta = [lerp(CORONA_RX, o.x, q2), lerp(CORONA_RY, Y, q2)]; }
      alzado = e < 2300;
    }
    o.x = Math.round(o.x);
    at(cielo, 'data-mc', m);
    at(mc, 'transform', 'translate(' + o.x + ' ' + Y + ')');
    at(mc, 'data-b', o.b); at(mc, 'data-o', o.o); at(mc, 'data-p', o.p); at(mc, 'data-u', o.u);
    at(mc, 'data-zzz', o.zzz); at(mc, 'data-sin-corona', o.sinCorona); at(mc, 'data-fuera', o.fuera);
    at(ojos, 'transform', o.mira ? 'translate(' + o.mira + ' 0)' : null);
    at(rot, 'class', alzado ? 'rotulo alzado' : 'rotulo');
    at(rot, 'data-corona', colgada);
    at(rot, 'data-tela', M.tela ? String(M.tela) : null);
    at(coronaS, 'class', suelta ? 'corona-suelta ver' : 'corona-suelta');
    if (suelta) at(coronaS, 'transform', 'translate(' + Math.round(suelta[0]) + ' ' + Math.round(suelta[1]) + ')');
    var kc = (t - M.cardo) / 3200;
    if (m === 'fuera' && M.cardo && kc < 1 && !quieto) { // pasa un cardo rodando
      at(cardoEl, 'class', 'cardo ver');
      at(cardoEl, 'data-f', f % 2 ? '2' : '1');
      at(cardoEl, 'transform', 'translate(' + Math.round(lerp(VIS[1] + 2, VIS[0] - 8, kc)) + ' ' + (110 - Math.round(Math.abs(Math.sin(kc * 18)) * 3)) + ')');
    } else at(cardoEl, 'class', 'cardo');
    burbuja(o.fuera ? '' : bur, o.x);
    if (chipEstado && chipEstado.textContent !== estado) chipEstado.textContent = estado;
  }

  // ---- el reloj de la vida ----
  function actualizar(t) {
    if (fija) return;
    var q = t - M.ultimo, m = M.modo;
    if (m === 'despierto') {
      if (M.act === 'camina' && t < M.actHasta && !quieto) {
        M.x += M.dir * 1.5;
        if (M.x > VIS[1] - 21) { M.x = VIS[1] - 21; M.dir = -1; }
        if (M.x < VIS[0] + 1) { M.x = VIS[0] + 1; M.dir = 1; }
      }
      if (q > T.irse) irse(t, true);
      else if (q > T.dormir) { M.modo = 'dormido'; M.t0 = t; M.burHasta = 0; }
    } else if (m === 'dormido') {
      if (q > T.irse) irse(t);
    } else if (m === 'yendo') {
      if (t - M.t0 > 7000) {
        M.modo = 'fuera'; M.fueraDesde = M.t0;
        M.proxPostal = t + T.primeraPostal; M.proxAsomo = t + T.asomo; M.proxCardo = t + T.cardo * 0.6; M.proxTela = t + T.telarana;
      }
    } else if (m === 'fuera') {
      if (t >= M.proxPostal) { postal(); M.proxPostal = t + T.postal; }
      if (t >= M.proxAsomo) { M.asomo = t; M.proxAsomo = t + T.asomo * (0.8 + Math.random() * 0.5); }
      if (t >= M.proxCardo) { M.cardo = t; M.proxCardo = t + T.cardo * (0.8 + Math.random() * 0.5); }
      if (t >= M.proxTela && M.tela < 4) { M.tela++; M.proxTela = t + T.telarana; }
    } else if (m === 'volviendo') {
      if (t - M.t0 > (quieto ? 0 : 2900)) { M.modo = 'despierto'; M.x = PARADO; M.dir = -1; toque('fiesta', 1800, '¡volví!'); }
    }
  }
  function irse(t, directo) {
    M.xSalida = M.x; M.modo = 'yendo'; M.t0 = t; M.tela = 0; M.lugar = null; M.postales = 0;
    if (directo || quieto) M.t0 = t - 7001; // si la pestaña estaba escondida (o con menos movimiento), ya se fue
  }
  function dur(ms) {
    var s = Math.max(1, Math.round(ms / 1000)), mn = Math.floor(s / 60);
    return mn ? mn + ' min' + (mn < 10 && s % 60 ? ' ' + (s % 60) + ' s' : '') : s + ' s';
  }
  function volver(t) {
    var lugar = M.lugar ? M.lugar.de : 'de dar una vuelta';
    var visible = M.modo === 'yendo' && t - M.t0 < 6200; // si todavía se ve, no hace falta que entre caminando
    brindis('¡Tu Claude volvió ' + lugar + '! · estuviste fuera ' + dur(t - M.ultimo));
    M.modo = 'volviendo'; M.t0 = visible ? t - 1400 : t; M.tela = 0;
    if (llegadas) llegadas.innerHTML = '';
  }
  // Cualquier cosa que hagás cuenta: tocar, teclear, hacer scroll, mover el mouse.
  function actividad() {
    if (fija) return;
    var t = ahora(), m = M.modo;
    if (m === 'dormido') { M.modo = 'despierto'; toque('despierta', 1300, '¡ah! ¿qué?'); }
    else if (m === 'yendo') {
      if (t - M.t0 < 3000) { M.modo = 'despierto'; M.x = M.xSalida; toque('saluda', 1500, '¡ah, aquí estás!'); }
      else volver(t);
    } else if (m === 'fuera') volver(t);
    M.ultimo = t;
  }

  // ---- avisos: la postal que manda, el «volví» y el confeti ----
  function brindis(txt) {
    if (!elBrindis) return;
    elBrindis.textContent = txt;
    elBrindis.classList.add('ver');
    clearTimeout(elBrindis._t);
    elBrindis._t = setTimeout(function () { elBrindis.classList.remove('ver'); }, 5600);
  }
  function postal() {
    var lug = LUGARES[M.idx % LUGARES.length];
    M.idx++; M.postales++; M.lugar = lug;
    if (!llegadas) return;
    llegadas.innerHTML = '<div class="viaje"><svg viewBox="0 0 40 26" aria-hidden="true"><use href="#pc-' + lug.id + '"/></svg><div><p class="desde">SALUDOS DESDE</p><p class="lugar"></p><p class="nota-viaje"></p><p class="firma">— tu Claude</p></div><span class="sv" aria-hidden="true">SV</span><button class="cerrar" type="button" aria-label="Cerrar la postal"><span aria-hidden="true">×</span></button></div>';
    llegadas.querySelector('.lugar').textContent = lug.titulo;
    llegadas.querySelector('.nota-viaje').textContent = lug.nota;
    llegadas.querySelector('.cerrar').addEventListener('click', function () { llegadas.innerHTML = ''; });
  }
  var cf, cfx, parts = [], cfVivo = false, COLS = ['#f2c14e', '#e04e5a', '#db7758', '#6fd6cd', '#fffaf0'];
  function confeti(el) {
    if (quieto) return;
    if (!cf) {
      cf = d.createElement('canvas'); cf.className = 'confeti'; cf.setAttribute('aria-hidden', 'true');
      d.body.appendChild(cf); cfx = cf.getContext('2d');
    }
    cf.width = innerWidth; cf.height = innerHeight;
    var r = el && el.getBoundingClientRect ? el.getBoundingClientRect() : { left: innerWidth / 2 - 50, top: innerHeight / 2, width: 100, height: 0 };
    for (var i = 0; i < 70; i++) parts.push({ x: r.left + Math.random() * r.width, y: r.top + r.height / 2, vx: (Math.random() - 0.5) * 10, vy: -(5 + Math.random() * 10), s: 4 + 2 * (i % 3), c: COLS[i % 5] });
    if (!cfVivo) { cfVivo = true; requestAnimationFrame(pasoConfeti); }
  }
  function pasoConfeti() {
    cfx.clearRect(0, 0, cf.width, cf.height);
    parts = parts.filter(function (p) { return p.y < cf.height + 20; });
    parts.forEach(function (p) {
      p.vy += 0.38; p.vx *= 0.985; p.x += p.vx; p.y += p.vy;
      cfx.fillStyle = p.c;
      cfx.fillRect(Math.round(p.x / 4) * 4, Math.round(p.y / 4) * 4, p.s, p.s);
    });
    if (parts.length) requestAnimationFrame(pasoConfeti);
    else { cfVivo = false; cfx.clearRect(0, 0, cf.width, cf.height); }
  }

  // ---- lo que hacés le dice qué hacer ----
  var ultimaY = W.pageYOffset;
  W.addEventListener('scroll', function () {
    var y = W.pageYOffset, dy = y - ultimaY;
    ultimaY = y;
    actividad();
    if (M.modo === 'despierto' && Math.abs(dy) > 1) { M.dir = dy > 0 ? 1 : -1; if (!(M.act === 'fiesta' && ahora() < M.actHasta)) toque('camina', 650); }
  }, { passive: true });
  ['keydown', 'wheel', 'touchstart'].forEach(function (n) { W.addEventListener(n, actividad, { passive: true }); });
  W.addEventListener('pointerdown', function (ev) {
    var antes = M.modo;
    actividad();
    if (antes !== 'despierto' || M.modo !== 'despierto') return;
    if (ev.target.closest && ev.target.closest('.cielo') && !ev.target.closest('a, button')) toque('saluda', 1400, DICHOS[Math.floor(Math.random() * DICHOS.length)]);
    else if (!(ev.target.closest && ev.target.closest('[data-copiar]'))) toque('trabaja', 1500);
  }, { passive: true });
  var ultMov = 0;
  W.addEventListener('pointermove', function (ev) { if (ev.pointerType !== 'mouse') return; var t = ahora(); if (t - ultMov > 500) { ultMov = t; actividad(); } }, { passive: true });
  d.addEventListener('mc:copiado', function (ev) {
    actividad();
    confeti(ev.detail);
    if (M.modo === 'despierto') toque('fiesta', 1800, '¡listo!');
  });
  d.addEventListener('mc:volteo', function (ev) { if (ev.detail && M.modo === 'despierto') toque('lee', 2600, 'a ver…'); });

  // ---- el bucle: pocos cuadros por segundo, como en la terminal (y nada mientras la pestaña está escondida) ----
  var corriendo = false;
  function bucle() {
    if (d.hidden) { corriendo = false; return; }
    var t = ahora();
    actualizar(t);
    if (!cielo.classList.contains('pausado')) pintar(t);
    setTimeout(bucle, quieto ? 400 : 110);
  }
  function arrancar() { if (!corriendo && !d.hidden) { corriendo = true; setTimeout(bucle, 0); } }
  d.addEventListener('visibilitychange', arrancar);
  // Arranca en el cuadro siguiente: medir el SVG antes obligaría a maquetar la página dentro de este script.
  requestAnimationFrame(function () {
    medir();
    if ('ResizeObserver' in W) new ResizeObserver(medir).observe(svg); else W.addEventListener('resize', medir);
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { burb._w = 0; });
    pintar(ahora());
    arrancar();
  });
  W.__mascota = { M: M, T: T, actividad: actividad, irse: function () { irse(ahora()); }, postal: postal, pintar: function () { pintar(ahora()); } }; // para probarla desde la consola
})();
