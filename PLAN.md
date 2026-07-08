# PLAN — carlosrecinos.dev

Objetivo: portafolio de una página, minimalista, en inglés, que convierte visitas de recruiters/founders en entrevistas. Construible en 1–2 sesiones. Todo el copy ya está redactado aquí — la sesión de build es mecánica.

---

## Fase 0 — Dominio (Carlos, 10 min, hoy)

- Comprar **carlosrecinos.dev** (~$8.75 primer año, renueva ~$12.87 — el de la captura de Namecheap). Es LA elección correcta: TLD estándar de desarrolladores, barato, y fuerza HTTPS (HSTS preloaded — con Vercel es automático, cero fricción).
- No comprar los demás: `.inc` renueva a $2,060/año (trampa), `.car/.now/.lol` no aportan. Si algún día aparece `carlosrecinos.com` barato, se agrega como redirect — no es necesario.

## Fase 1 — Scaffold

```bash
cd /Users/carlosrecinos/Documents/Chalatech/carlosrecinos.dev
npm create vite@latest . -- --template react-ts
npm install tailwindcss @tailwindcss/vite
# vite.config.ts: plugin @tailwindcss/vite + server.port 5273
# (recordar gotcha del Mac: npm_config_python=/usr/bin/python3 si algún módulo nativo falla)
```

Estructura:

```
src/
  data/profile.ts      # nombre, headline, links, email
  data/projects.ts     # featured[] + more[] (tipos: title, tagline, role, stack[], bullets[], links[], status)
  data/experience.ts   # timeline desde el CV
  sections/Hero.tsx
  sections/HowIBuild.tsx
  sections/Projects.tsx
  sections/Experience.tsx
  sections/Contact.tsx
  App.tsx              # composición + nav de anclas sticky minimal
public/Carlos-Recinos-CV.pdf   # copiado de ../job-search-2026/
public/og.png                  # 1200×630, generado al final
```

## Fase 2 — Diseño (tokens)

- **Tipografía:** Inter (o system-ui stack para 0 KB) para texto; `ui-monospace` para chips de stack y acentos. Escala: 15px base, h1 ~clamp(2.2rem–3.5rem).
- **Color:** fondo `#0b0e14` (dark) / `#fafafa` (light) vía `prefers-color-scheme`; texto alto contraste; **un** acento (verde-teal `#2dd4a7` o ámbar — elegir uno, usarlo solo en links, chips activos y el CTA).
- **Layout:** una columna, `max-w-3xl mx-auto`, secciones separadas por espacio (no por líneas ni cards pesadas). Chips de stack = borde 1px, monospace, minúsculas.
- **Nada de:** animaciones de entrada, parallax, carruseles, spinners, fotos de stock. Foto personal: opcional y pequeña en el hero (aquí sí puede ir, a diferencia del CV).

## Fase 3 — Contenido (copy final, en inglés)

### Hero
> **Carlos Recinos**
> Senior Full-Stack & Applied AI Engineer — web, mobile, and LLM systems in production.
>
> 9 years shipping for companies in the US, UK, and Latin America. Founder of a bootstrapped product studio where I design, build, and operate revenue-generating SaaS end to end. I build with AI coding agents daily — and own the architecture, review, and testing that keep that speed safe.
>
> El Salvador · GMT-6 (full US overlap) · English & Spanish
> [View my work ↓] [Download CV] [GitHub] [LinkedIn]

### How I build (la sección diferenciadora — corta, 3 puntos)
- **AI-augmented by default.** Claude Code with multi-agent workflows is my daily driver — planning, scaffolding, test generation, refactors.
- **Human-owned quality.** I review every agent diff, own the architecture decisions, and verify end-to-end before anything ships. Speed never outruns quality.
- **LLMs in production, not demos.** WhatsApp agents qualifying real leads with closed-loop ad attribution, LLM ad-campaign generation, AI document extraction — running for paying customers.

### Featured projects (5, en este orden)

1. **TurboPyme — Electronic invoicing SaaS (compliance-critical)**
   Mini-ERP integrated with El Salvador's Ministry of Finance (DTE) API: issues legally binding electronic invoices for businesses, with an AI document reader built on open-source LLMs.
   Bullets: government API integration with strict signing/schema requirements · multi-tenant billing · AI extraction pipeline.
   `go · connectrpc/protobuf · react · postgresql · gcp` — Role: Founder & Lead Engineer.

