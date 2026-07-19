import PageHeader from "@/components/page-header";
import TransactionForm from "@/components/transaction-form";
import { prisma } from "@/lib/prisma";

export default async function NewTransactionPage() {
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    include: { shares: true },
  });
  const stocks = await prisma.stock.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <PageHeader eyebrow="Record entry" title="New Transaction" />
      <TransactionForm users={users} stocks={stocks} />
    </div>
  );
}
