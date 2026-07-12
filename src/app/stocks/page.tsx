import { createStock, deleteStock } from "@/app/actions";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";

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
          <form
            action={async (formData: FormData) => {
              "use server";
              const name = formData.get("name") as string;
              if (name) {
                await createStock(name);
              }
            }}
            className="flex gap-3 items-end"
          >
            <div className="flex-1">
              <Label htmlFor="name" className="mb-1.5">
                Stock Name / Symbol
              </Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="e.g. AAPL, Gold, BTC"
              />
            </div>
            <Button type="submit">Add Stock</Button>
          </form>
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
                  <form
                    action={async () => {
                      "use server";
                      await deleteStock(stock.id);
                    }}
                    className="inline"
                  >
                    <Button variant="ghost" size="sm" type="submit">
                      Delete
                    </Button>
                  </form>
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
