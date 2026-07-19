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
import { GOLD_STOCK_ID } from "@/constants";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import CreateStockForm from "./_components/create-stock-form";
import DeleteStockButton from "./_components/delete-stock-btn";

export default async function StocksPage() {
  const t = await getTranslations("Stocks");
  const stocks = await prisma.stock.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { transactionGroups: true, shares: true } } },
  });

  return (
    <div>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <CreateStockForm />
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead className="text-right">{t("holders")}</TableHead>
              <TableHead className="text-right">{t("transactions")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
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
                  {stock.id !== GOLD_STOCK_ID && (
                    <DeleteStockButton stockId={stock.id} />
                  )}
                </TableCell>
              </TableRow>
            ))}
            {stocks.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-10 text-muted-foreground"
                >
                  {t("noStocksYet")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
