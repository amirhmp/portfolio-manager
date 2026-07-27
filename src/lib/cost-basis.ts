import type { TradeType } from "./pricing";

export interface CostBasisEvent {
  type: TradeType;
  /** Count/shares moved by this event. */
  count: number;
  /** Total cost (buy) or proceeds (sell) for this event. */
  totalCost: number;
  /** Used to replay events in chronological order. */
  dealDate: Date;
}

/**
 * Weighted-average cost per unit for whatever is still held, a.k.a.
 * "قیمت سر به سر" (break-even price) -- the price at which selling the
 * remaining position would exactly recover its cost.
 *
 * Replays every buy/sell in `dealDate` order:
 * - A buy blends its cost into the running average:
 *   `avgCost = (avgCost * heldCount + buy.totalCost) / (heldCount + buy.count)`.
 * - A sell does NOT change the average cost of what's left -- it only
 *   removes count (proportional to the same average), the same way
 *   `submitTransaction` never touches other participants' average cost.
 *
 * Returns `null` when nothing is currently held (including if the
 * position has been fully sold down to ~0), since a break-even price is
 * meaningless with no remaining shares.
 */
export function computeBreakEvenPrice(events: CostBasisEvent[]): number | null {
  const sorted = [...events].sort(
    (a, b) => a.dealDate.getTime() - b.dealDate.getTime(),
  );

  let heldCount = 0;
  let avgCost = 0;

  for (const event of sorted) {
    if (event.type === "buy") {
      const newCount = heldCount + event.count;
      avgCost =
        newCount > 0 ? (avgCost * heldCount + event.totalCost) / newCount : 0;
      heldCount = newCount;
    } else {
      heldCount -= event.count; // only `buy` transactions affects break-even price. selling doesn't affect it.
    }
  }

  // Tolerate float noise around 0 (e.g. selling "everything" can leave a
  // sliver like 1e-10 due to the same rounding `splitByWeight` guards against).
  if (heldCount <= 1e-6) return null;

  return avgCost;
}
