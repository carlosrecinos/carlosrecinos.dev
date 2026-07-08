# CLAUDE.md — carlosrecinos.dev (portafolio personal)

## Qué es este proyecto y para qué existe

Portafolio personal de Carlos en `https://carlosrecinos.dev`. **No es un producto del flywheel: es un activo de conversión de la búsqueda de empleo 2026** (ver `../job-search-2026/PLAN.md`). Su único trabajo es que un recruiter, founder o hiring manager que llega con 60 segundos de atención salga pensando *"senior de verdad, con LLMs en producción — hay que entrevistarlo"*.

Audiencia: hiring managers y recruiters de US/EU, founders que llegan desde HN/YC/LinkedIn. **Todo el contenido del sitio va en inglés** (excepción a la regla de español del ecosistema — el público es internacional).

## Reglas de tono (importan más que el diseño)

1. **Understatement** (regla del ego de MARCA_PERSONAL.md): mostrar, no presumir. "2,000+ users in production" sí; "rockstar/ninja/guru" jamás.
2. **Cada claim de velocidad-con-IA va emparejado con un claim de verificación** (arquitectura propia, review de cada diff, testing). La persona es *"senior con criterio que se mueve a velocidad de agentes"*, no *"entusiasta de la IA"*.
3. Nada de información confidencial de clientes, ni cifras de revenue, ni nombres de clientes de contratos con NDA (los contratos US/UK se describen igual que en el CV: por industria, no por nombre).
4. Los proyectos featured llevan link vivo cuando existe (futsal.chalatech.com, e-comanda.com, aguaaltavista.vercel.app) — un demo funcionando vale más que diez párrafos.

## Stack y comandos

- **Vite + React + TypeScript + Tailwind CSS v4.** SPA de una sola página con navegación por anclas. Sin router, sin backend, sin CMS, sin base de datos.
- Todo el contenido vive en `src/data/` (archivos `.ts` tipados: `projects.ts`, `experience.ts`, `profile.ts`). Editar contenido = editar datos, no componentes.
- Comandos: `npm run dev` (puerto 5273), `npm run build`, `npm run preview`.
- Deploy: **Vercel** (proyecto `carlosrecinos-dev`), dominio `carlosrecinos.dev`. Push a `main` = deploy.
- El CV descargable se copia desde `../job-search-2026/Carlos-Recinos-CV-2026.pdf` a `public/Carlos-Recinos-CV.pdf` — si el CV cambia, re-copiar.

## Diseño

Minimalista, typography-first, digno de un ingeniero senior: mucho espacio en blanco, una sola fuente sans + acentos monospace para chips de stack, un solo color de acento, dark mode por `prefers-color-scheme`. Sin librerías de animación, sin carruseles, sin loaders. Presupuesto de peso: **< 100 KB de JS**; Lighthouse ≥ 95 en todo. Si una decisión de diseño compite contra la legibilidad o la velocidad, pierde.

## Guardrails

- **Timebox: este sitio se termina en 1–2 sesiones.** Es un multiplicador de las aplicaciones, no un sustituto — si el sitio empieza a crecer en scope (blog, i18n, CMS, animaciones), eso es el patrón "seguir construyendo para no vender" y hay que frenarlo y volver a las aplicaciones.
- v1 NO incluye: blog, toggle de idioma, formulario de contacto con backend (mailto: basta), analytics complejos.
- El plan de implementación completo con el copy de cada sección está en `PLAN.md`.
