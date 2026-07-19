"use client";
import { createStock as createStockAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useSubmitForm from "@/hooks/useSubmitForm";
import { useTranslations } from "next-intl";
import { memo } from "react";
import { toast } from "sonner";

function CreateStockForm() {
  const t = useTranslations("CreateStockForm");
  const { isPending, request: createStock } = useSubmitForm(createStockAction);

  const handleAdd = (formData: FormData) => {
    const name = formData.get("name") as string;
    if (name) createStock(name);
    else toast.error(t("nameRequired"));
  };

  return (
    <form action={handleAdd} className="flex gap-3 items-end">
      <div className="flex-1">
        <Label htmlFor="name" className="mb-1.5">
          {t("label")}
        </Label>
        <Input
          id="name"
          name="name"
          required
          placeholder={t("placeholder")}
        />
      </div>
      <Button type="submit" loading={isPending}>
        {t("submit")}
      </Button>
    </form>
  );
}

export default memo(CreateStockForm);
