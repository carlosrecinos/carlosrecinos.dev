// Búsqueda ⌘K (o Ctrl+K, «/» o el botón Buscar). Solo se incluye cuando hay BUSQUEDA_DESDE prompts o más.
// La lista viene incrustada en #indice-prompts: [{s: slug, t: título, b: bajada, e: etiquetas, n: Nº}].
(function () {
  'use strict';
  var d = document, W = window;
  var pal = d.getElementById('paleta'), q = d.getElementById('pal-q'), lista = d.getElementById('pal-lista');
  var datos = d.getElementById('indice-prompts');
  if (!pal || !q || !lista || !datos || !pal.showModal) return;
  var P = JSON.parse(datos.textContent);
  var ACC = P.map(function (p) {
    return { g: 'Postales', t: p.t, s: 'Nº ' + p.n + ' · ' + p.b, k: p.e.join(' '), href: '/' + p.s + '/' };
  }).concat([
    { g: 'Ir a', t: 'CV (EN)', s: 'Portfolio & résumé, in English', k: 'curriculum resume portafolio trabajo ingles', href: '/cv/' },
    { g: 'Ir a', t: 'Seguime en Instagram', s: '@carlos_recino', k: 'instagram seguir reels videos', href: 'https://www.instagram.com/carlos_recino/' }
  ]);
  var plano = function (s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
  var esc = function (s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var vis = [], act = 0;
  function pintar() {
    var palabras = plano(q.value.trim()).split(/\s+/).filter(Boolean);
    vis = ACC.filter(function (a) { var hay = plano([a.t, a.s, a.k, a.g].join(' ')); return palabras.every(function (p) { return hay.indexOf(p) >= 0; }); });
    if (act >= vis.length) act = 0;
    var h = '', g = '';
    vis.forEach(function (a, i) {
      if (a.g !== g) { g = a.g; h += '<div class="pal-grupo" role="presentation">' + g + '</div>'; }
      h += '<a class="pal-it" role="option" id="po-' + i + '" data-i="' + i + '" href="' + esc(a.href) + '" aria-selected="' + (i === act) + '"><span class="pal-t">' + esc(a.t) + '<small>' + esc(a.s) + '</small></span></a>';
    });
    lista.innerHTML = h || '<p class="pal-vacio">Nada con «' + esc(q.value) + '». Probá con otra palabra.</p>';
    marcar();
  }
  function marcar() {
    Array.prototype.forEach.call(lista.querySelectorAll('.pal-it'), function (el) { el.setAttribute('aria-selected', String(+el.getAttribute('data-i') === act)); });
    var el = d.getElementById('po-' + act);
    if (el) { q.setAttribute('aria-activedescendant', el.id); el.scrollIntoView({ block: 'nearest' }); } else q.removeAttribute('aria-activedescendant');
  }
  function abrir() { if (pal.open) return; q.value = ''; act = 0; pintar(); pal.showModal(); q.focus(); }
  function cerrar() { if (pal.open) pal.close(); }
  q.addEventListener('input', function () { act = 0; pintar(); });
  q.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (vis.length) { act = (act + (e.key === 'ArrowDown' ? 1 : -1) + vis.length) % vis.length; marcar(); } }
    else if (e.key === 'Enter') { e.preventDefault(); var a = vis[act]; if (a) location.href = a.href; }
  });
  pal.addEventListener('click', function (e) { if (e.target === pal) cerrar(); });
  d.addEventListener('click', function (e) {
    if (!e.target.closest) return;
    if (e.target.closest('[data-buscar]')) abrir();
    else if (e.target.closest('[data-cerrar-paleta]')) cerrar();
  });
  d.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); if (pal.open) cerrar(); else abrir(); }
    else if (e.key === '/' && !pal.open && !/^(INPUT|TEXTAREA|SELECT)$/.test(d.activeElement.tagName)) { e.preventDefault(); abrir(); }
  });
  if (/Mac|iPhone|iPad/.test(navigator.platform || '')) return;
  Array.prototype.forEach.call(d.querySelectorAll('.k-mod'), function (k) { k.textContent = 'Ctrl'; });
})();
