import { prisma } from "@/lib/prisma";
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

export default async function TransactionsPage() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true, stock: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Transaction History</h1>

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
                <TableCell>
                  {new Date(tx.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <a
                    href={`/users/${tx.userId}`}
                    className="hover:underline text-primary"
                  >
                    {tx.user.name}
                  </a>
                </TableCell>
                <TableCell>{tx.stock.name}</TableCell>
                <TableCell>
                  <Badge variant={tx.type === "buy" ? "default" : "destructive"}>
                    {tx.type.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {tx.count.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {tx.unitPrice.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">{tx.commission}%</TableCell>
                <TableCell className="text-right">
                  {tx.realPrice.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {tx.totalCost.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
            {transactions.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-8 text-muted-foreground"
                >
                  No transactions yet.{" "}
                  <a href="/transactions/new" className="underline">
                    Create one
                  </a>
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
