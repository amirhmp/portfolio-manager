import { prisma } from "@/lib/prisma";
import type { Db } from "./db";

export type TransactionGroupType =
  | "buy"
  | "sell"
  | "capital-increased"
  | "cash-exited"
  | "group-cash-exited";

export interface TransactionGroupData {
  stockId?: number | null;
  type: TransactionGroupType;
  count: number;
  unitPrice?: number | null;
  commission?: number | null;
  totalCost: number;
  dealDate?: Date;
}

export const transactionGroupRepository = {
  createTransactionGroup(data: TransactionGroupData, db: Db = prisma) {
    return db.transactionGroup.create({ data });
  },

  /** Transactions page: full history, newest first, with each group's stock
   * and every participant's own user record. */
  findAllWithParticipants(db: Db = prisma) {
    return db.transactionGroup.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        stock: true,
        transactions: { include: { user: true }, orderBy: { id: "asc" } },
      },
    });
  },

  /** Dashboard portfolio pie chart: most recent priced trade per stock, used
   * as a stand-in "current price" since `Stock` has no live price field. */
  findLastPricedTradePerStock(db: Db = prisma) {
    return db.transactionGroup.findMany({
      where: { stockId: { not: null }, unitPrice: { not: null } },
      orderBy: { dealDate: "desc" },
      select: { stockId: true, unitPrice: true },
    });
  },

  /** Every buy/sell group across all stocks, used to replay a system-wide
   * break-even price per stock (see `cost-basis.ts`). A group's own
   * count/totalCost already represent the whole group regardless of
   * participant count, so these don't need to be fanned out per user. */
  findAllBuySellGroups(db: Db = prisma) {
    return db.transactionGroup.findMany({
      where: { stockId: { not: null }, type: { in: ["buy", "sell"] } },
      select: {
        stockId: true,
        type: true,
        count: true,
        totalCost: true,
        dealDate: true,
      },
    });
  },

  /** Sum of `totalCost` across every group of the given type(s) -- used for
   * the system-wide Total Received Capital figure on the dashboard. */
  sumTotalCostByType(types: TransactionGroupType[], db: Db = prisma) {
    return db.transactionGroup.aggregate({
      where: { type: { in: types } },
      _sum: { totalCost: true },
    });
  },

  /** The single most-recently-*created* group (not `dealDate`, which can be
   * backdated) -- what "undo" targets. */
  findMostRecentlyCreatedWithParticipants(db: Db = prisma) {
    return db.transactionGroup.findFirst({
      orderBy: { createdAt: "desc" },
      include: { transactions: true },
    });
  },

  /** Cascades to delete the group's `Transaction` rows too (see schema). */
  deleteTransactionGroup(groupId: number, db: Db = prisma) {
    return db.transactionGroup.delete({ where: { id: groupId } });
  },
};
