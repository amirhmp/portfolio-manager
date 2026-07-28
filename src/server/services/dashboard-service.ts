import { computeBreakEvenPrice, type CostBasisEvent } from "@/lib/cost-basis";
import { findAllStocksWithShares } from "@/server/repositories/stock-repository";
import {
  findAllBuySellGroups,
  findLastPricedTradePerStock,
  sumTotalCostByType,
} from "@/server/repositories/transaction-group-repository";
import { findAllUsersWithShareStocks } from "@/server/repositories/user-repository";

export async function getDashboardData() {
  const [users, stocks, lastPriceGroups, tradeGroups, increasedAgg, exitedAgg] =
    await Promise.all([
      findAllUsersWithShareStocks(),
      findAllStocksWithShares(),
      // Most recent priced trade per stock, used below as a stand-in "current
      // price" -- there's no live market price field in the schema, so a
      // stock's last traded unitPrice is the best available valuation basis.
      findLastPricedTradePerStock(),
      // Every buy/sell group, used below to replay a system-wide weighted
      // average cost basis (break-even price) per stock.
      findAllBuySellGroups(),
      sumTotalCostByType(["capital-increased"]),
      // Both the single-user "cash-exited" and the multi-user
      // "group-cash-exited" reduce received capital the same way.
      sumTotalCostByType(["cash-exited", "group-cash-exited"]),
    ]);

  const totalCash = users.reduce((sum, u) => sum + u.cash, 0);

  const totalCapitalIncreased = increasedAgg._sum.totalCost ?? 0;
  const totalCashExited = exitedAgg._sum.totalCost ?? 0;
  const totalReceivedCapital = totalCapitalIncreased - totalCashExited;

  const lastPriceByStock = new Map<number, number>();
  for (const g of lastPriceGroups) {
    if (
      g.stockId != null &&
      g.unitPrice != null &&
      !lastPriceByStock.has(g.stockId)
    ) {
      lastPriceByStock.set(g.stockId, g.unitPrice);
    }
  }

  const sharesByStock = stocks
    .map((stock) => ({
      id: stock.id,
      name: stock.name,
      total: stock.shares.reduce((sum, s) => sum + s.count, 0),
      lastPrice: lastPriceByStock.get(stock.id) ?? null,
    }))
    .filter((s) => s.total > 0);

  // System-wide break-even price ("قیمت سر به سر") per stock: the
  // weighted-average cost basis of everything the group as a whole still
  // holds, replayed from every buy/sell TransactionGroup for that stock.
  const breakEvenByStockId = new Map<number, number | null>();
  for (const stock of stocks) {
    const events: CostBasisEvent[] = tradeGroups
      .filter((g) => g.stockId === stock.id)
      .map((g) => ({
        type: g.type as "buy" | "sell",
        count: g.count,
        totalCost: g.totalCost,
        dealDate: g.dealDate,
      }));
    breakEvenByStockId.set(stock.id, computeBreakEvenPrice(events));
  }

  return {
    users,
    totalCash,
    totalCapitalIncreased,
    totalCashExited,
    totalReceivedCapital,
    sharesByStock,
    breakEvenByStockId,
  };
}
