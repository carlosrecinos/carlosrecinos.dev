import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// El portafolio (inglés, para reclutadores) vive en /cv/. La raíz del dominio es la portada de
// prompts, que genera site/build.mjs dentro del mismo dist/ (ver package.json → build).
// En `npm run dev` sigue sirviéndose en / para trabajar cómodo.
// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/cv/" : "/",
  plugins: [react(), tailwindcss()],
  build: { outDir: "dist/cv", emptyOutDir: true },
  server: { port: 5273 },
  preview: { port: 5273 },
}));
