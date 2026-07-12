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
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function TransactionsPage() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true, stock: true },
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
            {transactions.map((tx) => (
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
                <TableCell>{tx.stock.name}</TableCell>
                <TableCell>
                  <Badge
                    variant={tx.type === "buy" ? "default" : "destructive"}
                  >
                    {tx.type.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {tx.count.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {tx.unitPrice.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                  {tx.commission}%
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {tx.realPrice.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums font-medium">
                  {tx.totalCost.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
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
