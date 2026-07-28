import { prisma } from "@/lib/prisma";
import type { Db } from "./db";

export const userShareRepository = {
  /** Sell-side eligibility: every `UserShare` row for a given stock, limited
   * to a specific set of participant users. */
  findSharesForUsersAndStock(userIds: number[], stockId: number, db: Db = prisma) {
    return db.userShare.findMany({ where: { userId: { in: userIds }, stockId } });
  },

  /**
   * Apply a signed delta to a user's share count for a stock, creating the
   * `UserShare` row if it doesn't exist yet. Used for: a buy (positive
   * delta), and undo's reversal of either a buy (negative) or a sell
   * (positive) -- unlike a live sell, undo doesn't already have the row's
   * id in hand, so it needs the upsert-by-(userId,stockId) form rather than
   * update-by-id.
   */
  adjustUserShareByStock(userId: number, stockId: number, delta: number, db: Db = prisma) {
    return db.userShare.upsert({
      where: { userId_stockId: { userId, stockId } },
      update: { count: { increment: delta } },
      create: { userId, stockId, count: delta },
    });
  },

  /** Apply a signed delta to an already-known `UserShare` row -- used for a
   * live sell, where the eligibility query already found the row's id. */
  adjustUserShareById(shareId: number, delta: number, db: Db = prisma) {
    return db.userShare.update({
      where: { id: shareId },
      data: { count: { increment: delta } },
    });
  },

  /** Starting share balances entered on the create-user form -- not a
   * trade, so it's a plain bulk-insert with no accompanying
   * TransactionGroup. */
  createManyUserShares(
    entries: Array<{ userId: number; stockId: number; count: number }>,
    db: Db = prisma,
  ) {
    return db.userShare.createMany({ data: entries });
  },
};
