"use client";
import { deleteStock as deleteStockAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import useSubmitForm from "@/hooks/useSubmitForm";
import { useTranslations } from "next-intl";
import { memo } from "react";

function DeleteStockButton({ stockId }: { stockId: number }) {
  const t = useTranslations("DeleteButton");
  const { isPending, request: deleteStock } = useSubmitForm(deleteStockAction);
  const handleDelete = () => {
    deleteStock(stockId);
  };
  return (
    <form action={handleDelete} className="inline">
      <Button variant="ghost" size="sm" type="submit" loading={isPending}>
        {t("delete")}
      </Button>
    </form>
  );
}

export default memo(DeleteStockButton);
