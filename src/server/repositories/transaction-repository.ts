import { prisma } from "@/lib/prisma";
import type { Db } from "./db";

export interface ParticipantTransactionData {
  userId: number;
  transactionGroupId: number;
  count: number;
  totalCost: number;
}

export const transactionRepository = {
  /** One participant's portion of a `TransactionGroup` (see schema). */
  createParticipantTransaction(data: ParticipantTransactionData, db: Db = prisma) {
    return db.transaction.create({ data });
  },
};
