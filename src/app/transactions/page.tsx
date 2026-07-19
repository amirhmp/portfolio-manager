import PageHeader from "@/components/page-header";
import TransactionGroupsTable, {
  type TransactionGroupRow,
} from "@/components/transaction-groups-table";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function TransactionsPage() {
  const groups = await prisma.transactionGroup.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      stock: true,
      transactions: { include: { user: true }, orderBy: { id: "asc" } },
    },
  });

  const rows: TransactionGroupRow[] = groups.map((group) => ({
    id: group.id,
    type: group.type,
    count: group.count,
    unitPrice: group.unitPrice,
    commission: group.commission,
    totalCost: group.totalCost,
    createdAt: group.createdAt,
    dealDate: group.dealDate,
    stock: group.stock ? { name: group.stock.name } : null,
    participants: group.transactions.map((tx) => ({
      id: tx.id,
      userId: tx.userId,
      userName: tx.user.name,
      count: tx.count,
      totalCost: tx.totalCost,
    })),
  }));

  return (
    <div>
      <PageHeader eyebrow="Ledger" title="Transaction History" />

      {rows.length === 0 ? (
        <Card>
          <div className="text-center py-10 text-muted-foreground">
            No transactions yet.&nbsp;
            <Link
              href="/transactions/new"
              className="text-primary underline underline-offset-4"
            >
              Create one
            </Link>
            .
          </div>
        </Card>
      ) : (
        <Card>
          <TransactionGroupsTable groups={rows} />
        </Card>
      )}
    </div>
  );
}
