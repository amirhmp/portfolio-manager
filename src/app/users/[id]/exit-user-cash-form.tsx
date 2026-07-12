"use client";

import { exitUserCash as exitUserCashAction } from "@/app/actions";
import { PriceInput } from "@/components/price/PriceInput";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import useSubmitForm from "@/hooks/useSubmitForm";

function ExitUserCashForm({
  userId,
  maxAmount,
}: {
  userId: number;
  maxAmount: number;
}) {
  const { isPending, request: exitUserCash } =
    useSubmitForm(exitUserCashAction);

  const handle = (formData: FormData) => {
    const amount = parseFloat(formData.get("amount") as string);
    if (amount > 0) {
      exitUserCash(userId, amount);
    }
  };

  return (
    <form action={handle} className="flex gap-3 items-end">
      <div className="flex-1">
        <Label htmlFor="exit-amount" className="mb-1.5">
          Amount
        </Label>
        <PriceInput
          id="exit-amount"
          name="amount"
          required
          min={0}
          max={maxAmount}
          step="any"
          placeholder="0"
          className="font-mono tabular-nums"
        />
      </div>
      <Button type="submit" variant="destructive" loading={isPending}>
        Exit Cash
      </Button>
    </form>
  );
}

export default ExitUserCashForm;
