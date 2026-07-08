import { experience } from "../data/experience";
import SectionHeading from "./SectionHeading";

export default function Experience() {
  return (
    <section id="experience" className="scroll-mt-20 border-t border-border py-16">
      <SectionHeading label="Experience" title="Nine years, shipping" />
      <ol className="space-y-5">
        {experience.map((r) => (
          <li
            key={`${r.title}-${r.dates}`}
            className="flex flex-col gap-x-6 gap-y-1 sm:flex-row sm:items-baseline sm:justify-between"
          >
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
