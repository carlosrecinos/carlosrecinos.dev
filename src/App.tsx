import Nav from "./sections/Nav";
import Hero from "./sections/Hero";
import HowIBuild from "./sections/HowIBuild";
import Projects from "./sections/Projects";
import Experience from "./sections/Experience";
import Contact from "./sections/Contact";

export default function App() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-fg"
      >
        Skip to content
      </a>
      <Nav />
      <main id="main" className="mx-auto max-w-3xl px-6">
        <Hero />
        <HowIBuild />
        <Projects />
        <Experience />
        <Contact />
      </main>
    </>
  );
}
