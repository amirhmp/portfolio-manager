import GoldTransactionForm from "@/components/gold-transaction-form";
import PageHeader from "@/components/page-header";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";

export default async function NewGoldTransactionPage() {
  const t = await getTranslations("NewGoldTransaction");
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    include: { shares: true },
  });

  return (
    <div>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} />
      <GoldTransactionForm users={users} />
    </div>
  );
}
