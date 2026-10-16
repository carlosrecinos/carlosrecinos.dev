# CLAUDE.md — carlosrecinos.dev

Un dominio, dos públicos, un solo build:

| Ruta | Qué es | Idioma | Lo genera |
|---|---|---|---|
| `/` | **La marca personal**: el link de la biografía de Instagram (@carlos_recino). Los prompts de los videos de Carlos, como postales salvadoreñas, listos para copiar y pegar en Claude Code | español (voseo) | `site/build.mjs` |
| `/<slug>/` · `/<slug>.md` | La página de cada prompt (su propia vista previa para WhatsApp) y el prompt crudo para descargar | español | `site/build.mjs` |
| `/cv/` | **El portafolio para reclutadores** (US/EU), el React de siempre, sin rediseño | inglés | Vite (`src/`) |
| `/Carlos-Recinos-CV.pdf` | El CV. **Se queda en la raíz**: esa URL está impresa en CV que ya se mandaron | inglés | `public/` → se mueve a la raíz en el build |

El repo es **PÚBLICO**: cero secretos, cero rutas de las máquinas de Carlos, nada de `PRUEBA.md`.
El build se niega a publicar si encuentra rutas internas o palabras prohibidas (ver abajo).

## Comandos

```sh
npm ci
npm run dev          # el portafolio en http://localhost:5273 (en / para trabajar cómodo)
npm run build        # TODO: tsc + vite (portafolio → dist/cv/) + site/build.mjs (portada y prompts → dist/)
npm run preview      # sirve dist/ como Vercel (trailing slash, 404, .md) en http://localhost:4173
npm run verificar    # navegadores de verdad: capturas, Copiar exacto, mi Claude, peso (ver abajo)
npm run og           # imágenes para compartir (og.jpg) — se corre a mano y se commitea
```

`verificar` y `og` necesitan Playwright (Chromium y WebKit). No es dependencia del repo: se apunta a uno instalado con
`PLAYWRIGHT_MODULE=/ruta/a/node_modules/playwright/index.mjs`. `npm run verificar -- https://<preview>` revisa un deploy.
En la URL: `?hora=19` fija la hora del paisaje; `?mascota=apurada` divide entre 10 los tiempos de mi Claude.

## Cómo se agrega un prompt

La fuente de verdad está en el repo **privado** de la marca personal, en `prompts/<slug>/`, donde viven
también las pruebas (`PRUEBA.md`, `PROBADO`), que **no** se publican.

1. En el privado: `prompts/<slug>/PROMPT.md` (el texto exacto que la gente copia) y `meta.json`:
   `titulo`, `bajada`, `fecha` (AAAA-MM-DD) obligatorios; opcionales `herramienta` (default «Claude Code»),
   `video` (la frase del video), `como_usarlo` (lista de pasos), `etiquetas`, `probado: true` (insignia «Probado en
   una instalación limpia»), `nota` (lo escrito a mano en el frente de la postal; si no está, sale de la bajada),
   `lugar` (el pueblo del matasellos) y `borrador: true` (no se publica).
   Medios en `prompts/<slug>/medios/` (o, como hoy, `sitio-prompts/medios/<slug>/`): `tarjeta.webp` (720×450, la
   foto del frente), `loop.mp4` + `loop-poster.webp` (la animación de la terminal).
2. En el privado: `bin/sincronizar-prompts.sh` copia **solo** `PROMPT.md`, `meta.json` y los medios a
   `content/prompts/<slug>/` de este repo (nunca `PRUEBA.md` ni `PROBADO`, y se niega si ve rutas internas).
3. Aquí: `npm run og -- <slug>` (genera `content/prompts/<slug>/medios/og.jpg`, la vista previa de WhatsApp),
   `npm run build && npm run verificar`, y commit.
4. Push de una rama = preview de Vercel. **Push a `main` = producción.**

