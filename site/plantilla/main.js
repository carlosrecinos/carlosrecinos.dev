// La página: hora de El Salvador, tema, Copiar (con respaldo para el navegador de Instagram), voltear la postal,
// Contacto, Compartir y el loop de la terminal. Avisa a la mascota con eventos (mc:copiado, mc:volteo).
(function () {
  'use strict';
  var d = document, R = d.documentElement, W = window;
  var quieto = W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var avisarMascota = function (n, det) { try { d.dispatchEvent(new CustomEvent(n, { detail: det })); } catch (e) {} };

  // ---------- la hora de El Salvador ----------
  var FRASES = {
    madrugada: 'Madrugada en El Tunco. Mi Claude sigue bien dormido.',
    'mañana': 'Mañana en El Tunco. Mi Claude ya anda buscando olas.',
    tarde: 'Tarde en El Tunco. Calorón, y mi Claude ni se mueve de la playa.',
    atardecer: 'Atardecer en El Tunco. Mi Claude no se pierde uno.',
    noche: 'Noche en El Tunco: luciérnagas en los cerros y mi Claude bien dormido.'
  };
  function fmt(h) {
    var hh = Math.floor(h) % 24, mm = Math.floor((h - Math.floor(h)) * 60 + 1e-6);
    return (hh % 12 || 12) + ':' + (mm < 10 ? '0' : '') + mm + (hh < 12 ? ' a. m.' : ' p. m.');
  }
  var info = null;
  function hora() {
    info = W.__paisaje ? W.__paisaje() : { h: 14, fase: 'tarde', forzada: false };
    $$('[data-hora]').forEach(function (e) { e.textContent = fmt(info.h); });
    $$('[data-frase]').forEach(function (e) { e.textContent = FRASES[info.fase]; });
    $$('[data-fase-oculta]').forEach(function (e) { e.textContent = ' · ' + info.fase + (info.forzada ? ' (hora fijada en el enlace)' : ''); });
  }
  hora();
  if (!info.forzada) setInterval(hora, 60000);

  // ---------- parallax suave; las animaciones del cielo se pausan cuando no se ve ----------
  var cielo = $('.cielo');
  if (cielo) {
    var capas = $$('[data-par]', cielo).map(function (g) { return [g, +g.getAttribute('data-par')]; });
    var pendiente = false;
    var parallax = function () {
      pendiente = false;
      var y = W.scrollY || W.pageYOffset, alto = cielo.offsetHeight;
      if (y > alto + 40) return;
      var esc = Math.max(cielo.clientWidth / 400, alto / 120);
      for (var i = 0; i < capas.length; i++) capas[i][0].style.transform = 'translateY(' + (Math.max(0, y) * capas[i][1] / esc).toFixed(2) + 'px)';
    };
    if (!quieto) W.addEventListener('scroll', function () { if (!pendiente) { pendiente = true; requestAnimationFrame(parallax); } }, { passive: true });
    if ('IntersectionObserver' in W) new IntersectionObserver(function (es) { cielo.classList.toggle('pausado', !es[0].isIntersecting); }).observe(cielo);
  }

  // ---------- tema claro / oscuro ----------
  var mq = W.matchMedia ? W.matchMedia('(prefers-color-scheme: dark)') : null;
  function oscuro() { var t = R.getAttribute('data-tema'); return t ? t === 'oscuro' : !!(mq && mq.matches); }
  function pintarTema() {
    var o = oscuro();
    if (o) R.setAttribute('data-oscuro', ''); else R.removeAttribute('data-oscuro');
    $$('[data-tema]').forEach(function (b) { b.setAttribute('aria-label', o ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'); });
  }
  pintarTema();
  if (mq && mq.addEventListener) mq.addEventListener('change', pintarTema);

  // ---------- copiar ----------
  // En los navegadores internos (Instagram, Facebook, TikTok…) el portapapeles moderno falla seguido:
  // ahí se copia primero a la vieja (sincrónico, dentro del toque) y después se prueba el moderno.
  var enApp = /Instagram|FBAN|FBAV|FB_IAB|FBIOS|Line\/|TikTok|musical_ly|BytedanceWebview|Snapchat|Twitter/i.test(navigator.userAgent || '');
  var moderno = !!(navigator.clipboard && navigator.clipboard.writeText && W.isSecureContext);
  function copiarViejo(t) {
    var ta = d.createElement('textarea'), ok = false, y = W.pageYOffset || 0;
    ta.value = t;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:absolute;left:-9999px;top:' + y + 'px;font-size:16px;opacity:0';
    d.body.appendChild(ta);
    try { ta.select(); ta.setSelectionRange(0, t.length); ok = d.execCommand('copy'); } catch (e) { ok = false; }
    d.body.removeChild(ta);
    try { W.getSelection().removeAllRanges(); } catch (e) {}
    return ok;
  }
  function copiar(t) {
    if (enApp || !moderno) {
      if (copiarViejo(t)) return Promise.resolve(true);
      if (!moderno) return Promise.resolve(false);
    }
    // sin esperar nada antes: el navegador exige que sea dentro del toque
    return navigator.clipboard.writeText(t).then(function () { return true; }, function () { return copiarViejo(t); });
  }
  function texto(slug) { var el = d.getElementById('prompt-' + slug); return el ? JSON.parse(el.textContent) : ''; }
  var postal = $('[data-postal]');
  var aviso = $('.aviso');
  function avisar(m) {
    if (!aviso) return;
    aviso.textContent = m;
    requestAnimationFrame(function () { aviso.classList.add('visto'); });
    clearTimeout(aviso._t);
    aviso._t = setTimeout(function () { aviso.classList.remove('visto'); }, 3800);
  }
  function sellar() {
    if (!postal) return;
    var ahora = new Date(), hh = ahora.getHours(), mm = ahora.getMinutes();
    var marca = 'HOY · ' + (hh % 12 || 12) + ':' + (mm < 10 ? '0' : '') + mm + (hh < 12 ? ' A. M.' : ' P. M.');
    $$('.sello-hora', postal).forEach(function (e) { e.textContent = marca; });
    postal.classList.remove('sellada');
    void postal.offsetWidth; // reinicia la animación del sello
    postal.classList.add('sellada');
  }
  function marcar(btn, txt) {
    var et = $('.etiqueta', btn);
    clearTimeout(btn._t);
    btn.classList.add('copiado');
    if (et) { if (!btn._orig) btn._orig = et.textContent; et.textContent = txt || '¡Copiado!'; }
    btn._t = setTimeout(function () { btn.classList.remove('copiado'); if (et) et.textContent = btn._orig; }, 2600);
  }
  function respaldoManual(t) {
    var r = $('.respaldo');
    if (!r) {
      r = d.createElement('div');
      r.className = 'respaldo';
      r.innerHTML = '<p>Este navegador no me dejó copiar solo. Ya te seleccioné el prompt: tocá «Copiar» en el menú (o mantené presionado el texto).</p><textarea readonly aria-label="Texto del prompt"></textarea>';
      var info = $('.info');
      if (info) info.insertBefore(r, info.firstChild); else d.body.appendChild(r);
    }
    var ta = $('textarea', r);
    ta.value = t;
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, t.length);
  }

  // ---------- voltear la postal ----------
  var frente = postal && $('.frente', postal), dorso = postal && $('.dorso', postal), bEntera = postal && $('[data-entera]', postal);
  function voltear(v) {
    var foco = d.activeElement, cara = v ? frente : dorso;
    postal.classList.toggle('volteada', v);
    if (!quieto) {
      postal.classList.remove('girando');
      void postal.offsetWidth;
      postal.classList.add('girando');
    }
    if (!v) entera(false);
    if (v) { frente.setAttribute('inert', ''); dorso.removeAttribute('inert'); } else { frente.removeAttribute('inert'); dorso.setAttribute('inert', ''); }
    $$('.btn-voltear').forEach(function (b) { b.setAttribute('aria-pressed', v ? 'true' : 'false'); });
    // si el foco quedó en la cara que se fue, lo paso a la que llegó
    if (foco && cara.contains(foco)) {
      var destino = v ? $('.carta', dorso) : $('.tocar', frente);
      if (destino) destino.focus({ preventScroll: true });
    }
    avisarMascota('mc:volteo', v);
  }
  function entera(v) {
    if (!bEntera) return;
    postal.classList.toggle('entera', v);
    bEntera.setAttribute('aria-expanded', v ? 'true' : 'false');
    $('span', bEntera).textContent = v ? 'Achicar' : 'Ver todo';
  }

  // ---------- contacto ----------
  var bContacto = $('[data-contacto]'), menu = d.getElementById('menu-contacto');
  function contacto(v) {
    if (!menu) return;
    menu.hidden = !v;
    bContacto.setAttribute('aria-expanded', v ? 'true' : 'false');
  }

  // ---------- compartir ----------
  function compartir(b) {
    var datos = { title: b.getAttribute('data-titulo'), text: b.getAttribute('data-texto'), url: b.getAttribute('data-url') };
    if (navigator.share) { navigator.share(datos).catch(function () {}); return; }
    copiar(datos.url).then(function (ok) { avisar(ok ? 'Link copiado. Pegalo donde querás.' : 'Copiá el link de la barra de direcciones.'); });
  }

  d.addEventListener('click', function (ev) {
    var t = ev.target;
    if (!t.closest) return;
    var b = t.closest('[data-copiar]');
    if (b) {
      var slug = b.getAttribute('data-copiar'), txt = texto(slug);
      copiar(txt).then(function (ok) {
        if (!ok) { respaldoManual(txt); return; }
        $$('[data-copiar="' + slug + '"]').forEach(function (x) { marcar(x); });
        sellar();
        avisar('¡Listo! Ahora pegalo en tu Claude Code.');
        avisarMascota('mc:copiado', b);
        if (navigator.vibrate) try { navigator.vibrate(14); } catch (e) {}
      });
      return;
    }
    var dato = t.closest('[data-copiar-dato]');
    if (dato) {
      copiar(dato.getAttribute('data-copiar-dato')).then(function (ok) {
        if (ok) { marcar(dato); dato.setAttribute('aria-label', 'Copiado'); setTimeout(function () { dato.setAttribute('aria-label', dato.getAttribute('data-etiqueta')); }, 2600); }
        else { var s = dato.parentNode.querySelector('small'); if (s) { var rg = d.createRange(); rg.selectNodeContents(s); var sel = W.getSelection(); sel.removeAllRanges(); sel.addRange(rg); } }
      });
      return;
    }
    if (t.closest('[data-voltear]') && postal) { voltear(!postal.classList.contains('volteada')); return; }
    if (t.closest('[data-entera]')) { entera(!postal.classList.contains('entera')); return; }
    if (t.closest('[data-contacto]')) { contacto(menu.hidden); if (!menu.hidden) $('a', menu).focus(); return; }
    if (menu && !menu.hidden && !t.closest('.menu-contacto')) contacto(false);
    var c = t.closest('[data-compartir]');
    if (c) { compartir(c); return; }
    if (t.closest('[data-tema]')) {
      var n = oscuro() ? 'claro' : 'oscuro';
      R.setAttribute('data-tema', n);
      try { localStorage.setItem('tema', n); } catch (e) {}
      pintarTema();
      return;
    }
    var pz = t.closest('[data-pausa]');
    if (pz) {
      var v = d.getElementById(pz.getAttribute('data-pausa'));
      if (v.paused) { v._manual = false; v.play().catch(function () {}); } else { v._manual = true; v.pause(); }
    }
  });
  d.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && menu && !menu.hidden) { contacto(false); bContacto.focus(); }
  });

  // ---------- el loop de la terminal: solo cuando se ve, nunca con menos movimiento ----------
  $$('video[data-loop]').forEach(function (vid) {
    var bP = $('[data-pausa="' + vid.id + '"]');
    var estadoVid = function () {
      if (!bP) return;
      bP.setAttribute('data-pausado', vid.paused ? '1' : '0');
      bP.setAttribute('aria-label', vid.paused ? 'Reproducir la animación' : 'Pausar la animación');
    };
    vid.addEventListener('play', estadoVid);
    vid.addEventListener('pause', estadoVid);
    estadoVid();
    if (!quieto && 'IntersectionObserver' in W) {
      new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { if (!vid._manual) vid.play().catch(function () {}); } else if (!vid.paused) vid.pause();
      }, { threshold: 0.3 }).observe(vid);
    }
  });
})();
