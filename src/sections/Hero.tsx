import { profile } from "../data/profile";

export default function Hero() {
  return (
    <section id="top" className="relative scroll-mt-20 pt-20 pb-16 sm:pt-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-32 -top-16 h-[30rem] bg-[radial-gradient(ellipse_40%_55%_at_70%_40%,color-mix(in_oklab,var(--accent)_9%,transparent),transparent_70%)]"
      />
      <a
        href="#contact"
        className="mb-5 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-fg"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60 motion-reduce:animate-none" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
        </span>
        Available for senior remote roles
      </a>
      <p className="mb-4 font-mono text-sm text-accent">
        Senior Full-Stack &amp; Applied AI Engineer
      </p>
      <h1 className="text-[clamp(2.2rem,6vw,3.5rem)] font-bold leading-[1.05] tracking-tight">
        {profile.name}
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-fg/90">
        {profile.headline}
      </p>
      <p className="mt-6 max-w-2xl text-[0.975rem] leading-relaxed text-muted">
        {profile.intro}
      </p>

      <p className="mt-6 flex items-center gap-2 font-mono text-xs text-muted">
        <svg
          aria-hidden="true"
          viewBox="0 0 18 12"
          className="h-3 w-[1.125rem] shrink-0 rounded-[2px] ring-1 ring-border"
        >
          <rect width="18" height="12" fill="#0f47af" />
          <rect y="4" width="18" height="4" fill="#ffffff" />
        </svg>
        {profile.location}
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3 text-sm">
        <a
          href="#work"
          className="rounded-md bg-accent px-4 py-2 font-medium text-accent-fg transition-opacity hover:opacity-90"
        >
          View my work ↓
        </a>
        <a
          href={profile.cv}
          download
          className="rounded-md border border-border px-4 py-2 font-medium transition-colors hover:border-accent hover:text-accent"
        >
          Download CV
        </a>
        {profile.social.map((s) => (
          <a
            key={s.href}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-border px-4 py-2 font-medium transition-colors hover:border-accent hover:text-accent"
          >
            {s.label}
          </a>
        ))}
      </div>
    </section>
  );
}
