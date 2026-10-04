"use client";

import { useSettings } from "@/components/settings-provider";
import type { PortfolioChartPoint } from "@/lib/portfolio-valuation";
import { getScaleSuffix } from "@/lib/settings-cookies";
import { normalizePrice } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { useLayoutEffect, useMemo, useRef, type UIEvent } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "./ui/button";
import { PriceLabel } from "./price/PriceLabel";

/**
 * Portfolio over time, one column per ledger entry (entry order, NOT a real
 * time axis: trades cluster, and on a real time axis they'd pile up).
 *
 *  - Top: stacked step-area of cash + each stock's value (last traded price
 *    known at that point). The line on top is the total; a marker on it shows
 *    what happened -- ▲ buy, ▼ sell, ◆ cash in/out.
 *  - Bottom: a 100% bar under each entry showing the portfolio's composition
 *    right after it (how much cash vs. each stock).
 *  - Hover either chart: a tooltip with exact counts, prices and values.
 *  - Lazy loading: `points` is only the newest slice; scrolling back to the
 *    left edge (or the "older entries" button) calls `onLoadMore`, and the
 *    parent prepends the older points. The scroll position is kept steady
 *    across the prepend so the view doesn't jump.
 *
 * Valuation and the timeline itself are computed server-side (see
 * `lib/portfolio-timeline.ts`, `lib/portfolio-valuation.ts`); this component
 * only draws them.
 */

const CASH_COLOR = "var(--chart-4)";
const BUY_COLOR = "var(--chart-2)";
const SELL_COLOR = "var(--chart-3)";
const STOCK_PALETTE = [
  "var(--chart-1)",
  "var(--chart-5)",
  "#8b5cf6",
  "#14b8a6",
  "#ec4899",
  "#f59e0b",
  "#3b82f6",
  "#84cc16",
];

/** Stable per stock (by id) so a stock keeps its color across charts. */
function stockColor(stockId: number): string {
  const n = STOCK_PALETTE.length;
  return STOCK_PALETTE[(((stockId - 1) % n) + n) % n];
}

/** Horizontal room per entry; the chart scrolls sideways beyond the card width. */
const PX_PER_ENTRY = 56;
const Y_AXIS_WIDTH = 64;
const CHART_MARGIN = { top: 12, right: 12, left: 0, bottom: 0 };
const SYNC_ID = "portfolio-timeline";
/** Scrolling closer than this to the left edge loads older entries. */
const LOAD_MORE_THRESHOLD_PX = 160;

const CASH_KEY = "cash";
const stockKey = (stockId: number) => `stock_${stockId}`;

type Row = {
  index: number;
  label: string;
  total: number;
  point: PortfolioChartPoint;
} & { [seriesKey: string]: unknown };

type Series = { key: string; name: string; color: string };

function EventMarker({
  cx,
  cy,
  type,
}: {
  cx?: number;
  cy?: number;
  type: string;
}) {
  if (cx == null || cy == null) return <g />;
  const r = 6;
  const common = { stroke: "var(--card)", strokeWidth: 1.5 };

  if (type === "buy") {
    return (
      <polygon
        points={`${cx},${cy - r} ${cx - r},${cy + r * 0.8} ${cx + r},${cy + r * 0.8}`}
        fill={BUY_COLOR}
        {...common}
      />
    );
  }
  if (type === "sell") {
    return (
      <polygon
        points={`${cx},${cy + r} ${cx - r},${cy - r * 0.8} ${cx + r},${cy - r * 0.8}`}
        fill={SELL_COLOR}
        {...common}
      />
    );
  }
  // capital-increased / cash-exited / group-cash-exited
  return (
    <polygon
      points={`${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`}
      fill="var(--foreground)"
      {...common}
    />
  );
}

type TooltipProps = {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: Row }>;
};

