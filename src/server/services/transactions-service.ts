import {
  buildGroupPortfolioTimeline,
  indexSnapshotsById,
} from "@/lib/portfolio-timeline";
import { transactionGroupRepository } from "@/server/repositories/transaction-group-repository";
import { userRepository } from "@/server/repositories/user-repository";

export const transactionsService = {
  /**
   * Transactions page (`/transactions`): full history, newest first. Each
   * group also carries `portfolioAfter` -- the POOLED portfolio (all users'
   * cash + shares combined) right after that group was recorded, for the
   * "view portfolio after trade" dialog. See `lib/portfolio-timeline.ts`.
   */
  async getTransactionGroupsOverview() {
    const [groups, users] = await Promise.all([
      transactionGroupRepository.findAllWithParticipants(),
      userRepository.findAllUsersWithShareStocks(),
    ]);

    const portfolioAfterByGroupId = indexSnapshotsById(
      buildGroupPortfolioTimeline(groups, users),
    );

    return groups.map((group) => ({
      ...group,
      portfolioAfter: portfolioAfterByGroupId[group.id],
    }));
  },
};
