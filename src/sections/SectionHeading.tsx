export default function SectionHeading({
  label,
  title,
}: {
  label: string;
  title: string;
}) {
  return (
    <div className="mb-8">
      <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-accent">
        {label}
      </p>
      <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
        {title}
      </h2>
    </div>
  );
}
