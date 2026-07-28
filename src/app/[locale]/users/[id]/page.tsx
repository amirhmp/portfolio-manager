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
import UserTransactionsTable from "@/components/user-transactions-table";
import { getUserDetail } from "@/server/services/user-service";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import ExitUserCashForm from "./exit-user-cash-form";
import IncreaseCapitalForm from "./increase-capital-form";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations("UserDetail");
  const { id } = await params;
  const userId = parseInt(id);

  const detail = await getUserDetail(userId);
  if (!detail) return notFound();

  const { user, capitalIncreased, cashExited, totalReceivedCapital, breakEvenByStockId } =
    detail;

  return (
    <div>
      <div className="mb-8">
        <p className="mb-1.5 font-mono text-[0.7rem] font-medium uppercase tracking-[0.16em] text-primary/80">
          {t("eyebrow")}
        </p>
        <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground">
          {user.name}
        </h1>
        <div className="mt-3 ledger-rule" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
              {t("cash")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl font-medium tabular-nums text-primary">
              <PriceLabel value={user.cash} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
              {t("shares")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl font-medium tabular-nums text-foreground">
              {user.shares.length}{" "}
              <span className="text-lg text-muted-foreground">
                {user.shares.length === 1
                  ? t("stockSingular")
                  : t("stockPlural")}
              </span>
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
            <div className="font-serif text-3xl font-medium tabular-nums text-foreground">
              <PriceLabel value={totalReceivedCapital} />
            </div>
            <p className="mt-1 font-mono text-[0.65rem] text-muted-foreground">
              {t("capitalIncreased")}: <PriceLabel value={capitalIncreased} />
              {" − "}
              {t("cashExited")}: <PriceLabel value={cashExited} />
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              {t("increaseCapital")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <IncreaseCapitalForm userId={user.id} />
            <p className="mt-2 text-[0.65rem] text-muted-foreground">
              {t("increaseCapitalNote")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              {t("saveProfit")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ExitUserCashForm userId={user.id} maxAmount={user.cash} />
            <p className="mt-2 text-[0.65rem] text-muted-foreground">
              {t("saveProfitNote")}
            </p>
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-3 font-serif text-lg font-medium text-foreground">
        {t("portfolio")}
      </h2>
      <Card className="mb-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("stock")}</TableHead>
              <TableHead className="text-right">{t("count")}</TableHead>
              <TableHead className="text-right">
                {t("breakEvenPrice")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {user.shares
              .filter((s) => s.count > 0)
              .map((share) => (
                <TableRow key={share.id}>
                  <TableCell className="font-medium">
                    {share.stock.name}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {share.count.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                    <PriceLabel
                      value={breakEvenByStockId.get(share.stockId) ?? null}
                      placeholder="—"
                    />
                  </TableCell>
                </TableRow>
              ))}
            {user.shares.filter((s) => s.count > 0).length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-8 text-muted-foreground"
                >
                  {t("noSharesHeld")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <h2 className="mb-3 font-serif text-lg font-medium text-foreground">
        {t("transactionHistory")}
      </h2>
      <Card>
        <div className="px-4">
          <UserTransactionsTable transactions={user.transactions} />
        </div>
      </Card>
    </div>
  );
}
