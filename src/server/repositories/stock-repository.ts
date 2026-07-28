import { prisma } from "@/lib/prisma";
import type { Db } from "./db";

export const stockRepository = {
  /** Plain list, alphabetical -- used by transaction/gold forms' stock picker. */
  findAllStocks(db: Db = prisma) {
    return db.stock.findMany({ orderBy: { name: "asc" } });
  },

  /** Dashboard: every stock with its raw `UserShare` rows, so callers can sum
   * per-stock totals and build the shares-by-user pivot table. */
  findAllStocksWithShares(db: Db = prisma) {
    return db.stock.findMany({
      orderBy: { name: "asc" },
      include: { shares: true },
    });
  },

  /** Stocks page: holder/transaction counts per stock, newest stock first. */
  findAllStocksWithCounts(db: Db = prisma) {
    return db.stock.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { transactionGroups: true, shares: true } } },
    });
  },

  findStockById(stockId: number, db: Db = prisma) {
    return db.stock.findUnique({ where: { id: stockId } });
  },

  createStock(name: string, db: Db = prisma) {
    return db.stock.create({ data: { name } });
  },

  deleteStock(stockId: number, db: Db = prisma) {
    return db.stock.delete({ where: { id: stockId } });
  },
};
