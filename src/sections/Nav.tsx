const links = [
  { label: "Work", href: "#work" },
  { label: "How I build", href: "#how" },
  { label: "Experience", href: "#experience" },
];

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
        <div className="flex items-center gap-5 text-sm">
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
