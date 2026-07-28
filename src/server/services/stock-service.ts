import { GOLD_STOCK_ID } from "@/constants";
import { AppError } from "@/lib/errors";
import {
  createStock as createStockRow,
  deleteStock as deleteStockRow,
  findAllStocks,
  findAllStocksWithCounts,
} from "@/server/repositories/stock-repository";
import { getTranslations } from "next-intl/server";

/** Transaction/gold new-transaction forms' stock picker; users list page's
 * create-user form (for initial share balances). */
export function getStocksForSelection() {
  return findAllStocks();
}

/** Stocks page (`/stocks`): holder/transaction counts per stock. */
export function getStocksOverview() {
  return findAllStocksWithCounts();
}

export function createStock(name: string) {
  return createStockRow(name);
}

export async function deleteStock(stockId: number) {
  if (stockId === GOLD_STOCK_ID) {
    const t = await getTranslations("Errors");
    throw new AppError(t("cannotDeleteGold"));
  }
  return deleteStockRow(stockId);
}
