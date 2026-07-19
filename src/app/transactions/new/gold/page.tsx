import GoldTransactionForm from "@/components/gold-transaction-form";
import PageHeader from "@/components/page-header";
import { prisma } from "@/lib/prisma";

export default async function NewGoldTransactionPage() {
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    include: { shares: true },
  });

  return (
    <div>
      <PageHeader eyebrow="Record entry" title="New Gold Transaction" />
      <GoldTransactionForm users={users} />
    </div>
  );
}
