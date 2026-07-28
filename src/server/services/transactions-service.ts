import { findAllWithParticipants } from "@/server/repositories/transaction-group-repository";

/** Transactions page (`/transactions`): full history, newest first. */
export function getTransactionGroupsOverview() {
  return findAllWithParticipants();
}
