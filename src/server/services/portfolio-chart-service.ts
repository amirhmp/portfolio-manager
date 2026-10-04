import { PORTFOLIO_CHART_PAGE_SIZE } from "@/constants";
import {
  buildGroupPortfolioTimeline,
  buildUserPortfolioTimeline,
} from "@/lib/portfolio-timeline";
import {
  sliceChartPage,
  valuePortfolioTimeline,
} from "@/lib/portfolio-valuation";
import { transactionGroupRepository } from "@/server/repositories/transaction-group-repository";
import { userRepository } from "@/server/repositories/user-repository";

const MAX_PAGE_SIZE = 100;

function clampLimit(limit: number | undefined): number {
  const value = Math.floor(limit ?? PORTFOLIO_CHART_PAGE_SIZE);
  return Math.min(Math.max(value, 1), MAX_PAGE_SIZE);
}

/**
 * Read-models for the portfolio-over-time chart, served page by page to the
 * chart dialog (dashboard + user page) -- nothing here runs until someone
 * opens that dialog.
 *
 * Every call rebuilds the full timeline and slices a page off it: the state
 * after each entry is replayed BACKWARDS from the current balances, so the
 * entries newer than a page are needed anyway, and this keeps pages exactly
 * consistent with each other. If history ever grows large enough for that to
 * matter, bound the queries (entries newer than the cursor could be summed
 * in SQL instead of loaded) without changing this interface.
 *
 * `before` is the id of the oldest point the client already has (group id
 * for the pooled chart, Transaction id for a user's chart); null = newest page.
 */
export const portfolioChartService = {
  /** Pooled portfolio (all users combined), one point per TransactionGroup. */
  async getGlobalPortfolioChartPage(before: number | null, limit?: number) {
    const [groups, users, pricedTrades] = await Promise.all([
      transactionGroupRepository.findAllWithParticipants(),
      userRepository.findAllUsersWithShareStocks(),
      transactionGroupRepository.findAllPricedTrades(),
    ]);

    return sliceChartPage(
      valuePortfolioTimeline(
        buildGroupPortfolioTimeline(groups, users),
        pricedTrades,
      ),
      before,
      clampLimit(limit),
    );
  },

  /** One user's own portfolio, one point per their Transaction. */
  async getUserPortfolioChartPage(
    userId: number,
    before: number | null,
    limit?: number,
  ) {
    const [user, pricedTrades] = await Promise.all([
      userRepository.findUserWithPortfolio(userId),
      // ANY user's trades: a stock's last price must not go stale on this
      // user's chart just because someone else traded it.
      transactionGroupRepository.findAllPricedTrades(),
    ]);
    if (!user) return { points: [], hasMore: false };

    return sliceChartPage(
      valuePortfolioTimeline(
        buildUserPortfolioTimeline(user, user.transactions),
        pricedTrades,
      ),
      before,
      clampLimit(limit),
    );
  },
};
