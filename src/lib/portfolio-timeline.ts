/**
 * Portfolio timeline: "what did the portfolio look like right after each
 * ledger event?"
 *
 * Framework-agnostic (no Prisma, no React) so the same math can feed the
 * "portfolio after transaction" dialog today and a portfolio-over-time chart
 * later -- both just consume `PortfolioTimelinePoint[]`.
 *
 * HOW IT WORKS -- replay BACKWARDS from the current state
 * -------------------------------------------------------
 * The current `User.cash` / `UserShare.count` values are the source of truth.
 * Walking the events from newest to oldest and undoing each one's effect
 * yields the state after every event. This is deliberately not a forward
 * replay from zero: starting share balances entered on the create-user form
 * are NOT logged as transactions, so a forward replay would silently miss
 * them, while a backward replay from the live balances includes them for free.
 *
 * EVENT ORDER
 * -----------
 * Events are ordered by entry order (`createdAt`, then `id`) -- the same
 * order the Transactions page lists them in and the same notion of "last"
 * that undo uses. Balances therefore reflect the state right after the entry
 * was recorded, even if its `dealDate` was backdated. (Ordering by `dealDate`
 * instead could show negative cash for a backdated buy, because the buy's
 * split was computed from the cash the user actually had at entry time.)
 */

export interface PortfolioHolding {
  stockId: number;
  stockName: string;
  count: number;
}

/** Cash plus every stock currently held (count > 0), sorted by stock name. */
export interface PortfolioSnapshot {
  cash: number;
  holdings: PortfolioHolding[];
}

/** What happened at a timeline point (for markers/tooltips in the chart). */
export interface TimelineEventMeta {
  /** The TransactionGroup this event belongs to (also the price-lookup key). */
  groupId: number;
  type: string;
  stockId: number | null;
  stockName: string | null;
  /** The event's own count/amount: the whole group's on the pooled timeline, this user's portion on a user timeline. */
  count: number;
  totalCost: number;
  unitPrice: number | null;
  commission: number | null;
  dealDate: Date | string;
  createdAt: Date | string;
}

/** One point on the timeline: the state right AFTER the event with this id. */
export interface PortfolioTimelinePoint {
  /** TransactionGroup id (group timeline) or Transaction id (user timeline). */
  id: number;
  after: PortfolioSnapshot;
  event: TimelineEventMeta;
}

/** Effect of one participant's transaction on their cash and share balance. */
export interface LedgerDelta {
  cash: number;
  stockId: number | null;
  shares: number;
}

// Float-noise tolerances (same idea as `cost-basis.ts` / `splitByWeight`).
const SHARES_EPSILON = 1e-6;
const CASH_EPSILON = 1e-3;

/**
 * The cash/share effect of a participant's `Transaction`, mirroring exactly
 * what `gold-accounting.ts` applies when creating it (and reverses on undo).
 */
export function deltaOfTransaction(tx: {
  type: string;
  stockId: number | null;
  count: number;
  totalCost: number;
}): LedgerDelta {
  switch (tx.type) {
    case "buy":
      return { cash: -tx.totalCost, stockId: tx.stockId, shares: tx.count };
    case "sell":
      return { cash: tx.totalCost, stockId: tx.stockId, shares: -tx.count };
    case "capital-increased":
      return { cash: tx.totalCost, stockId: null, shares: 0 };
    case "cash-exited":
    case "group-cash-exited":
      return { cash: -tx.totalCost, stockId: null, shares: 0 };
    default:
      return { cash: 0, stockId: null, shares: 0 };
  }
}

function toTime(value: Date | string): number {
  return new Date(value).getTime();
}

function toSnapshot(
  cash: number,
  shares: Map<number, number>,
  names: Map<number, string>,
): PortfolioSnapshot {
  const holdings: PortfolioHolding[] = [];
  for (const [stockId, count] of shares) {
    if (count > SHARES_EPSILON) {
      holdings.push({
        stockId,
        stockName: names.get(stockId) ?? String(stockId),
        count,
      });
    }
  }
  holdings.sort((a, b) => a.stockName.localeCompare(b.stockName));
  return { cash: Math.abs(cash) < CASH_EPSILON ? 0 : cash, holdings };
}

/**
 * Core: given the current state and the events in CHRONOLOGICAL order (each
 * event = the deltas of everyone it touched), return the state after each.
 */
function replayBackwards(
  current: { cash: number; shares: Map<number, number> },
  events: Array<{ id: number; deltas: LedgerDelta[]; event: TimelineEventMeta }>,
  names: Map<number, string>,
): PortfolioTimelinePoint[] {
  let cash = current.cash;
  const shares = new Map(current.shares);
  const points: PortfolioTimelinePoint[] = new Array(events.length);

  for (let i = events.length - 1; i >= 0; i--) {
    points[i] = {
      id: events[i].id,
      after: toSnapshot(cash, shares, names),
      event: events[i].event,
    };

    // Step back over this event so the next iteration sees the state before it.
    for (const delta of events[i].deltas) {
      cash -= delta.cash;
      if (delta.stockId != null && delta.shares !== 0) {
        shares.set(delta.stockId, (shares.get(delta.stockId) ?? 0) - delta.shares);
      }
    }
  }
  return points;
}

