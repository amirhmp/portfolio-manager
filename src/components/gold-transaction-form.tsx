"use client";

import { createGoldTransaction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MILLION, MITHQAL_FACTOR } from "@/constants";
import type { User } from "@/generated/prisma/browser";
import { normalizePrice } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function GoldTransactionForm({ users }: { users: User[] }) {
  const router = useRouter();
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [type, setType] = useState<"buy" | "sell">("buy");
  const [purchasedAmount, setAmount] = useState<string>("");
  const [mithqalPrice, setMithqalPrice] = useState<string>("");

  const gramPrice = useMemo(() => {
    const p = parseFloat(mithqalPrice) * MILLION;
    return p / MITHQAL_FACTOR;
  }, [mithqalPrice]);

  const purchasedWeight = useMemo(() => {
    const a = parseFloat(purchasedAmount) * MILLION;
    if (!a || !gramPrice) return null;
    return a / gramPrice;
  }, [purchasedAmount, gramPrice]);

  async function handleSubmit(formData: FormData) {
    const amountInMillions = parseFloat(formData.get("amount") as string);
    const mithqalPriceInMillions = parseFloat(
      formData.get("unitPrice") as string,
    );

    if (
      selectedUsers.length > 0 &&
      amountInMillions > 0 &&
      mithqalPriceInMillions > 0
    ) {
      await createGoldTransaction(
        selectedUsers,
        amountInMillions,
        type,
        mithqalPriceInMillions,
      );
      router.push("/transactions");
    }
  }

  return (
    <Card className="max-w-xl">
      <CardContent className="pt-6">
        <form action={handleSubmit} className="space-y-5">
          <div>
            <Label className="mb-2">Participating Users</Label>
            <div className="space-y-2 rounded-md border border-border bg-background/40 p-3 max-h-48 overflow-y-auto">
              {users.map((user) => (
                <div key={user.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`gold-user-${user.id}`}
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedUsers((prev) => [...prev, user.id]);
                      } else {
                        setSelectedUsers((prev) =>
                          prev.filter((id) => id !== user.id),
                        );
                      }
                    }}
                  />
                  <Label
                    htmlFor={`gold-user-${user.id}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {user.name}
                    <span className="font-mono tabular-nums text-muted-foreground">
                      ({user.cash.toLocaleString()})
                    </span>
                  </Label>
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-muted-foreground text-sm">
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

          <div>
            <Label className="mb-2">Transaction Type</Label>
            <RadioGroup
              value={type}
              onValueChange={(value) => setType(value as "buy" | "sell")}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="buy" id="gold-type-buy" />
                <Label
                  htmlFor="gold-type-buy"
                  className="text-primary font-medium cursor-pointer"
                >
                  Buy
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="sell" id="gold-type-sell" />
                <Label
                  htmlFor="gold-type-sell"
                  className="text-destructive font-medium cursor-pointer"
                >
                  Sell
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="amount" className="mb-1.5">
                Purchased Amount (Million)
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                required
                min={0}
                step="any"
                placeholder="e.g. 50 → 50,000,000"
                value={purchasedAmount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-mono tabular-nums"
              />
              <p className="mt-1 text-[0.65rem] text-muted-foreground">
                {normalizePrice(Number(purchasedAmount) * MILLION, 0)}
              </p>
            </div>
            <div>
              <Label htmlFor="unitPrice" className="mb-1.5">
                Unit Price (Million/Mithqal)
              </Label>
              <Input
                id="unitPrice"
                name="unitPrice"
                type="number"
                required
                min={0}
                step="any"
                placeholder="e.g. 72.8 → 72,800,000"
                value={mithqalPrice}
                onChange={(e) => setMithqalPrice(e.target.value)}
                className="font-mono tabular-nums"
              />
              <p className="mt-1 text-[0.65rem] text-muted-foreground">
                each gram:&nbsp;<span className="text-xs font-semibold">{normalizePrice(gramPrice, 0)}</span>
              </p>
            </div>
          </div>
          {purchasedWeight != null && (
            <p className="text-sm text-muted-foreground">
              ≈&nbsp;
              <span className="font-mono tabular-nums text-foreground">
                {purchasedWeight.toLocaleString(undefined, {
                  maximumFractionDigits: 4,
                })}
              </span>
              &nbsp;grams at this price
            </p>
          )}

          <Button type="submit" className="w-full">
            Submit Gold Transaction
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
