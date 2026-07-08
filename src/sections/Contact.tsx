import { profile } from "../data/profile";
import SectionHeading from "./SectionHeading";

export default function Contact() {
  return (
    <section id="contact" className="scroll-mt-20 border-t border-border py-16">
      <SectionHeading label="Contact" title="Let's talk" />
      <p className="max-w-2xl text-[0.975rem] leading-relaxed text-fg/85">
        Open to senior remote roles (full-time or contract) — full-stack,
        mobile, or applied AI.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
        <a
          href={`mailto:${profile.email}`}
          className="rounded-md bg-accent px-4 py-2 font-medium text-accent-fg transition-opacity hover:opacity-90"
        >
          {profile.email}
        </a>
        {profile.social.map((s) => (
          <a
            key={s.href}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            {s.label} ↗
          </a>
        ))}
        <a
          href={profile.cv}
          download
          className="font-medium text-accent underline-offset-4 hover:underline"
        >
          Download CV ↓
        </a>
      </div>

      <footer className="mt-20 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-6 font-mono text-xs text-muted">
        <span>
          © {profile.name} · Built with React, Vite &amp; Tailwind · Reviewed,
          tested, and shipped by hand.
        </span>
        <a
          href="https://github.com/carlosrecinos/carlosrecinos.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-accent"
        >
          View source ↗
        </a>
      </footer>
    </section>
  );
}
