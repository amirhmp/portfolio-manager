import type {
  PortfolioHolding,
  PortfolioTimelinePoint,
  TimelineEventMeta,
} from "./portfolio-timeline";

/**
 * Valuation for the portfolio-over-time chart.
 *
 * `Stock` has no live price field, so -- exactly like the dashboard's pie
 * chart -- a stock is valued at its LAST TRADED `unitPrice` (the raw price,
 * before commission; for gold this is the price per gram).
 *
 * Unlike the pie chart (which values everything at "now"), each timeline
 * point is valued with the last price that was known AT THAT POINT, so the
 * chart shows what the portfolio was worth then rather than re-pricing its
 * whole history at today's prices. "Known at that point" means every buy/sell
 * by ANYONE up to and including that entry (same entry order as the
 * timeline): on a single user's chart the price must not go stale just
 * because someone else traded the stock.
 *
 * A stock with no trade yet at that point (e.g. starting shares entered on
 * the create-user form, before the first trade of it) has no price: it is
 * valued at 0 and flagged via `price: null` / `hasUnpriced`, matching the
 * pie chart's "valued at 0 and flagged" behaviour.
 */

/** A priced buy/sell, from ANY user -- the source of "last traded price". */
export interface PricedTrade {
  id: number;
  createdAt: Date | string;
  stockId: number | null;
  unitPrice: number | null;
}

export interface ValuedHolding extends PortfolioHolding {
  /** Last traded unit price known at this point; null = stock never traded yet. */
  price: number | null;
  /** count * price (0 when unpriced). */
  value: number;
}

export interface PortfolioChartPoint {
  id: number;
  /**
   * 1-based position in the FULL chronological timeline (1 = oldest entry).
   * Stable when newer entries arrive, so it stays a valid "entry #" label
   * across lazily loaded pages.
   */
  sequence: number;
  event: TimelineEventMeta;
  cash: number;
  holdings: ValuedHolding[];
  /** cash + every holding's value. */
  totalValue: number;
  /** True if any holding here has no known price (valued at 0). */
  hasUnpriced: boolean;
}

function time(value: Date | string): number {
  return new Date(value).getTime();
}

/** Total order of ledger entries: entry time, then id -- same as the timeline. */
function compareEntries(
  a: { time: number; id: number },
  b: { time: number; id: number },
): number {
  return a.time - b.time || a.id - b.id;
}

/**
 * `points` must be the FULL timeline: `sequence` is derived from the index.
 * Slice pages off afterwards with `sliceChartPage`.
 */
export function valuePortfolioTimeline(
  points: PortfolioTimelinePoint[],
  trades: PricedTrade[],
): PortfolioChartPoint[] {
  const sortedTrades = trades
    .filter((t) => t.stockId != null && t.unitPrice != null)
    .map((t) => ({
      id: t.id,
      time: time(t.createdAt),
      stockId: t.stockId as number,
      unitPrice: t.unitPrice as number,
    }))
    .sort(compareEntries);

  // `points` are already chronological; sweep both lists with one pointer.
  const lastPrice = new Map<number, number>();
  let next = 0;

  return points.map((point, index) => {
    const key = { time: time(point.event.createdAt), id: point.event.groupId };
    while (
      next < sortedTrades.length &&
      compareEntries(sortedTrades[next], key) <= 0
    ) {
      lastPrice.set(sortedTrades[next].stockId, sortedTrades[next].unitPrice);
      next++;
    }

    let hasUnpriced = false;
    let totalValue = point.after.cash;
    const holdings: ValuedHolding[] = point.after.holdings.map((holding) => {
      const price = lastPrice.get(holding.stockId) ?? null;
      if (price == null) hasUnpriced = true;
      const value = price != null ? holding.count * price : 0;
      totalValue += value;
      return { ...holding, price, value };
    });

    return {
      id: point.id,
      sequence: index + 1,
      event: point.event,
      cash: point.after.cash,
      holdings,
      totalValue,
      hasUnpriced,
    };
  });
}

/**
 * One page of a chronological timeline, for lazy loading: up to `limit`
 * points immediately OLDER than the point with id `before` (or the newest
 * `limit` when `before` is null), returned chronologically. The cursor is an
 * id rather than an offset, so entries recorded after the first page was
 * loaded can't shift or duplicate later pages. An unknown `before` (e.g. the
 * entry was undone meanwhile) yields an empty, final page.
 */
export function sliceChartPage(
  points: PortfolioChartPoint[],
  before: number | null,
  limit: number,
): { points: PortfolioChartPoint[]; hasMore: boolean } {
  const end =
    before == null ? points.length : points.findIndex((p) => p.id === before);
  if (end < 0) return { points: [], hasMore: false };
  const start = Math.max(0, end - limit);
  return { points: points.slice(start, end), hasMore: start > 0 };
}
