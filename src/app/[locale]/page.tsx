import GroupCashExitForm from "@/components/group-cash-exit-form";
import PageHeader from "@/components/page-header";
import PortfolioPieChart from "@/components/portfolio-pie-chart";
import PortfolioTimelineDialog from "@/components/portfolio-timeline-dialog";
import { PriceLabel } from "@/components/price/PriceLabel";
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
import { limitDecimals, normalizePrice } from "@/lib/utils";
import { dashboardService } from "@/server/services/dashboard-service";
import { getTranslations } from "next-intl/server";

export default async function Dashboard() {
  const t = await getTranslations("Dashboard");
  const tPie = await getTranslations("PortfolioPieChart");

  const {
    users,
    totalCash,
    totalCapitalIncreased,
    totalCashExited,
    totalReceivedCapital,
    sharesByStock,
    breakEvenByStockId,
  } = await dashboardService.getDashboardData();

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
              {t("totalCash")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl font-medium tabular-nums text-foreground">
              <PriceLabel value={totalCash} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
              {t("totalReceivedCapital")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl font-medium tabular-nums text-primary">
              <PriceLabel value={totalReceivedCapital} />
            </div>
            <p className="mt-1 font-mono text-[0.65rem] text-muted-foreground">
              <PriceLabel value={totalCapitalIncreased} /> −{" "}
              <PriceLabel value={totalCashExited} />
            </p>
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
        {t("portfolioTimeline")}
      </h2>
      <Card className="mb-8">
        <CardContent className="flex flex-col items-start justify-between gap-3 pt-6 sm:flex-row sm:items-center">
          <p className="text-sm text-muted-foreground">
            {t("portfolioTimelineHint")}
          </p>
          <PortfolioTimelineDialog />
        </CardContent>
      </Card>

      <h2 className="mb-3 font-serif text-lg font-medium text-foreground">
        {t("groupCashExitTitle")}
      </h2>
      <Card className="mb-8">
        <CardContent className="pt-6">
          <GroupCashExitForm
            users={users.map((u) => ({ id: u.id, name: u.name, cash: u.cash }))}
          />
        </CardContent>
      </Card>

      <h2 className="mb-3 font-serif text-lg font-medium text-foreground">
        {t("totalSharesByStock")}
      </h2>
      <Card className="mb-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              {sharesByStock.map((stock) => (
                <TableHead key={stock.id} className="text-right">
                  {stock.name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sharesByStock.length > 0 && (
              <>
                <TableRow className="bg-primary/5 hover:bg-primary/10">
                  <TableCell className="font-semibold text-primary">
                    {t("total")}
                  </TableCell>
                  {sharesByStock.map((stock) => (
                    <TableCell
                      key={stock.id}
                      className="text-right font-mono font-semibold tabular-nums text-primary"
                    >
                      {normalizePrice(limitDecimals(stock.total, 3), 3)}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-muted/40">
                  <TableCell className="text-muted-foreground">
                    {t("breakEvenPrice")}
                  </TableCell>
                  {sharesByStock.map((stock) => (
                    <TableCell
                      key={stock.id}
                      className="text-right font-mono tabular-nums text-muted-foreground"
                    >
                      <PriceLabel
                        value={breakEvenByStockId.get(stock.id) ?? null}
                        placeholder="—"
                      />
                    </TableCell>
                  ))}
                </TableRow>
              </>
            )}
            {sharesByStock.length > 0 &&
              users.map((user) => {
                const userShareByStockId = new Map(
                  user.shares.map((s) => [s.stockId, s.count]),
                );
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/users/${user.id}`}
                        className="text-foreground hover:text-primary transition-colors"
                      >
                        {user.name}
                      </Link>
                    </TableCell>
                    {sharesByStock.map((stock) => {
                      const count = userShareByStockId.get(stock.id) ?? 0;
                      return (
                        <TableCell
                          key={stock.id}
                          className="text-right font-mono tabular-nums text-muted-foreground"
                        >
                          {count > 0 ? count.toLocaleString() : "—"}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            {sharesByStock.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={1}
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
                  <PriceLabel value={user.cash} />
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
