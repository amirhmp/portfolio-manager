import { AppError } from "@/lib/errors";
import { getRealPrice, type TradeType } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { normalizePrice } from "@/lib/utils";
import {
  adjustUserCash,
  findUserById,
  findUsersByIds,
} from "@/server/repositories/user-repository";
import {
  adjustUserShareById,
  adjustUserShareByStock,
  findSharesForUsersAndStock,
} from "@/server/repositories/user-share-repository";
import {
  createTransactionGroup,
  deleteTransactionGroup,
  findMostRecentlyCreatedWithParticipants,
} from "@/server/repositories/transaction-group-repository";
import { createParticipantTransaction } from "@/server/repositories/transaction-repository";
import { getTranslations } from "next-intl/server";

export type { TradeType } from "@/lib/pricing";
export { getRealPrice };
export type { TransactionGroupType as TransactionType } from "@/server/repositories/transaction-group-repository";

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
    const foundUsers = await findUsersByIds(userIds, tx);
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
          t("insufficientCash", {
            amount: normalizePrice(totalCash),
            extra: normalizePrice(totalCost - totalCash, 10),
          }),
        );
      }

      const group = await createTransactionGroup(
        { stockId, type, count, unitPrice, commission, totalCost, dealDate },
        tx,
      );

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

        await adjustUserCash(user.id, -userCost, tx);
        await adjustUserShareByStock(user.id, stockId, userCount, tx);
        await createParticipantTransaction(
          {
            userId: user.id,
            transactionGroupId: group.id,
            count: userCount,
            totalCost: userCost,
          },
          tx,
        );
      }
      return group;
    } else {
      // Sell: split by each participant's current share holdings for this stock.
      // Users with no shares (count <= 0) for this stock are fully excluded
      // from the calculation -- both from the split and from the
      // total-shares denominator.
      const allShares = await findSharesForUsersAndStock(userIds, stockId, tx);
      const shares = allShares.filter((s) => s.count > 0);
      if (shares.length === 0) {
        throw new AppError(t("noSharesUsers"));
      }

      const totalShares = shares.reduce((sum, s) => sum + s.count, 0);
      if (totalShares <= count) {
        throw new AppError(
          t("insufficientShares", { amount: normalizePrice(totalShares, 3) }),
        );
      }

      const group = await createTransactionGroup(
        { stockId, type, count, unitPrice, commission, totalCost, dealDate },
        tx,
      );

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

        await adjustUserCash(share.userId, userRevenue, tx);
        await adjustUserShareById(share.id, -userCount, tx);
        await createParticipantTransaction(
          {
            userId: share.userId,
            transactionGroupId: group.id,
            count: userCount,
            totalCost: userRevenue,
          },
          tx,
        );
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
    const user = await findUserById(userId, tx);
    if (!user) throw new AppError(t("userNotFound"));

    const group = await createTransactionGroup(
      { type: "capital-increased", count: amount, totalCost: amount },
      tx,
    );

    await adjustUserCash(userId, amount, tx);

    await createParticipantTransaction(
      {
        userId,
        transactionGroupId: group.id,
        count: amount,
        totalCost: amount,
      },
      tx,
    );

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
    const user = await findUserById(userId, tx);
    if (!user) throw new AppError(t("userNotFound"));
    if (user.cash < amount) throw new AppError(t("insufficientCashExit"));

    const group = await createTransactionGroup(
      { type: "cash-exited", count: amount, totalCost: amount },
      tx,
    );

    await adjustUserCash(userId, -amount, tx);

    await createParticipantTransaction(
      {
        userId,
        transactionGroupId: group.id,
        count: amount,
        totalCost: amount,
      },
      tx,
    );

    return group;
  });
}

/**
 * Withdraw cash from the whole pool at once. Unlike `submitCashExit` (one
 * user, no split), this is a group event: `amount` is split across every
 * participating user by their current CASH share -- the exact same
 * weighting `submitTransaction` uses for a "buy" -- so someone holding more
 * of the pool's cash also gives up more of the withdrawal. Users with no
 * cash on hand are excluded from the split, same as a buy.
 */
export async function submitGroupCashExit(userIds: number[], amount: number) {
  const t = await getTranslations("Errors");
  if (amount <= 0) throw new AppError(t("amountMustBePositive"));

  return prisma.$transaction(async (tx) => {
    const foundUsers = await findUsersByIds(userIds, tx);
    if (foundUsers.length !== userIds.length)
      throw new AppError(t("usersNotFound"));

    const users = foundUsers.filter((u) => u.cash > 0);
    if (users.length === 0) {
      throw new AppError(t("noCashUsers"));
    }

    const totalCash = users.reduce((sum, u) => sum + u.cash, 0);
    if (totalCash < amount) {
      throw new AppError(
        t("insufficientCash", { amount: normalizePrice(totalCash) }),
      );
    }

    const group = await createTransactionGroup(
      { type: "group-cash-exited", count: amount, totalCost: amount },
      tx,
    );

    const splitAmounts = splitByWeight(
      users,
      (u) => u.cash / totalCash,
      amount,
    );

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const userAmount = splitAmounts[i].amount;

      await adjustUserCash(user.id, -userAmount, tx);

      await createParticipantTransaction(
        {
          userId: user.id,
          transactionGroupId: group.id,
          count: userAmount,
          totalCost: userAmount,
        },
        tx,
      );
    }

    return group;
  });
}

/**
 * Delete the single most-recently-created TransactionGroup and reverse its
 * effect on every participant's cash/shares -- the exact inverse of
 * whatever `submitTransaction` / `submitCapitalIncrease` / `submitCashExit`
 * / `submitGroupCashExit` did when creating it. "Last" means most recently
 * entered into the system (createdAt), not the group's (possibly
 * backdated) dealDate, since the point is to undo the action you just took.
 * Deleting the group cascades to delete its Transaction rows.
 */
export async function undoLastTransactionGroup() {
  const t = await getTranslations("Errors");

  return prisma.$transaction(async (tx) => {
    const lastGroup = await findMostRecentlyCreatedWithParticipants(tx);
    if (!lastGroup) throw new AppError(t("noTransactionsToUndo"));

    for (const participant of lastGroup.transactions) {
      if (lastGroup.type === "buy") {
        await adjustUserCash(participant.userId, participant.totalCost, tx);
        if (lastGroup.stockId != null) {
          await adjustUserShareByStock(
            participant.userId,
            lastGroup.stockId,
            -participant.count,
            tx,
          );
        }
      } else if (lastGroup.type === "sell") {
        await adjustUserCash(participant.userId, -participant.totalCost, tx);
        if (lastGroup.stockId != null) {
          await adjustUserShareByStock(
            participant.userId,
            lastGroup.stockId,
            participant.count,
            tx,
          );
        }
      } else if (lastGroup.type === "capital-increased") {
        await adjustUserCash(participant.userId, -participant.totalCost, tx);
      } else if (
        lastGroup.type === "cash-exited" ||
        lastGroup.type === "group-cash-exited"
      ) {
        await adjustUserCash(participant.userId, participant.totalCost, tx);
      }
    }

    await deleteTransactionGroup(lastGroup.id, tx);
    return lastGroup;
  });
}
