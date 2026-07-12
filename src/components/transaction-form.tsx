"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTransaction } from "@/app/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from "next/link";

interface User {
  id: number;
  name: string;
  initialCapital: number;
}

interface Stock {
  id: number;
  name: string;
}

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

  async function handleSubmit(formData: FormData) {
    const stockId = parseInt(formData.get("stock") as string);
    const count = parseFloat(formData.get("count") as string);
    const unitPrice = parseFloat(formData.get("unitPrice") as string);
    const commission = parseFloat(
      (formData.get("commission") as string) || "0",
    );

    if (selectedUsers.length > 0 && stockId && count > 0 && unitPrice > 0) {
      await createTransaction(
        selectedUsers,
        stockId,
        count,
        type,
        unitPrice,
        commission,
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
                      ({user.initialCapital.toLocaleString()})
                    </span>
                  </Label>
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  No users.
                  <Link href="/users" className="text-primary underline underline-offset-4">
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
            <select
              id="stock"
              name="stock"
              required
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Select a stock</option>
              {stocks.map((stock) => (
                <option key={stock.id} value={stock.id}>
                  {stock.name}
                </option>
              ))}
            </select>
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
              <Input
                id="count"
                name="count"
                type="number"
                required
                min={0}
                step="any"
                placeholder="0"
                className="font-mono tabular-nums"
              />
            </div>
            <div>
              <Label htmlFor="unitPrice" className="mb-1.5">
                Unit Price
              </Label>
              <Input
                id="unitPrice"
                name="unitPrice"
                type="number"
                required
                min={0}
                step="any"
                placeholder="0"
                className="font-mono tabular-nums"
              />
            </div>
            <div>
              <Label htmlFor="commission" className="mb-1.5">
                Commission %
              </Label>
              <Input
                id="commission"
                name="commission"
                type="number"
                min={0}
                step="any"
                placeholder="0"
                defaultValue="0"
                className="font-mono tabular-nums"
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            Submit Transaction
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
