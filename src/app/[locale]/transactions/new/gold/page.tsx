import GoldTransactionForm from "@/components/gold-transaction-form";
import PageHeader from "@/components/page-header";
import { getUsersForTransactionForm } from "@/server/services/user-service";
import { getTranslations } from "next-intl/server";

export default async function NewGoldTransactionPage() {
  const t = await getTranslations("NewGoldTransaction");
  const users = await getUsersForTransactionForm();

  return (
    <div>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} />
      <GoldTransactionForm users={users} />
    </div>
  );
}
