"use client";

import { createTransaction as createTransactionAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Stock, User } from "@/generated/prisma/browser";
import useSubmitForm from "@/hooks/useSubmitForm";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PriceInput } from "./price/PriceInput";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type UserWithShares = User & { shares: { stockId: number; count: number }[] };

export default function TransactionForm({
  users,
  stocks,
}: {
  users: UserWithShares[];
  stocks: Stock[];
}) {
  const router = useRouter();
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [type, setType] = useState<"buy" | "sell" | undefined>(undefined);
  const [stockId, setStockId] = useState<number | null>(null);
  const { isPending, request: createTransaction } = useSubmitForm(
    createTransactionAction,
  );

  const selectedStock = stocks.find((s) => s.id === stockId);

  function shareCountFor(user: UserWithShares, forStockId?: number | null) {
    if (!forStockId) return 0;
    return user.shares.find((s) => s.stockId === forStockId)?.count ?? 0;
  }

  function isEligible(user: UserWithShares) {
    if (type === "sell") return shareCountFor(user, stockId) > 0;
    // buy (or type not yet chosen): eligibility is based on cash
    return user.cash > 0;
  }

  function toggleUser(userId: number, checked: boolean) {
    setSelectedUsers((prev) =>
      checked ? [...prev, userId] : prev.filter((id) => id !== userId),
    );
  }

  const totalCash = useMemo(
    () => users.reduce((sum, u) => sum + u.cash, 0),
    [users],
  );

  const totalSharesForStock = useMemo(
    () => users.reduce((sum, u) => sum + shareCountFor(u, stockId), 0),
    [users, stockId],
  );

  async function handleSubmit(formData: FormData) {
    if (!type) {
      toast.error("Please select a transaction type (Buy or Sell)");
      return;
    }

    const stockIdValue = parseInt(formData.get("stock") as string);
    const count = parseFloat(formData.get("count") as string);
    const unitPrice = parseFloat(formData.get("unitPrice") as string);
    const commission = parseFloat(
      (formData.get("commission") as string) || "0",
    );

    if (selectedUsers.length > 0 && stockIdValue && count > 0 && unitPrice > 0) {
      const result = await createTransaction(
        selectedUsers,
        stockIdValue,
        count,
        type,
        unitPrice,
        commission,
      );
      if (result.success) router.push("/transactions");
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardContent className="pt-6">
        <form action={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="stock" className="mb-1.5">
              Stock
            </Label>
            <Select
              id="stock"
              name="stock"
              required
              value={stockId}
              onValueChange={(value) => {
                setStockId(value as number);
                setSelectedUsers([]);
              }}
            >
              <SelectTrigger className="w-45">
                <SelectValue>
                  {(value: number) =>
                    stocks.find((s) => s.id === value)?.name ?? "Select a stock"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {stocks.map((stock) => (
                    <SelectItem key={stock.id} value={stock.id}>
                      {stock.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2">Type</Label>
            {/* The RadioGroup is always given a defined string ("" while
                unset) so it stays controlled from the first render --
                handing it `undefined` causes it to start uncontrolled and
                then flip to controlled on the first click, which throws.
                Each RadioGroupItem is embedded in its own full card, so the
                card itself IS the radio option. */}
            <RadioGroup
              value={type ?? ""}
              onValueChange={(value) => {
                setType(value as "buy" | "sell");
                // Selections may no longer be eligible under the new type.
                setSelectedUsers([]);
              }}
              className="grid grid-cols-1 gap-3 sm:grid-cols-2"
            >
              <Label
                htmlFor="type-buy"
                className={cn(
                  "flex flex-col gap-3 rounded-lg border p-4 transition-colors cursor-pointer items-start",
                  type === "buy"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                    : "border-border bg-background/40 hover:bg-background/70",
                )}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="buy" id="type-buy" />
                  <span className="text-sm font-medium text-primary">Buy</span>
                </div>
                <div>
                  <p className="font-mono text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                    Total Cash
                  </p>
                  <p className="font-serif text-2xl font-semibold tabular-nums text-foreground">
                    {totalCash.toLocaleString()}
                  </p>
                </div>
              </Label>

              <Label
                htmlFor="type-sell"
                className={cn(
                  "flex flex-col items-start gap-3 rounded-lg border p-4 transition-colors cursor-pointer",
                  type === "sell"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                    : "border-border bg-background/40 hover:bg-background/70",
                )}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="sell" id="type-sell" />
                  <span className="text-sm font-medium text-destructive">
                    Sell
                  </span>
                </div>
                <div>
                  <p className="font-mono text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                    Total Shares{selectedStock ? ` (${selectedStock.name})` : ""}
                  </p>
                  <p className="font-serif text-2xl font-semibold tabular-nums text-primary">
                    {stockId != null ? totalSharesForStock.toLocaleString() : "—"}
                  </p>
                </div>
              </Label>
            </RadioGroup>
          </div>

          <div>
            <Label className="mb-2">Participating Users</Label>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {users.map((user) => {
                const eligible = !type || isEligible(user);
                const selected = selectedUsers.includes(user.id);
                const showShares = type === "sell";
                const metric = showShares
                  ? shareCountFor(user, stockId)
                  : user.cash;

                return (
                  <Label
                    key={user.id}
                    htmlFor={`user-${user.id}`}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg border p-3 transition-colors",
                      eligible
                        ? "cursor-pointer"
                        : "cursor-not-allowed opacity-40",
                      selected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                        : "border-border bg-background/40 hover:bg-background/70",
                    )}
                  >
                    <Checkbox
                      id={`user-${user.id}`}
                      disabled={!eligible}
                      checked={selected}
                      onCheckedChange={(checked) =>
                        toggleUser(user.id, !!checked)
                      }
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">
                        {user.name}
                      </span>
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">
                        {showShares ? "shares" : "cash"}: {metric.toLocaleString()}
                      </span>
                    </div>
                  </Label>
                );
              })}
              {users.length === 0 && (
                <p className="col-span-full text-muted-foreground text-sm">
                  No users.&nbsp;
                  <Link
                    href="/users"
                    className="text-primary underline underline-offset-4"
                  >
                    Create one first
                  </Link>
                  .
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="count" className="mb-1.5">
                Total Count
              </Label>
              <PriceInput
                id="count"
                name="count"
                required
                min={0}
                maxFractions={0}
                step="any"
                placeholder="0"
                className="font-mono tabular-nums"
              />
            </div>
            <div>
              <Label htmlFor="unitPrice" className="mb-1.5">
                Unit Price
              </Label>
              <PriceInput
                id="unitPrice"
                name="unitPrice"
                required
                min={0}
                maxFractions={1}
                step="any"
                placeholder="0"
                className="font-mono tabular-nums"
              />
            </div>
            <div>
              <Label htmlFor="commission" className="mb-1.5">
                Commission %
              </Label>
              <PriceInput
                id="commission"
                name="commission"
                maxFractions={3}
                min={0}
                step="any"
                placeholder="0"
                className="font-mono tabular-nums"
              />
            </div>
          </div>

          <Button type="submit" loading={isPending} className="w-full">
            Submit Transaction
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
