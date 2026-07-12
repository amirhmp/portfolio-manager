"use client";
import { deleteStock as deleteStockAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import useSubmitForm from "@/hooks/useSubmitForm";
import { memo } from "react";

function DeleteStockButton({ stockId }: { stockId: number }) {
  const { isPending, request: deleteStock } = useSubmitForm(deleteStockAction);
  const handleDelete = () => {
    deleteStock(stockId);
  };
  return (
    <form action={handleDelete} className="inline">
      <Button variant="ghost" size="sm" type="submit" loading={isPending}>
        Delete
      </Button>
    </form>
  );
}

export default memo(DeleteStockButton);
