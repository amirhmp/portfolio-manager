import { prisma } from "@/lib/prisma";
import TransactionForm from "@/components/transaction-form";

export default async function NewTransactionPage() {
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
  const stocks = await prisma.stock.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">New Transaction</h1>
      <TransactionForm users={users} stocks={stocks} />
    </div>
  );
}
