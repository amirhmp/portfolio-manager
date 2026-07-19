"use client";

import { createTransaction as createTransactionAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Stock, User } from "@/generated/prisma/browser";
import { Link, useRouter } from "@/i18n/navigation";
import useSubmitForm from "@/hooks/useSubmitForm";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PriceInput } from "./price/PriceInput";
import DatePicker from "./ui/date-picker";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import Switch from "./ui/switch";

type UserWithShares = User & { shares: { stockId: number; count: number }[] };

export default function TransactionForm({
  users,
  stocks,
}: {
  users: UserWithShares[];
  stocks: Stock[];
}) {
  const t = useTranslations("TransactionForm");
  const locale = useLocale() as "en" | "fa";
  const router = useRouter();
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [useCurrentDate, setUseCurrentDate] = useState(true);
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
      toast.error(t("typeSelectRequired"));
      return;
    }

    const stockIdValue = parseInt(formData.get("stock") as string);
    const count = parseFloat(formData.get("count") as string);
    const date = formData.get("date")?.toString();
    const unitPrice = parseFloat(formData.get("unitPrice") as string);
    const commission = parseFloat(
      (formData.get("commission") as string) || "0",
    );

    if (
      selectedUsers.length > 0 &&
      stockIdValue &&
      count > 0 &&
      unitPrice > 0
    ) {
      const result = await createTransaction(
        selectedUsers,
        stockIdValue,
        count,
        type,
        unitPrice,
        commission,
        date,
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
              {t("stock")}
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
                    stocks.find((s) => s.id === value)?.name ?? t("selectAStock")
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
                  <span className="text-sm font-medium text-primary">{t("buy")}</span>
                </div>
                <div>
                  <p className="font-mono text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                    {t("totalCash")}
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
                    {t("sell")}
                  </span>
                </div>
                <div>
                  <p className="font-mono text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                    {t("totalShares")}
                    {selectedStock ? ` (${selectedStock.name})` : ""}
                  </p>
                  <p className="font-serif text-2xl font-semibold tabular-nums text-primary">
                    {stockId != null
                      ? totalSharesForStock.toLocaleString()
                      : "—"}
                  </p>
                </div>
              </Label>
            </RadioGroup>
          </div>

          <div>
            <Label className="mb-2">{t("participatingUsers")}</Label>
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
                        {showShares ? t("shares") : t("cash")}:{" "}
                        {metric.toLocaleString()}
                      </span>
                    </div>
                  </Label>
                );
              })}
              {users.length === 0 && (
                <p className="col-span-full text-muted-foreground text-sm">
                  {t("noUsers")}&nbsp;
                  <Link
                    href="/users"
                    className="text-primary underline underline-offset-4"
                  >
                    {t("createOneFirst")}
                  </Link>
                  .
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="count" className="mb-1.5">
                {t("totalCount")}
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
                {t("unitPrice")}
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
                {t("commission")}
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

          <div>
            <Label htmlFor="stock" className="mb-1.5">
              <span>
                <Switch
                  checked={useCurrentDate}
                  size="sm"
                  onCheckedChange={setUseCurrentDate}
                />
              </span>
              <span>{useCurrentDate ? t("useCurrentDate") : t("date")}</span>
            </Label>
            {!useCurrentDate && (
              <DatePicker locale={locale} defaultValue={new Date()} name="date" />
            )}
          </div>

          <Button type="submit" loading={isPending} className="w-full">
            {t("submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
