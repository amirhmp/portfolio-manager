"use server";

import { GOLD_STOCK_ID, MILLION, MITHQAL_TO_GRAMS_FACTOR } from "@/constants";
import { limitDecimals } from "@/lib/utils";
import { withErrorHandling } from "@/lib/with-action-error-handling";
import { goldAccountingService, type TradeType } from "@/server/services/gold-accounting";
import { portfolioChartService } from "@/server/services/portfolio-chart-service";
import { stockService } from "@/server/services/stock-service";
import { userService } from "@/server/services/user-service";
import { revalidatePath } from "next/cache";

// ─── Users ────────────────────────────────────────────

export const createUser = withErrorHandling(
  async (
    name: string,
    initialCapital: number,
    initialShares: Record<number, number> = {},
  ) => {
    await userService.createUser(name, initialCapital, initialShares);
    revalidatePath("/users");
    revalidatePath("/");
  },
);

export const updateUser = withErrorHandling(
  async (id: number, name: string) => {
    await userService.updateUser(id, name);
    revalidatePath("/users");
    revalidatePath("/");
  },
);

export const deleteUser = withErrorHandling(async (id: number) => {
  await userService.deleteUser(id);
  revalidatePath("/users");
  revalidatePath("/");
});

// ─── Stocks ───────────────────────────────────────────

export const createStock = withErrorHandling(async (name: string) => {
  await stockService.createStock(name);
  revalidatePath("/stocks");
});

export const deleteStock = withErrorHandling(async (id: number) => {
  await stockService.deleteStock(id);
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
    date?: string,
  ) => {
    await goldAccountingService.submitTransaction(
      userIds,
      stockId,
      count,
      type,
      unitPrice,
      commission,
      date ? new Date(date) : undefined,
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
    date?: string,
  ) => {
    const grams = limitDecimals(
      (purchasedAmountInMillions / mithqalPriceInMillions) *
        MITHQAL_TO_GRAMS_FACTOR,
      6,
    );
    const gramPrice =
      (mithqalPriceInMillions * MILLION) / MITHQAL_TO_GRAMS_FACTOR;
    await goldAccountingService.submitTransaction(
      userIds,
      GOLD_STOCK_ID,
      grams,
      type,
      gramPrice,
      0,
      date ? new Date(date) : undefined,
    );
    revalidatePath("/transactions");
    revalidatePath("/users");
    revalidatePath("/");
  },
);

export const increaseUserCapital = withErrorHandling(
  async (userId: number, amount: number) => {
    await goldAccountingService.submitCapitalIncrease(userId, amount);
    revalidatePath(`/users/${userId}`);
    revalidatePath("/users");
    revalidatePath("/");
  },
);

export const exitUserCash = withErrorHandling(
  async (userId: number, amount: number) => {
    await goldAccountingService.submitCashExit(userId, amount);
    revalidatePath(`/users/${userId}`);
    revalidatePath("/users");
    revalidatePath("/");
  },
);

export const exitGroupCash = withErrorHandling(
  async (userIds: number[], amount: number) => {
    await goldAccountingService.submitGroupCashExit(userIds, amount);
    revalidatePath("/transactions");
    revalidatePath("/users");
    revalidatePath("/");
  },
);

export const undoLastTransaction = withErrorHandling(async () => {
  await goldAccountingService.undoLastTransactionGroup();
  revalidatePath("/transactions");
  revalidatePath("/users");
  revalidatePath("/");
});

// ─── Portfolio chart (read-only; lazy-loaded by the chart dialog) ─────

/**
 * One page of the portfolio-over-time chart. `userId` null = pooled
 * portfolio of everyone; `before` = id of the oldest point already loaded
 * (null = newest page). A read, exposed as an action only because the chart
 * dialog fetches it on demand from the client.
 */
export const getPortfolioChartPage = withErrorHandling(
  async (userId: number | null, before: number | null, limit: number) =>
    userId == null
      ? portfolioChartService.getGlobalPortfolioChartPage(before, limit)
      : portfolioChartService.getUserPortfolioChartPage(userId, before, limit),
);
