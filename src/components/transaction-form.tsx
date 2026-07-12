"use client";

import { createTransaction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Stock, User } from "@/generated/prisma/browser";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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

export default function TransactionForm({
  users,
  stocks,
}: {
  users: User[];
  stocks: Stock[];
}) {
  const router = useRouter();
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [type, setType] = useState<"buy" | "sell">("buy");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    const stockId = parseInt(formData.get("stock") as string);
    const count = parseFloat(formData.get("count") as string);
    const unitPrice = parseFloat(formData.get("unitPrice") as string);
    const commission = parseFloat(
      (formData.get("commission") as string) || "0",
    );

    if (selectedUsers.length > 0 && stockId && count > 0 && unitPrice > 0) {
      startTransition(async () => {
        const result = await createTransaction(
          selectedUsers,
          stockId,
          count,
          type,
          unitPrice,
          commission,
        );
        if (!result.success) {
          toast.error(result.message);
          return;
        }
        router.push("/transactions");
      });
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
                    id={`user-${user.id}`}
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
                    htmlFor={`user-${user.id}`}
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

          <div>
            <Label htmlFor="stock" className="mb-1.5">
              Stock
            </Label>
            <Select id="stock" name="stock" required>
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
            <RadioGroup
              value={type}
              onValueChange={(value) => setType(value as "buy" | "sell")}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="buy" id="type-buy" />
                <Label
                  htmlFor="type-buy"
                  className="text-primary font-medium cursor-pointer"
                >
                  Buy
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="sell" id="type-sell" />
                <Label
                  htmlFor="type-sell"
                  className="text-destructive font-medium cursor-pointer"
                >
                  Sell
                </Label>
              </div>
            </RadioGroup>
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
