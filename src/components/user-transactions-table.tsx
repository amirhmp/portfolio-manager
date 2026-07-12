"use client";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getRealPrice } from "@/lib/pricing";
import { useMemo, useState } from "react";

export type UserTransactionRow = {
  id: number;
  count: number;
  totalCost: number;
  createdAt: Date | string;
  transactionGroup: {
    type: string;
    unitPrice: number | null;
    commission: number | null;
    stock: { name: string } | null;
  };
};

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "buy", label: "Buy" },
  { value: "sell", label: "Sell" },
  { value: "capital-increased", label: "Capital Increased" },
  { value: "cash-exited", label: "Cash Exited" },
];

const typeBadgeVariant: Record<
  string,
  "default" | "destructive" | "secondary"
> = {
  buy: "default",
  sell: "destructive",
  "capital-increased": "secondary",
  "cash-exited": "secondary",
};

const typeLabel: Record<string, string> = {
  buy: "BUY",
  sell: "SELL",
  "capital-increased": "CAPITAL +",
  "cash-exited": "CASH OUT",
};

export default function UserTransactionsTable({
  transactions,
}: {
  transactions: UserTransactionRow[];
}) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const filtered = useMemo(() => {
    if (selectedTypes.length === 0) return transactions;
    return transactions.filter((tx) =>
      selectedTypes.includes(tx.transactionGroup.type),
    );
  }, [transactions, selectedTypes]);

  function toggleType(value: string, checked: boolean) {
    setSelectedTypes((prev) =>
      checked ? [...prev, value] : prev.filter((t) => t !== value),
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-4 rounded-md border border-border bg-background/40 p-3">
        <span className="font-mono text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
          Filter by type
        </span>
        {TYPE_OPTIONS.map((opt) => (
          <div key={opt.value} className="flex items-center gap-2">
            <Checkbox
              id={`filter-${opt.value}`}
              checked={selectedTypes.includes(opt.value)}
              onCheckedChange={(checked) => toggleType(opt.value, !!checked)}
            />
            <Label
              htmlFor={`filter-${opt.value}`}
              className="text-sm font-normal cursor-pointer"
            >
              {opt.label}
            </Label>
          </div>
        ))}
        {selectedTypes.length > 0 && (
          <button
            type="button"
            onClick={() => setSelectedTypes([])}
            className="ml-auto text-xs text-primary underline underline-offset-4"
          >
            Clear
          </button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Count</TableHead>
            <TableHead className="text-right">Unit Price</TableHead>
            <TableHead className="text-right">Real Price</TableHead>
            <TableHead className="text-right">Total Cost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((tx) => {
            const group = tx.transactionGroup;
            const isTrade = group.type === "buy" || group.type === "sell";
            const realPrice =
              isTrade && group.unitPrice != null
                ? getRealPrice(
                    group.unitPrice,
                    group.commission ?? 0,
                    group.type as "buy" | "sell",
                  )
                : null;

            return (
              <TableRow key={tx.id}>
                <TableCell className="text-muted-foreground">
                  {new Date(tx.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="font-medium">
                  {group.stock?.name ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={typeBadgeVariant[group.type] ?? "default"}>
                    {typeLabel[group.type] ?? group.type.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {tx.count.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {isTrade ? group.unitPrice?.toLocaleString() : "—"}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {realPrice != null ? realPrice.toLocaleString() : "—"}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums font-medium">
                  {tx.totalCost.toLocaleString()}
                </TableCell>
              </TableRow>
            );
          })}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center py-8 text-muted-foreground"
              >
                {transactions.length === 0
                  ? "No transactions yet."
                  : "No transactions match the selected filters."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
