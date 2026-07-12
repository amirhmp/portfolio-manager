"use server";

import { GOLD_STOCK_ID, MILLION, MITHQAL_FACTOR } from "@/constants";
import {
  submitCapitalIncrease,
  submitCashExit,
  submitTransaction,
  type TradeType,
} from "@/lib/gold-accounting";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─── Users ────────────────────────────────────────────

export async function createUser(name: string, initialCapital: number) {
  const user = await prisma.user.create({
    data: { name, cash: 0 },
  });

  // The "initial capital" entered on creation is just the user's first
  // capital-increased transaction, not a separate stored field.
  if (initialCapital > 0) {
    await submitCapitalIncrease(user.id, initialCapital);
  }

  revalidatePath("/users");
  revalidatePath("/");
}

export async function updateUser(id: number, name: string) {
  await prisma.user.update({
    where: { id },
    data: { name },
  });
  revalidatePath("/users");
  revalidatePath("/");
}

export async function deleteUser(id: number) {
  await prisma.user.delete({ where: { id } });
  revalidatePath("/users");
  revalidatePath("/");
}

// ─── Stocks ───────────────────────────────────────────

export async function createStock(name: string) {
  await prisma.stock.create({ data: { name } });
  revalidatePath("/stocks");
}

export async function deleteStock(id: number) {
  if (id === GOLD_STOCK_ID) return;
  await prisma.stock.delete({ where: { id } });
  revalidatePath("/stocks");
}

// ─── Transactions ─────────────────────────────────────

export async function createTransaction(
  userIds: number[],
  stockId: number,
  count: number,
  type: TradeType,
  unitPrice: number,
  commission: number = 0,
) {
  await submitTransaction(userIds, stockId, count, type, unitPrice, commission);
  revalidatePath("/transactions");
  revalidatePath("/users");
  revalidatePath("/");
}

/**
 * Gold-specific transaction. The form collects a purchased AMOUNT (money, in
 * Toman) and a unit price (Toman per mithqal). The actual gold count
 * (mithqal) is derived from those two: count = amount / unitPrice.
 * Gold trades carry no commission.
 */

export async function createGoldTransaction(
  userIds: number[],
  purchasedAmountInMillions: number,
  type: TradeType,
  mithqalPriceInMillions: number,
) {
  const grams =
    (MITHQAL_FACTOR * purchasedAmountInMillions) / mithqalPriceInMillions;
  const gramPrice = (mithqalPriceInMillions * MILLION) / MITHQAL_FACTOR;
  return console.log("debug", { grams, gramPrice });
  await submitTransaction(userIds, GOLD_STOCK_ID, grams, type, gramPrice, 0);
  revalidatePath("/transactions");
  revalidatePath("/users");
  revalidatePath("/");
}

export async function increaseUserCapital(userId: number, amount: number) {
  await submitCapitalIncrease(userId, amount);
  revalidatePath(`/users/${userId}`);
  revalidatePath("/users");
  revalidatePath("/");
}

export async function exitUserCash(userId: number, amount: number) {
  await submitCashExit(userId, amount);
  revalidatePath(`/users/${userId}`);
  revalidatePath("/users");
  revalidatePath("/");
}
