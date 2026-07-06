"use server";

import { prisma } from "@/lib/prisma";
import { submitTransaction } from "@/lib/gold-accounting";
import { revalidatePath } from "next/cache";

// ─── Users ────────────────────────────────────────────

export async function createUser(name: string, initialCapital: number) {
  await prisma.user.create({
    data: { name, initialCapital, cash: initialCapital },
  });
  revalidatePath("/users");
  revalidatePath("/");
}

export async function updateUser(
  id: number,
  name: string,
  initialCapital: number,
) {
  await prisma.user.update({
    where: { id },
    data: { name, initialCapital },
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
  await prisma.stock.delete({ where: { id } });
  revalidatePath("/stocks");
}

// ─── Transactions ─────────────────────────────────────

export async function createTransaction(
  userIds: number[],
  stockId: number,
  count: number,
  type: "buy" | "sell",
  unitPrice: number,
  commission: number = 0,
) {
  await submitTransaction(userIds, stockId, count, type, unitPrice, commission);
  revalidatePath("/transactions");
  revalidatePath("/users");
  revalidatePath("/");
}
