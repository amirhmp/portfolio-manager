export type TradeType = "buy" | "sell";

/**
 * Calculate the effective unit price after commission.
 * Commission is a percentage (e.g., 0.25 means 0.25%).
 * Buy: price goes up (buyer pays more). Sell: price goes down (seller receives less).
 *
 * This is a pure function with no server dependencies so it can be safely
 * imported from client components too.
 */
export function getRealPrice(
  price: number,
  commission: number,
  type: TradeType,
): number {
  if (type === "buy") {
    return price * (1 + commission / 100);
  }
  return price * (1 - commission / 100);
}
