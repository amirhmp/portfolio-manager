import { prisma } from "@/lib/prisma";
import type { Db } from "./db";

/** Plain list, alphabetical -- used by transaction/gold forms' stock picker. */
export function findAllStocks(db: Db = prisma) {
  return db.stock.findMany({ orderBy: { name: "asc" } });
}

/** Dashboard: every stock with its raw `UserShare` rows, so callers can sum
 * per-stock totals and build the shares-by-user pivot table. */
export function findAllStocksWithShares(db: Db = prisma) {
  return db.stock.findMany({
    orderBy: { name: "asc" },
    include: { shares: true },
  });
}

/** Stocks page: holder/transaction counts per stock, newest stock first. */
export function findAllStocksWithCounts(db: Db = prisma) {
  return db.stock.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { transactionGroups: true, shares: true } } },
  });
}

export function findStockById(stockId: number, db: Db = prisma) {
  return db.stock.findUnique({ where: { id: stockId } });
}

export function createStock(name: string, db: Db = prisma) {
  return db.stock.create({ data: { name } });
}

export function deleteStock(stockId: number, db: Db = prisma) {
  return db.stock.delete({ where: { id: stockId } });
}
