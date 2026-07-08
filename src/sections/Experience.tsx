import { experience } from "../data/experience";
import SectionHeading from "./SectionHeading";

export default function Experience() {
  return (
    <section id="experience" className="scroll-mt-20 border-t border-border py-16">
      <SectionHeading label="Experience" title="Nine years, shipping" />
      <ol className="relative space-y-6 border-l border-border pl-6">
        {experience.map((r, i) => (
          <li
            key={`${r.title}-${r.dates}`}
            className="relative flex flex-col gap-x-6 gap-y-1 sm:flex-row sm:items-baseline sm:justify-between"
          >
            <span
              aria-hidden="true"
              className={`absolute -left-[1.83rem] top-[0.45em] h-2.5 w-2.5 rounded-full border-2 border-bg ${
                i === 0 ? "bg-accent" : "bg-border"
              }`}
            />
            <div>
              <span className="font-medium">{r.title}</span>
              <span className="text-muted"> — {r.org}</span>
            </div>
            <span className="shrink-0 font-mono text-xs text-muted">
              {r.dates}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