function TimelineTooltip({ active, payload }: TooltipProps) {
  const t = useTranslations("PortfolioTimelineChart");
  const locale = useLocale();
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;

  const { point } = row;
  const { event } = point;
  const isTrade = event.type === "buy" || event.type === "sell";
  const typeLabel: Record<string, string> = {
    buy: t("typeBuy"),
    sell: t("typeSell"),
    "capital-increased": t("typeCapitalIncreased"),
    "cash-exited": t("typeCashExited"),
    "group-cash-exited": t("typeCashExited"),
  };
  const pct = (value: number) =>
    point.totalValue > 0
      ? `${((value / point.totalValue) * 100).toLocaleString(undefined, { maximumFractionDigits: 1 })}%`
      : "—";

  return (
    <div
      dir={locale === "fa" ? "rtl" : "ltr"}
      className="min-w-56 max-w-72 rounded-md border border-border bg-popover p-3 text-xs text-popover-foreground shadow-md"
    >
      <div className="flex items-center gap-2 font-medium">
        <svg width="14" height="14" viewBox="-7 -7 14 14" aria-hidden>
          <EventMarker cx={0} cy={0} type={event.type} />
        </svg>
        <span>
          {typeLabel[event.type] ?? event.type}
          {event.stockName ? ` — ${event.stockName}` : ""}
        </span>
        <span className="ms-auto font-mono text-[0.65rem] text-muted-foreground">
          #{point.sequence}
        </span>
      </div>
      <div className="mt-0.5 text-[0.65rem] text-muted-foreground">
        {new Date(event.dealDate).toLocaleString(locale)}
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 font-mono tabular-nums">
        {isTrade ? (
          <span>
            {event.count.toLocaleString()} ×{" "}
            <PriceLabel value={event.unitPrice} />
          </span>
        ) : (
          <span />
        )}
        <PriceLabel value={event.totalCost} />
      </div>

      <div className="my-2 border-t border-border" />

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: CASH_COLOR }}
          />
          <span className="flex-1">{t("cash")}</span>
          <span className="font-mono tabular-nums">
            <PriceLabel value={point.cash} />
          </span>
          <span className="w-12 text-end font-mono tabular-nums text-muted-foreground">
            {pct(point.cash)}
          </span>
        </div>
        {point.holdings.map((holding) => (
          <div key={holding.stockId} className="flex items-center gap-2">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: stockColor(holding.stockId) }}
            />
            <span className="flex-1">
              {holding.stockName}
              <span className="ms-1 font-mono text-[0.65rem] text-muted-foreground">
                {holding.count.toLocaleString(undefined, {
                  maximumFractionDigits: 3,
                })}
                {holding.price == null ? ` · ${t("noPrice")}` : ""}
              </span>
            </span>
            <span className="font-mono tabular-nums">
              <PriceLabel value={holding.value} />
            </span>
            <span className="w-12 text-end font-mono tabular-nums text-muted-foreground">
              {pct(holding.value)}
            </span>
          </div>
        ))}
      </div>

      <div className="my-2 border-t border-border" />
      <div className="flex items-center justify-between font-medium">
        <span>{t("total")}</span>
        <span className="font-mono tabular-nums text-primary">
          <PriceLabel value={point.totalValue} />
        </span>
      </div>
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="size-2.5 rounded-sm"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

function LegendMarker({ type, label }: { type: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg width="14" height="14" viewBox="-7 -7 14 14" aria-hidden>
        <EventMarker cx={0} cy={0} type={type} />
      </svg>
      {label}
    </span>
  );
}

