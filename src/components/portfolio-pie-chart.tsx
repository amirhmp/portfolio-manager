"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";

export type PortfolioSlice = { name: string; value: number };

const PALETTE = [
  "#6366f1", // cash
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

export default function PortfolioPieChart({
  slices,
}: {
  slices: PortfolioSlice[];
}) {
  const t = useTranslations("PortfolioPieChart");
  const nonZero = slices.filter((s) => s.value > 0);
  const total = nonZero.reduce((sum, s) => sum + s.value, 0);

  // Percentages are computed here, in the browser, from the raw values
  // passed down as props.
  const segments = useMemo(() => {
    if (total <= 0) return [];
    let angle = 0;
    return nonZero.map((slice, i) => {
      const fraction = slice.value / total;
      const startAngle = angle;
      const endAngle = angle + fraction * 360;
      angle = endAngle;
      return {
        ...slice,
        percent: fraction * 100,
        color: PALETTE[i % PALETTE.length],
        startAngle,
        endAngle,
      };
    });
  }, [nonZero, total]);

  if (total <= 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("noValue")}
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 sm:flex-row">
      <svg viewBox="0 0 200 200" className="size-48 shrink-0">
        {segments.length === 1 ? (
          <circle cx={100} cy={100} r={90} fill={segments[0].color} />
        ) : (
          segments.map((slice) => (
            <path
              key={slice.name}
              d={arcPath(100, 100, 90, slice.startAngle, slice.endAngle)}
              fill={slice.color}
              stroke="var(--card)"
              strokeWidth={1.5}
            />
          ))
        )}
      </svg>
      <div className="flex flex-1 flex-col gap-2.5">
        {segments.map((slice) => (
          <div key={slice.name} className="flex items-center gap-2.5 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <span className="min-w-0 flex-1 truncate font-medium text-foreground">
              {slice.name}
            </span>
            <span className="font-mono tabular-nums text-muted-foreground">
              {slice.percent.toLocaleString(undefined, {
                maximumFractionDigits: 1,
              })}
              %
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
