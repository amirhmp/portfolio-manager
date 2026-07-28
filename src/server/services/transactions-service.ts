import { transactionGroupRepository } from "@/server/repositories/transaction-group-repository";

export const transactionsService = {
  /** Transactions page (`/transactions`): full history, newest first. */
  getTransactionGroupsOverview() {
    return transactionGroupRepository.findAllWithParticipants();
  },
};
