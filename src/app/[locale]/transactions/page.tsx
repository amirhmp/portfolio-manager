import PageHeader from "@/components/page-header";
import TransactionGroupsTable, {
  type TransactionGroupRow,
} from "@/components/transaction-groups-table";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";

export default async function TransactionsPage() {
  const t = await getTranslations("Transactions");
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
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} />

      {rows.length === 0 ? (
        <Card>
          <div className="text-center py-10 text-muted-foreground">
            {t("noTransactionsYet")}&nbsp;
            <Link
              href="/transactions/new"
              className="text-primary underline underline-offset-4"
            >
              {t("createOne")}
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
