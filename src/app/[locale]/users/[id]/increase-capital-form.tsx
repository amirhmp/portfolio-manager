"use client";

import { increaseUserCapital as increaseUserCapitalAction } from "@/app/actions";
import { PriceInput } from "@/components/price/PriceInput";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import useSubmitForm from "@/hooks/useSubmitForm";
import { useTranslations } from "next-intl";

function IncreaseCapitalForm({ userId }: { userId: number }) {
  const t = useTranslations("IncreaseCapitalForm");
  const { isPending, request: increaseUserCapital } = useSubmitForm(
    increaseUserCapitalAction,
  );

  const handleSubmit = (formData: FormData) => {
    const amount = parseFloat(formData.get("amount") as string);
    if (amount > 0) {
      increaseUserCapital(userId, amount);
    }
  };

  return (
    <form action={handleSubmit} className="flex gap-3 items-end">
      <div className="flex-1">
        <Label htmlFor="increase-amount" className="mb-1.5">
          {t("amount")}
        </Label>
        <PriceInput
          id="increase-amount"
          name="amount"
          required
          min={0}
          step="any"
          placeholder="0"
          scaled
          className="font-mono tabular-nums"
        />
      </div>
      <Button type="submit" loading={isPending}>
        {t("submit")}
      </Button>
    </form>
  );
}

export default IncreaseCapitalForm;
