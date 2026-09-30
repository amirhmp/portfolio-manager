import { cn } from "@/lib/utils";

/**
 * Read-only circular indicator showing `value` (0-100) as a filled ring,
 * with the rounded percentage printed below it. Purely informational --
 * there is no interactive counterpart, unlike the slider/text-input pair
 * this sits next to.
 */
export function PercentageRing({
  value,
  size = 36,
  strokeWidth = 4,
  className,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const raw = Number.isFinite(value) ? value : 0;
  const clamped = Math.max(0, Math.min(100, raw));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className={cn("flex shrink-0 flex-col items-center gap-0.5", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            "stroke-primary transition-[stroke-dashoffset]",
            raw > 100.0001 && "stroke-destructive",
          )}
        />
      </svg>
      <span className="font-mono text-[0.6rem] tabular-nums text-muted-foreground">
        {Math.round(raw)}%
      </span>
    </div>
  );
}
