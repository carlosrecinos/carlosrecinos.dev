import { useCallback, useEffect, useState } from "react";

const links = [
  { label: "Work", href: "#work" },
  { label: "How I build", href: "#how" },
  { label: "Experience", href: "#experience" },
];

type Theme = "light" | "dark";

function effectiveTheme(): Theme {
  const override = document.documentElement.dataset.theme;
  if (override === "light" || override === "dark") return override;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(effectiveTheme());
  }, []);

  const toggle = useCallback(() => {
    const next: Theme = effectiveTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* private mode */
    }
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", next === "dark" ? "#0b0e14" : "#fafafa");
    setTheme(next);
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className="rounded-md border border-border p-1.5 text-muted transition-colors hover:border-accent hover:text-accent"
    >
      {theme === "dark" ? (
        /* sun */
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        /* moon */
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
        </svg>
      )}
    </button>
  );
}

export default function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-bg/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
        <a
          href="#top"
          className="font-mono text-sm font-semibold tracking-tight text-fg"
        >
          <span className="text-accent">cr</span>·dev
        </a>
        <div className="flex items-center gap-4 text-sm">
          <div className="hidden gap-5 text-muted sm:flex">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="transition-colors hover:text-fg"
              >
                {l.label}
              </a>
            ))}
          </div>
          <ThemeToggle />
          <a
            href="#contact"
            className="rounded-md bg-accent px-3 py-1.5 font-medium text-accent-fg transition-opacity hover:opacity-90"
          >
            Get in touch
          </a>
        </div>
      </nav>
    </header>
  );
}
