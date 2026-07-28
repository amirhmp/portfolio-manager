import { prisma } from "@/lib/prisma";
import type { Db } from "./db";

export interface ParticipantTransactionData {
  userId: number;
  transactionGroupId: number;
  count: number;
  totalCost: number;
}

/** One participant's portion of a `TransactionGroup` (see schema). */
export function createParticipantTransaction(
  data: ParticipantTransactionData,
  db: Db = prisma,
) {
  return db.transaction.create({ data });
}
