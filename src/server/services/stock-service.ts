import { GOLD_STOCK_ID } from "@/constants";
import { AppError } from "@/lib/errors";
import { stockRepository } from "@/server/repositories/stock-repository";
import { getTranslations } from "next-intl/server";

export const stockService = {
  /** Transaction/gold new-transaction forms' stock picker; users list page's
   * create-user form (for initial share balances). */
  getStocksForSelection() {
    return stockRepository.findAllStocks();
  },

  /** Stocks page (`/stocks`): holder/transaction counts per stock. */
  getStocksOverview() {
    return stockRepository.findAllStocksWithCounts();
  },

  createStock(name: string) {
    return stockRepository.createStock(name);
  },

  async deleteStock(stockId: number) {
    if (stockId === GOLD_STOCK_ID) {
      const t = await getTranslations("Errors");
      throw new AppError(t("cannotDeleteGold"));
    }
    return stockRepository.deleteStock(stockId);
  },
};