El Nº de postal es el orden de salida (el más viejo es el Nº 1). La portada muestra el más nuevo en grande, los demás
en «Más postales» y completa con postales «Próximamente» en blanco. Con 9 prompts o más aparece la búsqueda ⌘K
(`busqueda_desde` en `site/sitio.config.json`; `BUSQUEDA_DESDE=1 npm run build` la fuerza para verla).

## Reglas de contenido (la portada)

- Español con voseo. Tono: understatement, natural, caliche permitido; nada de gurú.
- La mascota es **«mi Claude» / «tu Claude»**. Nunca «cangrejo» ni «Clawd».
- La portada trata de **los prompts** (para Claude Code, eso sí se dice); de cómo se hacen los videos no se habla.
- Nada de la marca de Instagram (ni logo ni degradado): una camarita genérica y el texto alcanzan.
- Contacto (`site/sitio.config.json` → `contacto`): WhatsApp, correo y mensaje por Instagram, en ese orden.
  `"whatsapp": null` lo apaga.

## Presupuesto (lo revisa el build o `verificar`)

Primera carga de `/` < 500 KB · JS propio < 30 KB, inline y sin frameworks · sin rastreo ni cookies ·
Lighthouse móvil ≥ 95 en las cuatro categorías · Copiar copia **exacto** `PROMPT.md` (también en el navegador de
Instagram: ahí se copia primero a la vieja, `execCommand`, y si todo falla queda el texto seleccionado) ·
«Copiar» visible sin scroll a 390×664 (el alto que deja Instagram) · `prefers-reduced-motion` respetado.

## Cómo está hecha la portada (`site/`)

- `build.mjs` arma todo; `lib.mjs` lee los prompts; `piezas.mjs` íconos, estampilla, matasellos y el prompt en el
  reverso; `escena.mjs` el paisaje pixel art (El Tunco, el volcán, los cerros de Chalate) y las piezas de mi Claude.
- `plantilla/paisaje.js` (en `<head>`): la hora de `America/El_Salvador` decide los colores del cielo, el sol, la luna,
  las estrellas y las luciérnagas. `main.js`: Copiar, voltear la postal, Contacto, tema. `mascota.js`: mi Claude vivo
  dentro del paisaje — camina con el scroll, trabaja cuando tocás, a los 20 s se duerme (de noche ya amanece dormido),
  a los 45 s clava «AHORITA VENGO», cuelga la corona y se va, manda postales de dónde anda y al volver avisa cuánto
  rato lo dejaste solo; al copiar celebra con confeti. Con menos movimiento cambia de estado sin moverse.
- Todo el paisaje anima a saltos de un píxel (`steps()`), y lo que no se ve no anima: así el teléfono casi no repinta.
- CSS y JS se minifican con esbuild y van inline; la CSP lleva el hash de cada script. Los activos van a `/a/` con
  hash (caché de un año). `vercel.json`: `instagram.carlosrecinos.dev/*` → 301 a la raíz, `.md` como
  `text/markdown`, caché larga, 404 propia (`dist/404.html`, mi Claude anda fuera).

## El portafolio (`/cv/`)

Vite + React 19 + TypeScript + Tailwind CSS 4, en inglés, para reclutadores y founders. **Solo se mudó, no se
rediseñó**: `vite.config.ts` compila con `base: '/cv/'` a `dist/cv/`; `canonical`, `og:url` y `og:image` apuntan a
`/cv/`. Contenido en `src/data/`. Reglas de tono: understatement, cada claim de velocidad con IA emparejado con uno de
verificación, nada confidencial de clientes. El CV descargable se copia de `../job-search-2026/` a
`public/Carlos-Recinos-CV.pdf`; el build lo deja en la raíz del sitio. Presupuesto: < 100 KB de JS, Lighthouse ≥ 95.

## Deploy

Proyecto de Vercel `carlosrecinos-dev` (team `carlos-recinos-projects`), conectado a GitHub: rama = preview,
`main` = producción. Vercel corre `npm ci && npm run build` (no necesita Playwright: las og.jpg ya vienen hechas).
`robots.txt` y `sitemap.xml` los genera el build en la raíz (con `/`, `/cv/` y cada prompt).
