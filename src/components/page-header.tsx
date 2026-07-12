import { cn } from "@/lib/utils";

export default function PageHeader({
  eyebrow,
  title,
  className,
}: {
  eyebrow: string;
  title: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-8", className)}>
      <p className="mb-1.5 font-mono text-[0.7rem] font-medium uppercase tracking-[0.16em] text-primary/80">
        {eyebrow}
      </p>
      <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground">
        {title}
      </h1>
      <div className="mt-3 ledger-rule" />
    </div>
  );
}