/** Minimal structural shapes (satisfied by the Prisma query results). */
export interface TimelineGroup {
  id: number;
  createdAt: Date | string;
  type: string;
  stockId: number | null;
  stock: { name: string } | null;
  count: number;
  totalCost: number;
  unitPrice: number | null;
  commission: number | null;
  dealDate: Date | string;
  transactions: Array<{ count: number; totalCost: number }>;
}

export interface TimelineUserState {
  cash: number;
  shares: Array<{ stockId: number; count: number; stock: { name: string } }>;
}

export interface TimelineUserTransaction {
  id: number;
  count: number;
  totalCost: number;
  transactionGroup: {
    id: number;
    createdAt: Date | string;
    type: string;
    stockId: number | null;
    stock: { name: string } | null;
    unitPrice: number | null;
    commission: number | null;
    dealDate: Date | string;
  };
}

/**
 * POOLED portfolio (every user's cash and shares summed) after each
 * TransactionGroup, chronological. `users` must be ALL users, so their
 * current balances add up to the pool's current state.
 */
export function buildGroupPortfolioTimeline(
  groups: TimelineGroup[],
  users: TimelineUserState[],
): PortfolioTimelinePoint[] {
  const names = new Map<number, string>();
  const shares = new Map<number, number>();
  let cash = 0;

  for (const user of users) {
    cash += user.cash;
    for (const share of user.shares) {
      names.set(share.stockId, share.stock.name);
      shares.set(share.stockId, (shares.get(share.stockId) ?? 0) + share.count);
    }
  }
  for (const group of groups) {
    if (group.stockId != null && group.stock) {
      names.set(group.stockId, group.stock.name);
    }
  }

  const events = [...groups]
    .sort((a, b) => toTime(a.createdAt) - toTime(b.createdAt) || a.id - b.id)
    .map((group) => ({
      id: group.id,
      deltas: group.transactions.map((tx) =>
        deltaOfTransaction({
          type: group.type,
          stockId: group.stockId,
          count: tx.count,
          totalCost: tx.totalCost,
        }),
      ),
      event: {
        groupId: group.id,
        type: group.type,
        stockId: group.stockId,
        stockName: group.stock?.name ?? null,
        count: group.count,
        totalCost: group.totalCost,
        unitPrice: group.unitPrice,
        commission: group.commission,
        dealDate: group.dealDate,
        createdAt: group.createdAt,
      },
    }));

  return replayBackwards({ cash, shares }, events, names);
}

/**
 * ONE user's portfolio after each of their own transactions, chronological.
 * Points are keyed by `Transaction.id`.
 */
export function buildUserPortfolioTimeline(
  user: TimelineUserState,
  transactions: TimelineUserTransaction[],
): PortfolioTimelinePoint[] {
  const names = new Map<number, string>();
  const shares = new Map<number, number>();

  for (const share of user.shares) {
    names.set(share.stockId, share.stock.name);
    shares.set(share.stockId, share.count);
  }
  for (const tx of transactions) {
    const group = tx.transactionGroup;
    if (group.stockId != null && group.stock) {
      names.set(group.stockId, group.stock.name);
    }
  }

  const events = [...transactions]
    .sort(
      (a, b) =>
        toTime(a.transactionGroup.createdAt) -
          toTime(b.transactionGroup.createdAt) ||
        a.transactionGroup.id - b.transactionGroup.id ||
        a.id - b.id,
    )
    .map((tx) => ({
      id: tx.id,
      deltas: [
        deltaOfTransaction({
          type: tx.transactionGroup.type,
          stockId: tx.transactionGroup.stockId,
          count: tx.count,
          totalCost: tx.totalCost,
        }),
      ],
      event: {
        groupId: tx.transactionGroup.id,
        type: tx.transactionGroup.type,
        stockId: tx.transactionGroup.stockId,
        stockName: tx.transactionGroup.stock?.name ?? null,
        count: tx.count,
        totalCost: tx.totalCost,
        unitPrice: tx.transactionGroup.unitPrice,
        commission: tx.transactionGroup.commission,
        dealDate: tx.transactionGroup.dealDate,
        createdAt: tx.transactionGroup.createdAt,
      },
    }));

  return replayBackwards({ cash: user.cash, shares }, events, names);
}

/** Timeline points -> `{ [id]: snapshot }`, plain-object so it can cross the server/client boundary. */
export function indexSnapshotsById(
  points: PortfolioTimelinePoint[],
): Record<number, PortfolioSnapshot> {
  const result: Record<number, PortfolioSnapshot> = {};
  for (const point of points) result[point.id] = point.after;
  return result;
}
