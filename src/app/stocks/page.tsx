import PageHeader from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import CreateStockForm from "./_components/create-stock-form";
import DeleteStockButton from "./_components/delete-stock-btn";

export default async function StocksPage() {
  const stocks = await prisma.stock.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { transactionGroups: true, shares: true } } },
  });

  return (
    <div>
      <PageHeader eyebrow="Assets" title="Stocks" />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <CreateStockForm />
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Holders</TableHead>
              <TableHead className="text-right">Transactions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stocks.map((stock) => (
              <TableRow key={stock.id}>
                <TableCell className="font-medium">{stock.name}</TableCell>
                <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                  {stock._count.shares}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                  {stock._count.transactionGroups}
                </TableCell>
                <TableCell className="text-right">
                  <DeleteStockButton stockId={stock.id} />
                </TableCell>
              </TableRow>
            ))}
            {stocks.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-10 text-muted-foreground"
                >
                  No stocks yet. Create one above.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
