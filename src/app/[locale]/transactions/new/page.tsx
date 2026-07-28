import PageHeader from "@/components/page-header";
import TransactionForm from "@/components/transaction-form";
import { getStocksForSelection } from "@/server/services/stock-service";
import { getUsersForTransactionForm } from "@/server/services/user-service";
import { getTranslations } from "next-intl/server";

export default async function NewTransactionPage() {
  const t = await getTranslations("NewTransaction");
  const [users, stocks] = await Promise.all([
    getUsersForTransactionForm(),
    getStocksForSelection(),
  ]);

  return (
    <div>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} />
      <TransactionForm users={users} stocks={stocks} />
    </div>
  );
}
