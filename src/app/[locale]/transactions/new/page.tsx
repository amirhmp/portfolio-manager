import PageHeader from "@/components/page-header";
import TransactionForm from "@/components/transaction-form";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";

export default async function NewTransactionPage() {
  const t = await getTranslations("NewTransaction");
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    include: { shares: true },
  });
  const stocks = await prisma.stock.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} />
      <TransactionForm users={users} stocks={stocks} />
    </div>
  );
}
