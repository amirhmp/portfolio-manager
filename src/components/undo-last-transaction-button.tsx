"use client";

import { undoLastTransaction as undoLastTransactionAction } from "@/app/actions";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import useSubmitForm from "@/hooks/useSubmitForm";
import { useLocale, useTranslations } from "next-intl";
import { Undo2 } from "lucide-react";
import { useState } from "react";

export type UndoableGroupSummary = {
  type: string;
  typeLabel: string;
  stockName: string | null;
  count: number;
  totalCost: number;
  dealDate: Date | string;
};

export default function UndoLastTransactionButton({
  group,
}: {
  group: UndoableGroupSummary;
}) {
  const t = useTranslations("UndoLastTransaction");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const { isPending, request: undoLastTransaction } = useSubmitForm(
    undoLastTransactionAction,
  );

  async function handleConfirm() {
    const result = await undoLastTransaction();
    if (result.success) setOpen(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button variant="destructive" size="sm">
            <Undo2 data-icon="inline-start" />
            {t("button")}
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("dialogTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("dialogDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid grid-cols-2 gap-3 rounded-md border border-border bg-background/40 p-4">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-wide text-muted-foreground">
              {t("summaryType")}
            </p>
            <p className="font-serif text-base font-medium text-foreground">
              {group.typeLabel}
              {group.stockName ? ` — ${group.stockName}` : ""}
            </p>
          </div>
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-wide text-muted-foreground">
              {t("summaryDate")}
            </p>
            <p className="font-mono text-base font-medium tabular-nums text-foreground">
              {new Date(group.dealDate).toLocaleString(locale)}
            </p>
          </div>
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-wide text-muted-foreground">
              {t("summaryCount")}
            </p>
            <p className="font-mono text-base font-medium tabular-nums text-foreground">
              {group.count.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-wide text-muted-foreground">
              {t("summaryTotal")}
            </p>
            <p className="font-mono text-base font-medium tabular-nums text-primary">
              {group.totalCost.toLocaleString()}
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <Button
            variant="destructive"
            loading={isPending}
            onClick={handleConfirm}
          >
            {t("confirm")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
