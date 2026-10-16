# carlosrecinos.dev

**Carlos Recinos** — construyendo software salvadoreño desde Chalate 🇸🇻

- **`/`** — los prompts de mis videos, como postales: copialos y pegalos en tu Claude Code. En español.
- **`/cv/`** — portfolio & résumé for recruiters, in English.

Un solo build estático, sin rastreo ni cookies:

```sh
npm ci
npm run build      # dist/: la portada y los prompts (site/build.mjs) + el portafolio en dist/cv/ (Vite + React)
npm run preview    # http://localhost:4173
npm run dev        # solo el portafolio, http://localhost:5273
```

## La portada (`site/`)

HTML estático generado con Node, sin framework: cada prompt tiene su página (`/<slug>/`, con su vista previa para
WhatsApp) y su texto crudo (`/<slug>.md`). El paisaje de El Tunco cambia con la hora de El Salvador y mi Claude vive
adentro: camina con el scroll, se duerme si lo dejás solo, se va a la playa y te manda postales.

### Agregar un prompt

1. `content/prompts/<slug>/PROMPT.md` — el texto exacto que se copia.
2. `content/prompts/<slug>/meta.json` — `titulo`, `bajada`, `fecha` (AAAA-MM-DD); opcionales `video`, `como_usarlo`
   (pasos), `etiquetas`, `probado`, `nota`, `lugar`, `herramienta`, `borrador`.
3. `content/prompts/<slug>/medios/` — `tarjeta.webp` (720×450), `loop.mp4` + `loop-poster.webp` (opcionales).
4. `npm run og -- <slug>` genera `medios/og.jpg` (necesita Playwright: `PLAYWRIGHT_MODULE=…`).
5. `npm run build && npm run verificar`, commit y push.

(Yo los escribo y los pruebo en un repo privado y los traigo con un script que copia solo estos archivos.)

## El portafolio (`src/`)

Vite + React 19 + TypeScript + Tailwind CSS 4. Todo el contenido vive en `src/data/`. Se compila con base `/cv/`.

Deploy en Vercel: push a una rama = preview; push a `main` = producción.
