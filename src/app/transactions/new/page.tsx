import PageHeader from "@/components/page-header";
import TransactionForm from "@/components/transaction-form";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function NewTransactionPage() {
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
  const stocks = await prisma.stock.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <PageHeader eyebrow="Record entry" title="New Transaction" />
      <TransactionForm users={users} stocks={stocks} />
      <p className="mt-4 max-w-xl text-sm text-muted-foreground">
        Trading gold?
        <Link
          href="/transactions/new/gold"
          className="text-primary underline underline-offset-4"
        >
          Use the dedicated Gold form
        </Link>
        for amount/mithqal-price entry.
      </p>
    </div>
  );
}
