"use server";

import { GOLD_STOCK_ID, MILLION, MITHQAL_FACTOR } from "@/constants";
import { AppError } from "@/lib/errors";
import {
  submitCapitalIncrease,
  submitCashExit,
  submitTransaction,
  type TradeType,
} from "@/lib/gold-accounting";
import { prisma } from "@/lib/prisma";
import { withErrorHandling } from "@/lib/with-action-error-handling";
import { revalidatePath } from "next/cache";

// ─── Users ────────────────────────────────────────────

export const createUser = withErrorHandling(
  async (
    name: string,
    initialCapital: number,
    initialShares: Record<number, number> = {},
  ) => {
    const user = await prisma.user.create({
      data: { name, cash: 0 },
    });

    // The "initial capital" entered on creation is just the user's first
    // capital-increased transaction, not a separate stored field.
    if (initialCapital > 0) {
      await submitCapitalIncrease(user.id, initialCapital);
    }

    // Initial shares are a starting balance, not logged as a trade -- they
    // are optional per-stock counts entered on the create-user form.
    const shareEntries = Object.entries(initialShares).filter(
      ([, count]) => count > 0,
    );
    if (shareEntries.length > 0) {
      await prisma.userShare.createMany({
        data: shareEntries.map(([stockId, count]) => ({
          userId: user.id,
          stockId: Number(stockId),
          count,
        })),
      });
    }

    revalidatePath("/users");
    revalidatePath("/");
  },
);

export const updateUser = withErrorHandling(
  async (id: number, name: string) => {
    await prisma.user.update({
      where: { id },
      data: { name },
    });
    revalidatePath("/users");
    revalidatePath("/");
  },
);

export const deleteUser = withErrorHandling(async (id: number) => {
  await prisma.user.delete({ where: { id } });
  revalidatePath("/users");
  revalidatePath("/");
});

// ─── Stocks ───────────────────────────────────────────

export const createStock = withErrorHandling(async (name: string) => {
  await prisma.stock.create({ data: { name } });
  revalidatePath("/stocks");
});

export const deleteStock = withErrorHandling(async (id: number) => {
  if (id === GOLD_STOCK_ID) throw new AppError("Can not delete 'Gold'");
  await prisma.stock.delete({ where: { id } });
  revalidatePath("/stocks");
});

// ─── Transactions ─────────────────────────────────────

export const createTransaction = withErrorHandling(
  async (
    userIds: number[],
    stockId: number,
    count: number,
    type: TradeType,
    unitPrice: number,
    commission: number = 0,
  ) => {
    await submitTransaction(
      userIds,
      stockId,
      count,
      type,
      unitPrice,
      commission,
    );
    revalidatePath("/transactions");
    revalidatePath("/users");
    revalidatePath("/");
  },
);

/**
 * Gold-specific transaction. The form collects a purchased AMOUNT (money, in
 * Toman) and a unit price (Toman per mithqal). The actual gold count
 * (mithqal) is derived from those two: count = amount / unitPrice.
 * Gold trades carry no commission.
 */

export const createGoldTransaction = withErrorHandling(
  async (
    userIds: number[],
    purchasedAmountInMillions: number,
    type: TradeType,
    mithqalPriceInMillions: number,
  ) => {
    const grams =
      (MITHQAL_FACTOR * purchasedAmountInMillions) / mithqalPriceInMillions;
    const gramPrice = (mithqalPriceInMillions * MILLION) / MITHQAL_FACTOR;
    await submitTransaction(userIds, GOLD_STOCK_ID, grams, type, gramPrice, 0);
    revalidatePath("/transactions");
    revalidatePath("/users");
    revalidatePath("/");
  },
);

export const increaseUserCapital = withErrorHandling(
  async (userId: number, amount: number) => {
    await submitCapitalIncrease(userId, amount);
    revalidatePath(`/users/${userId}`);
    revalidatePath("/users");
    revalidatePath("/");
  },
);

export const exitUserCash = withErrorHandling(
  async (userId: number, amount: number) => {
    await submitCashExit(userId, amount);
    revalidatePath(`/users/${userId}`);
    revalidatePath("/users");
    revalidatePath("/");
  },
);
