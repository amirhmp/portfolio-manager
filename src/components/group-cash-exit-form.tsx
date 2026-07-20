"use client";

import { exitGroupCash as exitGroupCashAction } from "@/app/actions";
import { PriceInput } from "@/components/price/PriceInput";
import { PriceLabel } from "@/components/price/PriceLabel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import useSubmitForm from "@/hooks/useSubmitForm";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

export type GroupCashExitUser = { id: number; name: string; cash: number };

export default function GroupCashExitForm({
  users,
}: {
  users: GroupCashExitUser[];
}) {
  const t = useTranslations("GroupCashExitForm");
  const [amount, setAmount] = useState<number | null>(null);
  const { isPending, request: exitGroupCash } = useSubmitForm(
    exitGroupCashAction,
  );

  const eligibleUsers = useMemo(
    () => users.filter((u) => u.cash > 0),
    [users],
  );
  const totalCash = useMemo(
    () => eligibleUsers.reduce((sum, u) => sum + u.cash, 0),
    [eligibleUsers],
  );

  async function handleSubmit(formData: FormData) {
    const value = parseFloat(formData.get("amount") as string);
    if (value > 0 && eligibleUsers.length > 0) {
      await exitGroupCash(
        eligibleUsers.map((u) => u.id),
        value,
      );
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Label htmlFor="group-exit-amount" className="mb-1.5">
            {t("amountLabel")}
          </Label>
          <PriceInput
            id="group-exit-amount"
            name="amount"
            required
            min={0}
            max={totalCash}
            step="any"
            placeholder="0"
            value={amount}
            onChange={setAmount}
            className="font-mono tabular-nums"
          />
        </div>
        <Button
          type="submit"
          variant="destructive"
          loading={isPending}
          disabled={eligibleUsers.length === 0}
        >
          {t("submit")}
        </Button>
      </div>

      <div className="space-y-2 rounded-md border border-border bg-background/40 p-3">
        <div className="flex items-center justify-between font-mono text-[0.65rem] uppercase tracking-wide text-muted-foreground">
          <span>{t("perUserShare")}</span>
          <span>{t("totalCashLabel")}: {totalCash.toLocaleString()}</span>
        </div>
        {users.map((user) => {
          const eligible = user.cash > 0;
          // The share preview is computed here, in the browser, from the
          // raw cash figures -- the same weighting the backend applies.
          const share =
            eligible && amount && totalCash > 0
              ? (user.cash / totalCash) * amount
              : 0;
          return (
            <div
              key={user.id}
              className={cn(
                "flex items-center justify-between text-sm",
                !eligible && "opacity-40",
              )}
            >
              <span className="font-medium">{user.name}</span>
              <span className="flex gap-3 font-mono tabular-nums text-muted-foreground">
                <span>
                  {t("cash")}: {user.cash.toLocaleString()}
                </span>
                <span className="text-foreground">
                  {t("willExit")}: {share.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </span>
            </div>
          );
        })}
        {users.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("noUsers")}</p>
        )}
      </div>

      {amount != null && amount > 0 && (
        <p className="text-xs text-muted-foreground">
          {t("note")} <PriceLabel value={amount} />
        </p>
      )}
    </form>
  );
}
