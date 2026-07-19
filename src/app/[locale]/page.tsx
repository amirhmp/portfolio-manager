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
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";

export default async function Dashboard() {
  const t = await getTranslations("Dashboard");
  const tPie = await getTranslations("PortfolioPieChart");

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
      orderBy: { dealDate: "desc" },
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
    { name: tPie("cash"), value: totalCash },
    ...sharesByStock.map((s) => ({
      name: s.name,
      value: s.total * (s.lastPrice ?? 0),
    })),
  ];

  return (
    <div>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
              {t("totalUsers")}
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
              {t("stocksHeld")}
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
              {t("totalCash")}
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
        {t("portfolioComposition")}
      </h2>
      <Card className="mb-8">
        <CardContent className="pt-6">
          <PortfolioPieChart slices={portfolioSlices} />
          {sharesByStock.some((s) => s.lastPrice == null) && (
            <p className="mt-4 text-xs text-muted-foreground">
              {t("noPriceNote")}
            </p>
          )}
        </CardContent>
      </Card>

      <h2 className="mb-3 font-serif text-lg font-medium text-foreground">
        {t("totalSharesByStock")}
      </h2>
      <Card className="mb-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("stock")}</TableHead>
              <TableHead className="text-right">{t("totalShares")}</TableHead>
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
                  {t("noSharesYet")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <h2 className="mb-3 font-serif text-lg font-medium text-foreground">
        {t("usersTitle")}
      </h2>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead className="text-right">{t("cash")}</TableHead>
              <TableHead className="text-right">{t("shares")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/users/${user.id}`}
                    className="text-foreground hover:text-primary transition-colors"
                  >
                    {user.name}
                  </Link>
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {user.cash.toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {t("shareCount", {
                    count: user.shares.filter((s) => s.count > 0).length,
                  })}
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-10 text-muted-foreground"
                >
                  {t("noUsersYet")}&nbsp;
                  <Link
                    href="/users"
                    className="text-primary underline underline-offset-4"
                  >
                    {t("createOne")}
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
