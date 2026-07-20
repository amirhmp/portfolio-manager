import PageHeader from "@/components/page-header";
import TransactionGroupsTable, {
  type TransactionGroupRow,
} from "@/components/transaction-groups-table";
import { Card } from "@/components/ui/card";
import UndoLastTransactionButton from "@/components/undo-last-transaction-button";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";

export default async function TransactionsPage() {
  const t = await getTranslations("Transactions");
  const tType = await getTranslations("TransactionGroupsTable");
  const groups = await prisma.transactionGroup.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      stock: true,
      transactions: { include: { user: true }, orderBy: { id: "asc" } },
    },
  });

  const typeLabel: Record<string, string> = {
    buy: tType("typeBuy"),
    sell: tType("typeSell"),
    "capital-increased": tType("typeCapitalIncreased"),
    "cash-exited": tType("typeCashExited"),
    "group-cash-exited": tType("typeGroupCashExited"),
  };

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

  const lastGroup = groups[0];

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <PageHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          className="mb-0"
        />
        {lastGroup && (
          <UndoLastTransactionButton
            group={{
              type: lastGroup.type,
              typeLabel: typeLabel[lastGroup.type] ?? lastGroup.type,
              stockName: lastGroup.stock?.name ?? null,
              count: lastGroup.count,
              totalCost: lastGroup.totalCost,
              dealDate: lastGroup.dealDate,
            }}
          />
        )}
      </div>

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
