"use client";

import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import type { PortfolioSnapshot } from "@/lib/portfolio-timeline";
import { Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { PriceLabel } from "./price/PriceLabel";

export type PortfolioAfterTarget = {
  /** Which history row this is for, e.g. "BUY — Gold · 2026/01/03". */
  description: string;
  /** "all" = pooled portfolio of every user; "user" = a single user's own. */
  scope: "all" | "user";
  snapshot: PortfolioSnapshot;
  /** The stock traded by this row, highlighted in the table (matched by its unique name). */
  highlightStockName?: string | null;
};

/**
 * Cash + holdings table shown for a history row. Exported on its own (not
 * just via the dialog) so a future portfolio-over-time chart can reuse it,
 * e.g. in a point's detail popover.
 */
export function PortfolioSnapshotTable({
  snapshot,
  highlightStockName,
}: {
  snapshot: PortfolioSnapshot;
  highlightStockName?: string | null;
}) {
  const t = useTranslations("PortfolioAfter");

  // If the traded stock was sold down to nothing it isn't in `holdings`
  // anymore -- still show it (as 0) so the effect of the trade is visible.
  const rows: Array<{ key: string; name: string; count: number }> =
    snapshot.holdings.map((h) => ({
      key: String(h.stockId),
      name: h.stockName,
      count: h.count,
    }));
  if (highlightStockName && !rows.some((r) => r.name === highlightStockName)) {
    rows.push({ key: `zero-${highlightStockName}`, name: highlightStockName, count: 0 });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("item")}</TableHead>
          <TableHead className="text-right">{t("amount")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow className="bg-primary/5">
          <TableCell className="font-medium text-primary">{t("cash")}</TableCell>
          <TableCell className="text-right font-mono font-medium tabular-nums text-primary">
            <PriceLabel value={snapshot.cash} />
          </TableCell>
        </TableRow>
        {rows.map((row) => {
          const highlighted = row.name === highlightStockName;
          return (
            <TableRow key={row.key} className={cn(highlighted && "bg-muted/40")}>
              <TableCell className={cn("font-medium", highlighted && "text-primary")}>
                {row.name}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-mono tabular-nums",
                  row.count === 0 && "text-muted-foreground",
                )}
              >
                {row.count.toLocaleString()}
              </TableCell>
            </TableRow>
          );
        })}
        {rows.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={2}
              className="py-6 text-center text-muted-foreground"
            >
              {t("noSharesHeld")}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

/**
 * Render ONE of these at the table level and drive it with a `target` state
 * (like the existing detail dialog), NOT one per row: React synthetic events
 * bubble through portals, so a dialog rendered inside a clickable <TableRow>
 * would trigger that row's onClick on every click inside the dialog.
 */
export default function PortfolioAfterDialog({
  target,
  onClose,
}: {
  target: PortfolioAfterTarget | null;
  onClose: () => void;
}) {
  const t = useTranslations("PortfolioAfter");

  return (
    <Dialog
      open={target != null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        {target && (
          <>
            <DialogHeader>
              <DialogTitle>{t("title")}</DialogTitle>
              <DialogDescription>{target.description}</DialogDescription>
            </DialogHeader>

            <p className="font-mono text-[0.65rem] uppercase tracking-wide text-muted-foreground">
              {target.scope === "all" ? t("scopeAll") : t("scopeUser")}
            </p>

            <PortfolioSnapshotTable
              snapshot={target.snapshot}
              highlightStockName={target.highlightStockName}
            />

            <p className="text-[0.65rem] text-muted-foreground">{t("note")}</p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** The per-row trigger. Stops propagation so clickable rows don't also open their own detail dialog. */
export function PortfolioAfterButton({ onOpen }: { onOpen: () => void }) {
  const t = useTranslations("PortfolioAfter");

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={(event) => {
        event.stopPropagation();
        onOpen();
      }}
    >
      <Wallet data-icon="inline-start" />
      {t("button")}
    </Button>
  );
}