2. **Eloquia + AdMind — Conversational-AI growth stack**
   Multi-tenant WhatsApp LLM agents (Meta Cloud API, tool use / function calling) that qualify inbound leads and book demos on a live calendar, plus an LLM-powered Meta ads generator with closed-loop click-to-WhatsApp attribution (ad → conversation → deal).
   `typescript · next.js · prisma · anthropic / gemini / fireworks apis` — Role: Founder & Lead Engineer.

3. **E-Comanda — Restaurant POS SaaS** → live: e-comanda.com
   Multi-tenant point-of-sale for restaurants (web + tablet) with subscription billing, in production with paying customers.
   `react · node.js · postgresql` — Role: Founder & Lead Engineer.

4. **Chalet — Delivery & ride platform**
   Consumer, driver, and restaurant/admin apps with 2,000+ users; real-time GPS tracking and automatic order assignment via a vehicle-routing (VRP) optimizer.
   `jetpack compose · react native · socket.io · node.js · python or-tools` — Role: Founder & Lead Engineer.

5. **Futsal — Real-time 3D multiplayer soccer (browser)** → live & playable: futsal.chalatech.com
   11v11 browser soccer with server-authoritative physics, client prediction and interpolation. Built to explore real-time netcode — playable right now.
   `colyseus · rapier physics · react three fiber · node.js · vps + ci/cd`

   *(Este es el gancho: un demo multiplayer jugable al instante hace más por la credibilidad que cualquier bullet. Ponerle botón grande "Play it live".)*

### More projects (grid compacto, una línea cada uno)
- **RadarMédico** — clinic management SaaS (`react · node`)
- **FacturAgua** — billing for community water boards → live: aguaaltavista.vercel.app
- **Chalatech Brain** — internal ops platform: knowledge, tasks, business dashboards (`nestjs · postgres · react`)
- **Pérgola** — POS for a tourism center (`react · node`)
- **Potrero** — farm & paddock management PWA with satellite map drawing (`vite · leaflet · fastify`)
- **Aprender** — language-learning app with FSRS spaced repetition + LLM story generation (`expo · fastify · gemini`)

### Experience (timeline compacta — mismas entradas y fechas del CV)
Founder & Lead Engineer, Chalatech (2023–present) · Sr Android Engineer, US paid-video social platform (2024–2025) · Sr iOS Engineer, UK pilgrimage platform (2023) · Sr Full-Stack & Mobile Lead, US stock-investment platform (2021–2022) · Mobile Engineer, US healthcare (2020–2021) · Intern, GenUI Seattle (2019–2020) · Software Engineer, Korinver (2017–2019).

### Contact
> Open to senior remote roles (full-time or contract) — full-stack, mobile, or applied AI.
> **carlosrecinos1999@gmail.com** · GitHub · LinkedIn · [Download CV]

## Fase 4 — SEO / meta

- `<title>Carlos Recinos — Senior Full-Stack & Applied AI Engineer</title>` + meta description con las keywords del CV (LLM agents, agentic workflows, React, React Native, Go, remote LATAM).
- OG tags + `og.png` (1200×630: nombre + headline sobre fondo oscuro, generarlo con el mismo CSS del sitio y screenshot).
- `robots.txt` + favicon (iniciales "cr" en monospace).
- JSON-LD `Person` (name, jobTitle, sameAs → GitHub/LinkedIn).

## Fase 5 — Deploy

1. Repo GitHub `carlosrecinos/carlosrecinos.dev` (público — el repo mismo es señal).
2. Vercel: importar repo, framework Vite, build `npm run build`, output `dist/`.
3. Dominio: agregar `carlosrecinos.dev` en Vercel → apuntar nameservers/A-record desde Namecheap. HTTPS automático.
4. Copiar el CV PDF a `public/` en el build.

## Fase 6 — QA (checklist de cierre)

- [ ] Mobile (390px) y desktop, dark y light.
- [ ] Lighthouse ≥ 95 performance/accessibility/SEO.
- [ ] Todos los links viven (futsal, e-comanda, aguaaltavista, GitHub, LinkedIn, mailto, PDF).
- [ ] OG preview correcto (probar pegando la URL en un DM).
- [ ] Leer todo el copy en voz alta una vez — cero typos (el sitio ES la muestra de inglés escrito).

## Después del deploy (integración con la búsqueda)

- Agregar la URL al CV (línea de contacto), al perfil de LinkedIn, al post de HN "Who wants to be hired", y a los perfiles de G2i/Mercor/Lemon/Toptal.
- Regenerar el PDF del CV con la URL incluida (editar `../job-search-2026/cv-carlos-recinos-2026.html` + re-print).

**Recordatorio de guardrail:** si el sitio no está deployado al final de la 2.ª sesión, se corta scope hasta que lo esté. Perfecto < publicado.
