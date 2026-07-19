import PageHeader from "@/components/page-header";
import PortfolioPieChart from "@/components/portfolio-pie-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default async function Dashboard() {
  const [users, stocks, lastPriceGroups] = await Promise.all([
    prisma.user.findMany({
      include: {
        shares: { include: { stock: true } },
      },
    }),
    prisma.stock.findMany({
      orderBy: { name: "asc" },
      include: { shares: true },
    }),
    // Most recent priced trade per stock, used below as a stand-in "current
    // price" -- there's no live market price field in the schema, so a
    // stock's last traded unitPrice is the best available valuation basis.
    prisma.transactionGroup.findMany({
      where: { stockId: { not: null }, unitPrice: { not: null } },
      orderBy: { createdAt: "desc" },
      select: { stockId: true, unitPrice: true },
    }),
  ]);

  const totalCash = users.reduce((sum, u) => sum + u.cash, 0);

  const lastPriceByStock = new Map<number, number>();
  for (const g of lastPriceGroups) {
    if (
      g.stockId != null &&
      g.unitPrice != null &&
      !lastPriceByStock.has(g.stockId)
    ) {
      lastPriceByStock.set(g.stockId, g.unitPrice);
    }
  }

  const sharesByStock = stocks
    .map((stock) => ({
      id: stock.id,
      name: stock.name,
      total: stock.shares.reduce((sum, s) => sum + s.count, 0),
      lastPrice: lastPriceByStock.get(stock.id) ?? null,
    }))
    .filter((s) => s.total > 0);

  const portfolioSlices = [
    { name: "Cash", value: totalCash },
    ...sharesByStock.map((s) => ({
      name: s.name,
      value: s.total * (s.lastPrice ?? 0),
    })),
  ];

  return (
    <div>
      <PageHeader eyebrow="Overview" title="Dashboard" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl font-medium tabular-nums text-foreground">
              {users.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
              Stocks Held
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl font-medium tabular-nums text-primary">
              {sharesByStock.length.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
              Total Cash
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl font-medium tabular-nums text-foreground">
              {totalCash.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-3 font-serif text-lg font-medium text-foreground">
        Portfolio Composition
      </h2>
      <Card className="mb-8">
        <CardContent className="pt-6">
          <PortfolioPieChart slices={portfolioSlices} />
          {sharesByStock.some((s) => s.lastPrice == null) && (
            <p className="mt-4 text-xs text-muted-foreground">
              {`Stocks with no recorded trade yet have no known price, so they're
              valued at 0 here until their first transaction.`}
            </p>
          )}
        </CardContent>
      </Card>

      <h2 className="mb-3 font-serif text-lg font-medium text-foreground">
        Total Shares by Stock
      </h2>
      <Card className="mb-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Total Shares</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sharesByStock.map((stock) => (
              <TableRow key={stock.id}>
                <TableCell className="font-medium">{stock.name}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {stock.total.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
            {sharesByStock.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="text-center py-8 text-muted-foreground"
                >
                  No shares held yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <h2 className="mb-3 font-serif text-lg font-medium text-foreground">
        Users
      </h2>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Cash</TableHead>
              <TableHead className="text-right">Shares</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <a
                    href={`/users/${user.id}`}
                    className="text-foreground hover:text-primary transition-colors"
                  >
                    {user.name}
                  </a>
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {user.cash.toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {user.shares.filter((s) => s.count > 0).length}
                  {user.shares.filter((s) => s.count > 0).length === 1
                    ? " stock"
                    : " stocks"}
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-10 text-muted-foreground"
                >
                  No users yet.&nbsp;
                  <Link
                    href="/users"
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
