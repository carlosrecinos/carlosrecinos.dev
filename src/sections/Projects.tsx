import { featured, more } from "../data/projects";
import SectionHeading from "./SectionHeading";

function Chip({ label }: { label: string }) {
  return (
    <span className="rounded border border-border px-2 py-0.5 font-mono text-[0.7rem] lowercase text-muted">
      {label}
    </span>
  );
}

export default function Projects() {
  return (
    <section id="work" className="scroll-mt-20 border-t border-border py-16">
      <SectionHeading label="Selected work" title="Featured projects" />

      <div className="space-y-12">
        {featured.map((p, i) => (
          <article key={p.title}>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-mono text-xs text-accent" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="text-lg font-semibold tracking-tight">{p.title}</h3>
              <span className="text-sm text-muted">— {p.tagline}</span>
            </div>

            <p className="mt-2 max-w-2xl text-[0.95rem] leading-relaxed text-fg/85">
              {p.description}
            </p>

            {p.bullets && (
              <ul className="mt-3 space-y-1">
                {p.bullets.map((b) => (
                  <li
                    key={b}
                    className="flex gap-2 text-sm text-muted before:text-accent before:content-['—']"
                  >
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex flex-wrap gap-1.5">
              {p.stack.map((s) => (
                <Chip key={s} label={s} />
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
              {p.role && (
                <span className="font-mono text-xs lowercase text-muted">
                  {p.role}
                </span>
              )}
              {p.links?.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={
                    l.primary
                      ? "rounded-md bg-accent px-3 py-1.5 font-medium text-accent-fg transition-opacity hover:opacity-90"
                      : "font-medium text-accent underline-offset-4 hover:underline"
                  }
                >
                  {l.primary ? `▶ ${l.label}` : `${l.label} ↗`}
                </a>
              ))}
            </div>
          </article>
        ))}
      </div>

      {/* More projects */}
      <h3 className="mb-6 mt-16 font-mono text-xs uppercase tracking-[0.18em] text-muted">
        More projects
      </h3>
      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        {more.map((p) => (
          <div key={p.title}>
            <div className="flex flex-wrap items-baseline gap-2">
              <h4 className="font-medium">{p.title}</h4>
              {p.link && (
                <a
                  href={p.link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent underline-offset-4 hover:underline"
                >
                  {p.link.label} ↗
                </a>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted">{p.description}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {p.stack.map((s) => (
                <Chip key={s} label={s} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