export default function PortfolioTimelineChart({
  points,
  scope,
  hasMore,
  loadingMore,
  onLoadMore,
}: {
  /** Chronological; older pages are prepended as they load. */
  points: PortfolioChartPoint[];
  /** "all" = pooled portfolio of every user; "user" = one user's own. */
  scope: "all" | "user";
  /** Are there entries older than `points[0]` still to load? */
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}) {
  const t = useTranslations("PortfolioTimelineChart");
  const locale = useLocale();
  const { displayScale } = useSettings();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { rows, series } = useMemo(() => {
    // Every stock that is ever held somewhere on the timeline gets a series.
    const stocks = new Map<number, string>();
    for (const point of points) {
      for (const holding of point.holdings) {
        stocks.set(holding.stockId, holding.stockName);
      }
    }
    const series: Series[] = [
      { key: CASH_KEY, name: t("cash"), color: CASH_COLOR },
      ...[...stocks.entries()]
        .sort(([a], [b]) => a - b)
        .map(([stockId, name]) => ({
          key: stockKey(stockId),
          name,
          color: stockColor(stockId),
        })),
    ];

    const rows: Row[] = points.map((point, index) => {
      const row: Row = {
        index,
        label: new Date(point.event.dealDate).toLocaleDateString(locale, {
          month: "short",
          day: "numeric",
        }),
        total: point.totalValue,
        point,
      };
      row[CASH_KEY] = point.cash;
      for (const s of series) if (s.key !== CASH_KEY) row[s.key] = 0;
      for (const holding of point.holdings) {
        row[stockKey(holding.stockId)] = holding.value;
      }
      return row;
    });

    return { rows, series };
  }, [points, locale, t]);

  // First paint: scroll to the newest entries. When older entries are
  // prepended, push scrollLeft right by the width they added, so whatever
  // the user was looking at stays put instead of jumping.
  const scrollSnapshot = useRef<{ scrollWidth: number; firstId: number } | null>(
    null,
  );
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || points.length === 0) return;
    const prev = scrollSnapshot.current;
    if (!prev) {
      el.scrollLeft = el.scrollWidth;
    } else if (points[0].id !== prev.firstId) {
      el.scrollLeft += el.scrollWidth - prev.scrollWidth;
    }
    scrollSnapshot.current = { scrollWidth: el.scrollWidth, firstId: points[0].id };
  }, [points]);

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    if (
      hasMore &&
      !loadingMore &&
      event.currentTarget.scrollLeft < LOAD_MORE_THRESHOLD_PX
    ) {
      onLoadMore();
    }
  }

  if (points.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noData")}</p>;
  }

  const suffix = getScaleSuffix(displayScale);
  const formatValue = (value: number) =>
    `${normalizePrice(value / displayScale, 1)}${suffix}`;
  const formatPercent = (value: number) => `${Math.round(value * 100)}%`;
  const formatLabel = (index: number) => rows[index]?.label ?? "";

  const minWidth = Y_AXIS_WIDTH + rows.length * PX_PER_ENTRY;
  const tickStyle = { fontSize: 10, fill: "var(--muted-foreground)" };
  const hasUnpriced = points.some((p) => p.hasUnpriced);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {series.map((s) => (
          <LegendSwatch key={s.key} color={s.color} label={s.name} />
        ))}
        <span className="mx-1 hidden h-3 w-px bg-border sm:inline-block" />
        <LegendMarker type="buy" label={t("typeBuy")} />
        <LegendMarker type="sell" label={t("typeSell")} />
        <LegendMarker type="capital-increased" label={t("cashMovement")} />
        {/* Fallback for when the loaded entries don't overflow (nothing to scroll). */}
        {hasMore && (
          <Button
            variant="outline"
            size="sm"
            className="ms-auto"
            disabled={loadingMore}
            onClick={onLoadMore}
          >
            {loadingMore ? t("loadingOlder") : t("loadOlder")}
          </Button>
        )}
      </div>

      {/* Recharts lays out left-to-right only; keep the chart LTR even on RTL pages. */}
      <div
        ref={scrollRef}
        dir="ltr"
        className="overflow-x-auto pb-2"
        onScroll={handleScroll}
      >
        <div style={{ minWidth }}>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart
              data={rows}
              margin={CHART_MARGIN}
              syncId={SYNC_ID}
            >
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeDasharray="3 3"
              />
              <XAxis dataKey="index" hide />
              <YAxis
                width={Y_AXIS_WIDTH}
                tick={tickStyle}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatValue}
              />
              {/* Invisible bar: makes the category axis band-based, so these
                  columns line up exactly with the composition bars below,
                  and gives the tooltip a full-height hover band. */}
              <Bar
                dataKey="total"
                fill="transparent"
                isAnimationActive={false}
                legendType="none"
              />
              {series.map((s) => (
                <Area
                  key={s.key}
                  type="stepAfter"
                  dataKey={s.key}
                  stackId="value"
                  stroke={s.color}
                  fill={s.color}
                  fillOpacity={0.55}
                  strokeWidth={1}
                  isAnimationActive={false}
                  activeDot={false}
                />
              ))}
              <Line
                type="stepAfter"
                dataKey="total"
                stroke="var(--foreground)"
                strokeWidth={1.25}
                isAnimationActive={false}
                activeDot={false}
                dot={(dotProps) => (
                  <EventMarker
                    key={dotProps.index}
                    cx={dotProps.cx}
                    cy={dotProps.cy}
                    type={(dotProps.payload as Row).point.event.type}
                  />
                )}
              />
              <Tooltip
                content={<TimelineTooltip />}
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                isAnimationActive={false}
                wrapperStyle={{ outline: "none", zIndex: 20 }}
              />
            </ComposedChart>
          </ResponsiveContainer>

          <div className="mt-1 ps-16 font-mono text-[0.65rem] uppercase tracking-wide text-muted-foreground">
            {t("compositionTitle")}
          </div>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart
              data={rows}
              margin={CHART_MARGIN}
              stackOffset="expand"
              syncId={SYNC_ID}
            >
              <XAxis
                dataKey="index"
                interval={0}
                tickLine={false}
                tick={tickStyle}
                tickFormatter={formatLabel}
                stroke="var(--border)"
              />
              <YAxis
                width={Y_AXIS_WIDTH}
                ticks={[0, 0.5, 1]}
                tick={tickStyle}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatPercent}
              />
              {series.map((s) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  stackId="composition"
                  fill={s.color}
                  fillOpacity={0.85}
                  maxBarSize={30}
                  isAnimationActive={false}
                />
              ))}
              {/* Hovering this chart drives the tooltip of the one above
                  (syncId); no tooltip body of its own. */}
              <Tooltip
                content={() => null}
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        <p>{scope === "all" ? t("scopeAll") : t("scopeUser")}</p>
        <p>{t("valuationNote")}</p>
        {hasUnpriced && <p>{t("noPriceNote")}</p>}
      </div>
    </div>
  );
}
