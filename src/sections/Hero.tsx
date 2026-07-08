import { profile } from "../data/profile";

export default function Hero() {
  return (
    <section id="top" className="relative scroll-mt-20 pt-20 pb-16 sm:pt-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-24 -top-24 h-[26rem] bg-[radial-gradient(38rem_circle_at_75%_25%,color-mix(in_oklab,var(--accent)_9%,transparent),transparent_70%)]"
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

      <p className="mt-6 font-mono text-xs text-muted">{profile.location}</p>

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
