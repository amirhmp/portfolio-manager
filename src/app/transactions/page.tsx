import PageHeader from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getRealPrice } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const typeBadgeVariant: Record<
  string,
  "default" | "destructive" | "secondary"
> = {
  buy: "default",
  sell: "destructive",
  "capital-increased": "secondary",
  "cash-exited": "secondary",
};

const typeLabel: Record<string, string> = {
  buy: "BUY",
  sell: "SELL",
  "capital-increased": "CAPITAL +",
  "cash-exited": "CASH OUT",
};

export default async function TransactionsPage() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true, transactionGroup: { include: { stock: true } } },
  });

  return (
    <div>
      <PageHeader eyebrow="Ledger" title="Transaction History" />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Count</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Commission</TableHead>
              <TableHead className="text-right">Real Price</TableHead>
              <TableHead className="text-right">Total Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => {
              const group = tx.transactionGroup;
              const isTrade = group.type === "buy" || group.type === "sell";
              const realPrice =
                isTrade && group.unitPrice != null
                  ? getRealPrice(
                      group.unitPrice,
                      group.commission ?? 0,
                      group.type as "buy" | "sell",
                    )
                  : null;

              return (
                <TableRow key={tx.id}>
                  <TableCell className="text-muted-foreground">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <a
                      href={`/users/${tx.userId}`}
                      className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {tx.user.name}
                    </a>
                  </TableCell>
                  <TableCell>{group.stock?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={typeBadgeVariant[group.type] ?? "default"}>
                      {typeLabel[group.type] ?? group.type.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {tx.count.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {isTrade ? group.unitPrice?.toLocaleString() : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                    {isTrade ? `${group.commission ?? 0}%` : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {realPrice != null ? realPrice.toLocaleString() : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums font-medium">
                    {tx.totalCost.toLocaleString()}
                  </TableCell>
                </TableRow>
              );
            })}
            {transactions.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-10 text-muted-foreground"
                >
                  No transactions yet.
                  <Link
                    href="/transactions/new"
                    className="text-primary underline underline-offset-4"
                  >
                    Create one
                  </Link>
                  .
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
