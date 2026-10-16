(function (W) {
  // Paisaje vivo: la hora real de El Salvador (o ?hora=19 en el enlace) decide los colores del cielo, el sol,
  // la luna, las estrellas y las luciérnagas. Corre en <head> para que el primer cuadro ya salga con la hora correcta.
  // También pone el tema (claro/oscuro) antes de pintar, para que no parpadee.
  var R = W.document ? W.document.documentElement : null;
  try { var tm = localStorage.getItem('tema'); if (R && (tm === 'claro' || tm === 'oscuro')) R.setAttribute('data-tema', tm); } catch (e) {}
  try { if (R && (R.getAttribute('data-tema') ? R.getAttribute('data-tema') === 'oscuro' : W.matchMedia('(prefers-color-scheme: dark)').matches)) R.setAttribute('data-oscuro', ''); } catch (e) {}

  // h, cielo arriba, horizonte, sol, luz ambiente, cuánto tiñe, estrellas, luciérnagas, reflejo
  var K = [
    [0, '070b1f', '1b2147', 'fff1c9', '0b1030', .78, 1, 1, 0],
    [4.6, '0a0f29', '262a57', 'ffb48a', '10153a', .74, .9, .8, 0],
    [5.4, '1c2152', 'd9879a', 'ffb48a', '2b2552', .55, .45, .25, .2],
    [6.2, '6a8bcc', 'ffb48a', 'ffc27a', 'ee8a68', .3, 0, 0, .7],
    [7.5, '5aa9e6', 'cfeaf6', 'fff4c9', 'ffffff', 0, 0, 0, .1],
    [12, '3d9be3', 'c4e8f7', 'fff8dc', 'ffffff', 0, 0, 0, 0],
    [15.5, '5aa5df', 'f4dcae', 'ffe9b0', 'ffc98a', .12, 0, 0, .2],
    [17.2, 'e0866c', 'ffd38a', 'ffb347', 'ff9a5a', .35, 0, 0, .9],
    [17.9, '8a4f7d', 'ff8f52', 'ff6f3c', 'c4506a', .5, .1, 0, 1],
    [18.6, '2a2a62', 'c9607a', 'ff6f3c', '3a2a5e', .62, .55, .45, .3],
    [19.4, '0b1030', '232857', 'fff1c9', '0e1335', .76, 1, 1, 0],
    [24, '070b1f', '1b2147', 'fff1c9', '0b1030', .78, 1, 1, 0]
  ];
  // color de día · cuánto lo tiñe la luz ambiente · cuánto se pierde en la bruma del horizonte
  var D = {
    volcan: ['7088ab', 1, .35], volcanS: ['5a7194', 1, .3], humo: ['efe9df', .8, .2], lomas: ['86a872', 1, .22],
    cerro: ['55934c', 1, .05], cerroS: ['437c3e', 1, .05], pino: ['2f6b3a', 1, 0], casa: ['f7f0e3', .9, 0],
    teja: ['c4573a', .9, 0], roca: ['8a7866', 1, 0], rocaS: ['62534a', 1, 0], espuma: ['e8fbff', .75, .2],
    arena: ['f0d39a', .9, .1], arenaM: ['dcb97c', .9, .1], arenaS: ['d9b47a', .9, .1], palma: ['3f9a4a', 1, 0],
    palmaS: ['2c7438', 1, 0], tronco: ['8a5a3a', 1, 0], troncoS: ['6c442b', 1, 0], coco: ['6b4a2a', 1, 0],
    tabla: ['f2c14e', .7, 0], tablaR: ['e04e5a', .7, 0], lancha: ['d9644a', .9, 0], m1: ['db7758', .45, 0],
    m2: ['f2c14e', .45, 0], m3: ['e04e5a', .45, 0], m4: ['2a1a12', .2, 0],
    palo: ['6b4226', .8, 0], letrero: ['efe2c4', .6, 0], letra: ['3a2717', .2, 0], tela: ['e6e0d2', .5, 0]
  };
  function hx(s) { return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]; }
  function mx(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function cs(c) { return 'rgb(' + Math.round(c[0]) + ' ' + Math.round(c[1]) + ' ' + Math.round(c[2]) + ')'; }
  function cl(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

  function hora() {
    var q = /[?&]hora=(\d{1,2}(?:\.\d+)?)(?::(\d{2}))?/.exec(W.location ? W.location.search : '');
    if (q) return { h: (+q[1] + (q[2] ? +q[2] / 60 : 0)) % 24, forzada: true };
    var h;
    try {
      var p = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/El_Salvador', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
      var o = {};
      for (var i = 0; i < p.length; i++) o[p[i].type] = +p[i].value;
      h = (o.hour % 24) + o.minute / 60;
    } catch (e) {
      var d = new Date(Date.now() - 216e5); // El Salvador no tiene horario de verano: UTC-6 todo el año
      h = d.getUTCHours() + d.getUTCMinutes() / 60;
    }
    return { h: h, forzada: false };
  }

  function calc(h) {
    var i = 0;
    while (i < K.length - 2 && h >= K[i + 1][0]) i++;
    var A = K[i], B = K[i + 1], t = cl((h - A[0]) / (B[0] - A[0]));
    t = t * t * (3 - 2 * t);
    var top = mx(hx(A[1]), hx(B[1]), t), hor = mx(hx(A[2]), hx(B[2]), t), sol = mx(hx(A[3]), hx(B[3]), t);
    var amb = mx(hx(A[4]), hx(B[4]), t), k = A[5] + (B[5] - A[5]) * t, v = {};
    for (var j = 0; j <= 10; j++) v['c' + j] = cs(mx(top, hor, Math.pow(j / 10, 1.6)));
    for (var n in D) {
      var c = hx(D[n][0]);
      if (D[n][2]) c = mx(c, hor, D[n][2]);
      v[n] = cs(mx(c, amb, k * D[n][1]));
    }
    var mar = mx(mx(hx('1d97a5'), top, .25), amb, k * .85);
    mar = mx(mar, hor, .2 * (A[8] + (B[8] - A[8]) * t));
    v.mar = cs(mar);
    v.marC = cs(mx(mar, hor, .55));
    v.nube = cs(mx(mx([255, 255, 255], hor, .45), amb, k * .7));
    v.ventana = cs(mx(hx('4b3b33'), hx('ffd36b'), cl((k - .35) / .3)));
    v.sol = cs(sol);
    v.halo = cs(mx(sol, hor, .5));
    v.est = (A[6] + (B[6] - A[6]) * t).toFixed(2);
    v.luc = (A[7] + (B[7] - A[7]) * t).toFixed(2);
    v.refl = (A[8] + (B[8] - A[8]) * t).toFixed(2);
    v.aves = cl(1 - k * 2.6).toFixed(2);
    // el sol sale detrás de los cerros y se mete al mar; la luna hace el mismo arco de noche
    var ts = (h - 5.6) / 12.1, tl = ((h - 18.2 + 24) % 24) / 11.8;
    var vs = ts > -.02 && ts < 1.02, vl = tl > 0 && tl < 1;
    v.sx = vs ? (150 + 126 * ts).toFixed(1) : 200;
    v.sy = vs ? (86 - 58 * Math.pow(Math.sin(Math.PI * cl(ts)), .7)).toFixed(1) : 140;
    v.lx = vl ? (150 + 126 * tl).toFixed(1) : 200;
    v.ly = vl ? (86 - 52 * Math.pow(Math.sin(Math.PI * tl), .7)).toFixed(1) : 140;
    var fase = h < 3.5 ? 'noche' : h < 5.75 ? 'madrugada' : h < 12 ? 'mañana' : h < 17 ? 'tarde' : h < 18.6 ? 'atardecer' : 'noche';
    return { v: v, fase: fase, duerme: h >= 19 || h < 5.75 };
  }

  var puesto = {};
  function aplicar() {
    var H = hora(), C = calc(H.h), s = R.style;
    // solo lo que cambió: cada variable nueva en <html> obliga a recalcular el estilo de toda la página
    for (var n in C.v) if (puesto[n] !== C.v[n]) { puesto[n] = C.v[n]; s.setProperty('--' + n, C.v[n]); }
    R.setAttribute('data-fase', C.fase);
    if (C.duerme) R.setAttribute('data-duerme', ''); else R.removeAttribute('data-duerme');
    // lo que no se ve (estrellas y luciérnagas de día) no se anima
    if (+C.v.est > .02) R.setAttribute('data-estrellas', ''); else R.removeAttribute('data-estrellas');
    if (+C.v.luc > .02) R.setAttribute('data-luces', ''); else R.removeAttribute('data-luces');
    return { h: H.h, forzada: H.forzada, fase: C.fase, duerme: C.duerme };
  }

  W.__calcPaisaje = calc;
  if (R) W.__paisaje = aplicar, aplicar();
})(typeof window !== 'undefined' ? window : globalThis);
