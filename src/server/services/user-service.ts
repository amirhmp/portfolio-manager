import { computeBreakEvenPrice, type CostBasisEvent } from "@/lib/cost-basis";
import {
  createUser as createUserRow,
  deleteUser as deleteUserRow,
  findAllUsersOrderedByCreation,
  findAllUsersOrderedByName,
  findUserWithPortfolio,
  updateUser as updateUserRow,
} from "@/server/repositories/user-repository";
import { createManyUserShares } from "@/server/repositories/user-share-repository";
import { submitCapitalIncrease } from "./gold-accounting";

/** Users list page (`/users`). */
export function getUsersForList() {
  return findAllUsersOrderedByCreation();
}

/** Transaction/gold new-transaction forms' user picker. */
export function getUsersForTransactionForm() {
  return findAllUsersOrderedByName();
}

/**
 * Create a user, optionally seeded with initial capital and initial share
 * balances. The "initial capital" entered on creation is just the user's
 * first capital-increased transaction, not a separate stored field; initial
 * shares are a starting balance, not logged as a trade.
 */
export async function createUser(
  name: string,
  initialCapital: number,
  initialShares: Record<number, number> = {},
) {
  const user = await createUserRow({ name, cash: 0 });

  if (initialCapital > 0) {
    await submitCapitalIncrease(user.id, initialCapital);
  }

  const shareEntries = Object.entries(initialShares).filter(
    ([, count]) => count > 0,
  );
  if (shareEntries.length > 0) {
    await createManyUserShares(
      shareEntries.map(([stockId, count]) => ({
        userId: user.id,
        stockId: Number(stockId),
        count,
      })),
    );
  }

  return user;
}

export function updateUser(userId: number, name: string) {
  return updateUserRow(userId, { name });
}

export function deleteUser(userId: number) {
  return deleteUserRow(userId);
}

/**
 * User detail page (`/users/[id]`): the user's portfolio and transaction
 * history, plus the derived figures that used to live inline in the page --
 * Total Received Capital and, per held stock, the break-even price
 * ("قیمت سر به سر": the weighted-average cost basis of what's still held,
 * replayed from this user's own buy/sell Transaction rows).
 */
export async function getUserDetail(userId: number) {
  const user = await findUserWithPortfolio(userId);
  if (!user) return null;

  // Total received capital = everything this user has put in (capital
  // increases) minus everything they've taken out (individual cash exits
  // and their share of any group cash exits).
  const capitalIncreased = user.transactions
    .filter((tx) => tx.transactionGroup.type === "capital-increased")
    .reduce((sum, tx) => sum + tx.totalCost, 0);
  const cashExited = user.transactions
    .filter(
      (tx) =>
        tx.transactionGroup.type === "cash-exited" ||
        tx.transactionGroup.type === "group-cash-exited",
    )
    .reduce((sum, tx) => sum + tx.totalCost, 0);
  const totalReceivedCapital = capitalIncreased - cashExited;

  const breakEvenByStockId = new Map<number, number | null>();
  for (const share of user.shares) {
    const events: CostBasisEvent[] = user.transactions
      .filter(
        (tx) =>
          tx.transactionGroup.stockId === share.stockId &&
          (tx.transactionGroup.type === "buy" ||
            tx.transactionGroup.type === "sell"),
      )
      .map((tx) => ({
        type: tx.transactionGroup.type as "buy" | "sell",
        count: tx.count,
        totalCost: tx.totalCost,
        dealDate: tx.transactionGroup.dealDate,
      }));
    breakEvenByStockId.set(share.stockId, computeBreakEvenPrice(events));
  }

  return {
    user,
    capitalIncreased,
    cashExited,
    totalReceivedCapital,
    breakEvenByStockId,
  };
}
