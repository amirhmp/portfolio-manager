import { prisma } from "@/lib/prisma";
import type { Db } from "./db";

export const userRepository = {
  /** Users list page (`/users`): newest first, share counts only. */
  findAllUsersOrderedByCreation(db: Db = prisma) {
    return db.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { shares: true },
    });
  },

  /** Transaction/gold forms: alphabetical, share counts only (per-stock
   * eligibility for the "sell" side is computed client-side from these). */
  findAllUsersOrderedByName(db: Db = prisma) {
    return db.user.findMany({
      orderBy: { name: "asc" },
      include: { shares: true },
    });
  },

  /** Dashboard: every user with their shares AND each share's stock (needed
   * for the shares-by-user pivot table's stock names/ids). */
  findAllUsersWithShareStocks(db: Db = prisma) {
    return db.user.findMany({
      include: { shares: { include: { stock: true } } },
    });
  },

  /** User detail page: one user with their portfolio (shares + stock) and
   * full transaction history (each transaction's group + that group's stock). */
  findUserWithPortfolio(userId: number, db: Db = prisma) {
    return db.user.findUnique({
      where: { id: userId },
      include: {
        shares: { include: { stock: true } },
        transactions: {
          include: { transactionGroup: { include: { stock: true } } },
          orderBy: { transactionGroup: { createdAt: "desc" } },
        },
      },
    });
  },

  /** Used by gold-accounting when validating/splitting a buy or group cash
   * exit across a specific set of participant ids. */
  findUsersByIds(userIds: number[], db: Db = prisma) {
    return db.user.findMany({ where: { id: { in: userIds } } });
  },

  findUserById(userId: number, db: Db = prisma) {
    return db.user.findUnique({ where: { id: userId } });
  },

  createUser(data: { name: string; cash: number }, db: Db = prisma) {
    return db.user.create({ data });
  },

  updateUser(userId: number, data: { name: string }, db: Db = prisma) {
    return db.user.update({ where: { id: userId }, data });
  },

  deleteUser(userId: number, db: Db = prisma) {
    return db.user.delete({ where: { id: userId } });
  },

  /** Signed delta -- pass a negative number to decrement. Prisma's
   * `increment` accepts negative values, so buy/sell/exit/undo all funnel
   * through this one function instead of separate increment/decrement
   * helpers. */
  adjustUserCash(userId: number, delta: number, db: Db = prisma) {
    return db.user.update({
      where: { id: userId },
      data: { cash: { increment: delta } },
    });
  },
};
