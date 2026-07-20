"use client";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { getRealPrice } from "@/lib/pricing";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

export type TransactionGroupParticipant = {
  id: number;
  userId: number;
  userName: string;
  count: number;
  totalCost: number;
};

export type TransactionGroupRow = {
  id: number;
  type: string;
  count: number;
  unitPrice: number | null;
  commission: number | null;
  totalCost: number;
  dealDate: Date | string;
  stock: { name: string } | null;
  participants: TransactionGroupParticipant[];
};

const typeBadgeVariant: Record<
  string,
  "default" | "destructive" | "secondary"
> = {
  buy: "default",
  sell: "destructive",
  "capital-increased": "secondary",
  "cash-exited": "secondary",
  "group-cash-exited": "secondary",
};

export default function TransactionGroupsTable({
  groups,
}: {
  groups: TransactionGroupRow[];
}) {
  const t = useTranslations("TransactionGroupsTable");
  const locale = useLocale();
  const [selected, setSelected] = useState<TransactionGroupRow | null>(null);
  const isTrade = (type: string) => type === "buy" || type === "sell";

  const typeLabel: Record<string, string> = {
    buy: t("typeBuy"),
    sell: t("typeSell"),
    "capital-increased": t("typeCapitalIncreased"),
    "cash-exited": t("typeCashExited"),
    "group-cash-exited": t("typeGroupCashExited"),
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("date")}</TableHead>
            <TableHead>{t("stock")}</TableHead>
            <TableHead>{t("type")}</TableHead>
            <TableHead className="text-right">{t("participants")}</TableHead>
            <TableHead className="text-right">{t("totalCount")}</TableHead>
            <TableHead className="text-right">{t("unitPrice")}</TableHead>
            <TableHead className="text-right">{t("commission")}</TableHead>
            <TableHead className="text-right">{t("realPrice")}</TableHead>
            <TableHead className="text-right">{t("totalCost")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => {
            const trade = isTrade(group.type);
            const realPrice =
              trade && group.unitPrice != null
                ? getRealPrice(
                    group.unitPrice,
                    group.commission ?? 0,
                    group.type as "buy" | "sell",
                  )
                : null;

            return (
              <TableRow
                key={group.id}
                onClick={() => setSelected(group)}
                className="cursor-pointer"
              >
                <TableCell className="text-muted-foreground">
                  {new Date(group.dealDate).toLocaleDateString(locale)}
                </TableCell>
                <TableCell className="font-medium">
                  {group.stock?.name ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={typeBadgeVariant[group.type] ?? "default"}>
                    {typeLabel[group.type] ?? group.type.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {group.participants.length}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {group.count.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {trade ? group.unitPrice?.toLocaleString() : "—"}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                  {trade ? `${group.commission ?? 0}%` : "—"}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {realPrice != null ? realPrice.toLocaleString() : "—"}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums font-medium">
                  {group.totalCost.toLocaleString()}
                </TableCell>
              </TableRow>
            );
          })}
          {groups.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={9}
                className="text-center py-10 text-muted-foreground"
              >
                {t("noTransactionsYet")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog
        open={selected != null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selected.stock
                    ? `${selected.stock.name} — ${typeLabel[selected.type] ?? selected.type.toUpperCase()}`
                    : typeLabel[selected.type] ?? selected.type.toUpperCase()}
                </DialogTitle>
                <DialogDescription>
                  {new Date(selected.dealDate).toLocaleString(locale)}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3 rounded-md border border-border bg-background/40 p-4 sm:grid-cols-4">
                <div>
                  <p className="font-mono text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                    {t("stock")}
                  </p>
                  <p className="font-serif text-lg font-medium text-foreground">
                    {selected.stock?.name ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                    {t("unitPrice")}
                  </p>
                  <p className="font-mono text-lg font-medium tabular-nums text-foreground">
                    {isTrade(selected.type) && selected.unitPrice != null
                      ? selected.unitPrice.toLocaleString()
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                    {t("commission")}
                  </p>
                  <p className="font-mono text-lg font-medium tabular-nums text-foreground">
                    {isTrade(selected.type) ? `${selected.commission ?? 0}%` : "—"}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                    {t("totalCount")}
                  </p>
                  <p className="font-mono text-lg font-medium tabular-nums text-primary">
                    {selected.count.toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                  {t("participantBreakdown")}
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("user")}</TableHead>
                      <TableHead className="text-right">{t("count")}</TableHead>
                      <TableHead className="text-right">{t("cost")}</TableHead>
                      <TableHead className="text-right">{t("percentOfCount")}</TableHead>
                      <TableHead className="text-right">{t("percentOfCost")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selected.participants.map((p) => {
                      // Percentages are computed here, in the browser, from
                      // the raw count/totalCost figures passed down as props.
                      const countPercent =
                        selected.count !== 0
                          ? (p.count / selected.count) * 100
                          : 0;
                      const costPercent =
                        selected.totalCost !== 0
                          ? (p.totalCost / selected.totalCost) * 100
                          : 0;

                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">
                            <Link
                              href={`/users/${p.userId}`}
                              className="text-foreground hover:text-primary transition-colors"
                            >
                              {p.userName}
                            </Link>
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums">
                            {p.count.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums">
                            {p.totalCost.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                            {countPercent.toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                            %
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                            {costPercent.toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                            %
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
