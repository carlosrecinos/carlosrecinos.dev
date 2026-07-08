import { howIBuild } from "../data/profile";
import SectionHeading from "./SectionHeading";
import PipelineCanvas from "./PipelineCanvas";

export default function HowIBuild() {
  return (
    <section id="how" className="scroll-mt-20 border-t border-border py-16">
      <SectionHeading label="How I build" title="Speed with a senior's judgment" />
      <PipelineCanvas />
      <div className="grid gap-8 sm:grid-cols-3">
        {howIBuild.map((item) => (
          <div key={item.title}>
            <h3 className="mb-2 font-medium text-fg">{item.title}</h3>
            <p className="text-sm leading-relaxed text-muted">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
