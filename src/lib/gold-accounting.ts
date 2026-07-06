import { prisma } from "./prisma";

export type TransactionType = "buy" | "sell";

/**
 * Calculate the effective unit price after commission.
 * Commission is a percentage (e.g., 0.25 means 0.25%).
 * Buy: price goes up (buyer pays more). Sell: price goes down (seller receives less).
 */
export function getRealPrice(
  price: number,
  commission: number,
  type: TransactionType,
): number {
  if (type === "buy") {
    return price * (1 + commission / 100);
  }
  return price * (1 - commission / 100);
}

/**
 * Submit a transaction for one or more users.
 * count is the TOTAL count — it gets split proportionally among participants.
 *   Buy:  split by initialCapital ratio
 *   Sell: split by current share holdings ratio
 */
export async function submitTransaction(
  userIds: number[],
  stockId: number,
  count: number,
  type: TransactionType,
  unitPrice: number,
  commission: number = 0,
) {
  const realPrice = getRealPrice(unitPrice, commission, type);

  await prisma.$transaction(async (tx) => {
    const users = await tx.user.findMany({
      where: { id: { in: userIds } },
    });

    if (users.length === 0) throw new Error("No users found");

    if (type === "buy") {
      const totalCapital = users.reduce((sum, u) => sum + u.initialCapital, 0);

      for (const user of users) {
        const userCount = (user.initialCapital / totalCapital) * count;
        const cost = realPrice * userCount;

        // Decrease cash
        await tx.user.update({
          where: { id: user.id },
          data: { cash: { decrement: cost } },
        });

        // Upsert share (add to existing)
        await tx.userShare.upsert({
          where: {
            userId_stockId: { userId: user.id, stockId },
          },
          update: { count: { increment: userCount } },
          create: { userId: user.id, stockId, count: userCount },
        });

        // Record transaction
        await tx.transaction.create({
          data: {
            userId: user.id,
            stockId,
            type,
            count: userCount,
            unitPrice,
            commission,
            realPrice,
            totalCost: cost,
          },
        });
      }
    } else {
      // Sell: split by current holdings
      const shares = await tx.userShare.findMany({
        where: {
          userId: { in: userIds },
          stockId,
        },
      });

      const totalShares = shares.reduce((sum, s) => sum + s.count, 0);
      if (totalShares === 0) throw new Error("No shares to sell");

      for (const share of shares) {
        const userCount = (share.count / totalShares) * count;
        const revenue = realPrice * userCount;

        // Increase cash
        await tx.user.update({
          where: { id: share.userId },
          data: { cash: { increment: revenue } },
        });

        // Decrease share count
        await tx.userShare.update({
          where: { id: share.id },
          data: { count: { decrement: userCount } },
        });

        // Record transaction
        await tx.transaction.create({
          data: {
            userId: share.userId,
            stockId,
            type,
            count: userCount,
            unitPrice,
            commission,
            realPrice,
            totalCost: revenue,
          },
        });
      }
    }
  });
}
