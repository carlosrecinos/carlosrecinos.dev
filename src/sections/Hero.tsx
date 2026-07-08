import { profile } from "../data/profile";

export default function Hero() {
  return (
    <section id="top" className="scroll-mt-20 pt-20 pb-16 sm:pt-28">
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
