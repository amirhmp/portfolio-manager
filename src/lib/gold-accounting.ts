import { getTranslations } from "next-intl/server";
import { AppError } from "./errors";
import { getRealPrice, type TradeType } from "./pricing";
import { prisma } from "./prisma";
import { normalizePrice } from "./utils";

export type { TradeType } from "./pricing";
export { getRealPrice };
export type TransactionType =
  | "buy"
  | "sell"
  | "capital-increased"
  | "cash-exited";

/**
 * Split `total` across `weights` (which should sum to 1) so that the
 * individual parts always add back up EXACTLY to `total`, regardless of
 * floating point rounding. The last participant absorbs the remainder.
 */
function splitByWeight<T>(
  items: T[],
  weightOf: (item: T) => number,
  total: number,
): Array<{ item: T; amount: number }> {
  const result: Array<{ item: T; amount: number }> = [];
  let assigned = 0;
  items.forEach((item, i) => {
    const isLast = i === items.length - 1;
    const amount = isLast ? total - assigned : total * weightOf(item);
    assigned += amount;
    result.push({ item, amount });
  });
  return result;
}

/**
 * Submit a group buy/sell transaction for one or more users.
 * `count` is the TOTAL count for the whole group -- it gets split proportionally
 * among participants:
 *   Buy:  split by each participant's current CASH balance
 *   Sell: split by each participant's current SHARE holdings for that stock
 *
 * All shared data (date, stock, type, unit price, commission, total count) is
 * stored once on a TransactionGroup. Each participant gets their own
 * Transaction row (their portion of count/cost) linked to that group.
 * The sum of every participant's `count` always equals the group's `count`.
 */
export async function submitTransaction(
  userIds: number[],
  stockId: number,
  count: number,
  type: TradeType,
  unitPrice: number,
  commission: number = 0,
  dealDate?: Date,
) {
  const t = await getTranslations("Errors");
  const realPrice = getRealPrice(unitPrice, commission, type);
  const totalCost = realPrice * count;

  return prisma.$transaction(async (tx) => {
    const foundUsers = await tx.user.findMany({
      where: { id: { in: userIds } },
    });
    if (foundUsers.length !== userIds.length)
      throw new AppError(t("usersNotFound"));

    if (type === "buy") {
      // Users with no cash on hand are fully excluded from the calculation --
      // both from the split and from the total-cash denominator.
      const users = foundUsers.filter((u) => u.cash > 0);
      if (users.length === 0) {
        throw new AppError(t("noCashUsers"));
      }

      // Split by each participant's cash balance -- buying power comes from cash on hand.
      const totalCash = users.reduce((sum, u) => sum + u.cash, 0);
      if (totalCash < totalCost) {
        throw new AppError(
          t("insufficientCash", { amount: normalizePrice(totalCash) }),
        );
      }

      const group = await tx.transactionGroup.create({
        data: {
          stockId,
          type,
          count,
          unitPrice,
          commission,
          totalCost,
          dealDate,
        },
      });

      const splitCounts = splitByWeight(
        users,
        (u) => u.cash / totalCash,
        count,
      );
      const splitCosts = splitByWeight(
        users,
        (u) => u.cash / totalCash,
        totalCost,
      );

      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const userCount = splitCounts[i].amount;
        const userCost = splitCosts[i].amount;

        await tx.user.update({
          where: { id: user.id },
          data: { cash: { decrement: userCost } },
        });

        await tx.userShare.upsert({
          where: { userId_stockId: { userId: user.id, stockId } },
          update: { count: { increment: userCount } },
          create: { userId: user.id, stockId, count: userCount },
        });

        await tx.transaction.create({
          data: {
            userId: user.id,
            transactionGroupId: group.id,
            count: userCount,
            totalCost: userCost,
          },
        });
      }
      return group;
    } else {
      // Sell: split by each participant's current share holdings for this stock.
      // Users with no shares (count <= 0) for this stock are fully excluded
      // from the calculation -- both from the split and from the
      // total-shares denominator.
      const allShares = await tx.userShare.findMany({
        where: { userId: { in: userIds }, stockId },
      });
      const shares = allShares.filter((s) => s.count > 0);
      if (shares.length === 0) {
        throw new AppError(t("noSharesUsers"));
      }

      const totalShares = shares.reduce((sum, s) => sum + s.count, 0);
      if (totalShares <= count) {
        throw new AppError(
          t("insufficientShares", { amount: totalShares }),
        );
      }

      const group = await tx.transactionGroup.create({
        data: {
          stockId,
          type,
          count,
          unitPrice,
          commission,
          totalCost,
          dealDate,
        },
      });

      const splitCounts = splitByWeight(
        shares,
        (s) => s.count / totalShares,
        count,
      );
      const splitCosts = splitByWeight(
        shares,
        (s) => s.count / totalShares,
        totalCost,
      );

      for (let i = 0; i < shares.length; i++) {
        const share = shares[i];
        const userCount = splitCounts[i].amount;
        const userRevenue = splitCosts[i].amount;

        await tx.user.update({
          where: { id: share.userId },
          data: { cash: { increment: userRevenue } },
        });

        await tx.userShare.update({
          where: { id: share.id },
          data: { count: { decrement: userCount } },
        });

        await tx.transaction.create({
          data: {
            userId: share.userId,
            transactionGroupId: group.id,
            count: userCount,
            totalCost: userRevenue,
          },
        });
      }
      return group;
    }
  });
}

/**
 * Increase a single user's capital. This directly increases their cash and is
 * logged as a "capital-increased" transaction (wrapped in its own
 * single-participant TransactionGroup for a consistent data model).
 */
export async function submitCapitalIncrease(userId: number, amount: number) {
  const t = await getTranslations("Errors");
  if (amount <= 0) throw new AppError(t("amountMustBePositive"));

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(t("userNotFound"));

    const group = await tx.transactionGroup.create({
      data: {
        type: "capital-increased",
        count: amount,
        totalCost: amount,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: { cash: { increment: amount } },
    });

    await tx.transaction.create({
      data: {
        userId,
        transactionGroupId: group.id,
        count: amount,
        totalCost: amount,
      },
    });

    return group;
  });
}

/**
 * Save (withdraw) profit for a user. This decreases part of their cash and is
 * logged as a "cash-exited" transaction.
 */
export async function submitCashExit(userId: number, amount: number) {
  const t = await getTranslations("Errors");
  if (amount <= 0) throw new AppError(t("amountMustBePositive"));

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(t("userNotFound"));
    if (user.cash < amount) throw new AppError(t("insufficientCashExit"));

    const group = await tx.transactionGroup.create({
      data: {
        type: "cash-exited",
        count: amount,
        totalCost: amount,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: { cash: { decrement: amount } },
    });

    await tx.transaction.create({
      data: {
        userId,
        transactionGroupId: group.id,
        count: amount,
        totalCost: amount,
      },
    });

    return group;
  });
}
