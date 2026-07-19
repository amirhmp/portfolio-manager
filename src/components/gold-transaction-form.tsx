"use client";

import { createGoldTransaction as createGoldTransactionAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GOLD_STOCK_ID, MILLION, MITHQAL_FACTOR } from "@/constants";
import type { User } from "@/generated/prisma/browser";
import useSubmitForm from "@/hooks/useSubmitForm";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PriceInput } from "./price/PriceInput";
import { PriceLabel } from "./price/PriceLabel";

type UserWithShares = User & { shares: { stockId: number; count: number }[] };

export default function GoldTransactionForm({
  users,
}: {
  users: UserWithShares[];
}) {
  const router = useRouter();
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [type, setType] = useState<"buy" | "sell" | undefined>(undefined);
  const [purchasedAmount, setAmount] = useState<number | null>(null);
  const [mithqalPrice, setMithqalPrice] = useState<number | null>(null);
  const { isPending, request: createGoldTransaction } = useSubmitForm(
    createGoldTransactionAction,
  );

  function goldShareFor(user: UserWithShares) {
    return user.shares.find((s) => s.stockId === GOLD_STOCK_ID)?.count ?? 0;
  }

  function isEligible(user: UserWithShares) {
    if (type === "sell") return goldShareFor(user) > 0;
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

  const totalGoldShares = useMemo(
    () => users.reduce((sum, u) => sum + goldShareFor(u), 0),
    [users],
  );

  const gramPrice = useMemo(() => {
    if (!mithqalPrice) return 0;
    const p = mithqalPrice * MILLION;
    return p / MITHQAL_FACTOR;
  }, [mithqalPrice]);

  const purchasedWeight = useMemo(() => {
    if (!purchasedAmount) return null;
    const a = purchasedAmount * MILLION;
    if (!a || !gramPrice) return null;
    return a / gramPrice;
  }, [purchasedAmount, gramPrice]);

  async function handleSubmit(formData: FormData) {
    if (!type) {
      toast.error("Please select a transaction type (Buy or Sell)");
      return;
    }

    const amountInMillions = parseFloat(formData.get("amount") as string);
    const mithqalPriceInMillions = parseFloat(
      formData.get("unitPrice") as string,
    );

    if (selectedUsers.length === 0) {
      toast.error("At least select one user");
      return;
    }

    if (amountInMillions > 0 && mithqalPriceInMillions > 0) {
      const result = await createGoldTransaction(
        selectedUsers,
        amountInMillions,
        type,
        mithqalPriceInMillions,
      );
      if (result.success) router.push("/transactions");
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardContent className="pt-2">
        <form action={handleSubmit} className="space-y-5" autoComplete="off">
          <div>
            {/* Always give the RadioGroup a defined string ("" while
                unset) so it stays controlled from the first render --
                handing it `undefined` starts it uncontrolled and then
                flips it to controlled on the first click, which throws.
                Each RadioGroupItem is embedded in its own full card, so the
                card itself IS the radio option. */}
            <RadioGroup
              value={type ?? ""}
              onValueChange={(value) => {
                setType(value as "buy" | "sell");
                setSelectedUsers([]);
              }}
              className="grid grid-cols-1 gap-3 sm:grid-cols-2"
            >
              <Label
                htmlFor="gold-type-buy"
                className={cn(
                  "flex flex-col gap-3 rounded-lg border p-4 transition-colors cursor-pointer items-start",
                  type === "buy"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                    : "border-border bg-background/40 hover:bg-background/70",
                )}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="buy" id="gold-type-buy" />
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
                htmlFor="gold-type-sell"
                className={cn(
                  "flex flex-col gap-3 rounded-lg border p-4 transition-colors cursor-pointer items-start",
                  type === "sell"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                    : "border-border bg-background/40 hover:bg-background/70",
                )}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="sell" id="gold-type-sell" />
                  <span className="text-sm font-medium text-destructive">
                    Sell
                  </span>
                </div>
                <div>
                  <p className="font-mono text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                    Total Gold
                  </p>
                  <p className="font-serif text-2xl font-semibold tabular-nums text-primary">
                    {totalGoldShares.toLocaleString()}
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
                const metric = showShares ? goldShareFor(user) : user.cash;

                return (
                  <Label
                    key={user.id}
                    htmlFor={`gold-user-${user.id}`}
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
                      id={`gold-user-${user.id}`}
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
                        {showShares ? "gold" : "cash"}:{" "}
                        {metric.toLocaleString()}
                      </span>
                    </div>
                  </Label>
                );
              })}
              {users.length === 0 && (
                <p className="col-span-full text-muted-foreground text-sm">
                  No users.
                  <Link
                    href="/users"
                    className="text-primary underline underline-offset-4"
                  >
                    &nbsp;Create one first
                  </Link>
                  .
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="amount" className="mb-1.5">
                Purchased Amount (Million)
              </Label>
              <PriceInput
                id="amount"
                name="amount"
                required
                min={0}
                step="any"
                placeholder="e.g. 50 → 50,000,000"
                value={purchasedAmount}
                onChange={setAmount}
                className="font-mono tabular-nums"
              />
              {purchasedAmount && (
                <p className="mt-1 text-[0.65rem] text-muted-foreground">
                  <PriceLabel value={Number(purchasedAmount) * MILLION} />
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="unitPrice" className="mb-1.5">
                Unit Price (Million/Mithqal)
              </Label>
              <PriceInput
                id="unitPrice"
                name="unitPrice"
                required
                min={0}
                maxFractions={3}
                step="any"
                placeholder="e.g. 72.8 → 72,800,000"
                value={mithqalPrice}
                onChange={setMithqalPrice}
                className="font-mono tabular-nums"
              />
              <p className="mt-1 text-[0.65rem] text-muted-foreground">
                each gram:&nbsp;
                {gramPrice ? (
                  <PriceLabel
                    className="text-xs font-semibold"
                    value={gramPrice}
                  />
                ) : (
                  "-"
                )}
              </p>
            </div>
          </div>

          <p
            className={cn(
              "text-sm text-muted-foreground",
              !purchasedWeight && "invisible",
            )}
          >
            ≈&nbsp;
            <span className="font-mono tabular-nums text-foreground">
              {purchasedWeight?.toLocaleString(undefined, {
                maximumFractionDigits: 4,
              })}
            </span>
            &nbsp;grams at this price
          </p>

          <Button type="submit" className="w-full" loading={isPending}>
            Submit Gold Transaction
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
