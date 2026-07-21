"use client";

import { PriceInput } from "@/components/price/PriceInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Stock } from "@/generated/prisma/browser";
import useSubmitForm from "@/hooks/useSubmitForm";
import { useTranslations } from "next-intl";
import { createUser as createUserAction } from "@/app/actions";

const CreateUserForm = ({ stocks }: { stocks: Stock[] }) => {
  const t = useTranslations("CreateUserForm");
  const { isPending, request: createUser } = useSubmitForm(createUserAction);

  const handleCreate = (formData: FormData) => {
    const name = formData.get("name") as string;
    const capital = parseFloat((formData.get("capital") as string) || "0");

    const initialShares: Record<number, number> = {};
    for (const stock of stocks) {
      const raw = formData.get(`share-${stock.id}`) as string | null;
      const count = parseFloat(raw || "0");
      if (!isNaN(count) && count > 0) {
        initialShares[stock.id] = count;
      }
    }

    if (name && !isNaN(capital)) {
      createUser(name, capital, initialShares);
    }
  };

  return (
    <form action={handleCreate} className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-40">
          <Label htmlFor="name" className="mb-1.5">
            {t("name")}
          </Label>
          <Input id="name" name="name" required placeholder={t("namePlaceholder")} />
        </div>
        <div className="w-40">
          <Label htmlFor="capital" className="mb-1.5">
            {t("initialCapital")}
          </Label>
          <PriceInput
            id="capital"
            name="capital"
            min={0}
            step="any"
            placeholder="0"
            scaled
          />
        </div>
        <Button type="submit" loading={isPending}>
          {t("submit")}
        </Button>
      </div>

      {stocks.length > 0 && (
        <div>
          <Label className="mb-1.5">{t("initialShares")}</Label>
          <div className="flex flex-wrap gap-3">
            {stocks.map((stock) => (
              <div key={stock.id} className="w-36">
                <Label
                  htmlFor={`share-${stock.id}`}
                  className="mb-1 text-xs font-normal text-muted-foreground"
                >
                  {stock.name}
                </Label>
                <PriceInput
                  id={`share-${stock.id}`}
                  name={`share-${stock.id}`}
                  min={0}
                  step="any"
                  placeholder="0"
                  className="font-mono tabular-nums"
                  maxFractions={3}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </form>
  );
};

export default CreateUserForm;
