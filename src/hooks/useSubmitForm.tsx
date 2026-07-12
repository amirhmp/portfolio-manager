"use client";
import type { ActionResult } from "@/lib/with-action-error-handling";
import { useTransition } from "react";
import { toast } from "sonner";

export default function useSubmitForm<Args extends unknown[], T>(
  fn: (...args: Args) => Promise<ActionResult<T>>,
  options?: {
    hideSuccessToast?: boolean;
    hideErrorToast?: boolean;
    successMsg?: string;
  },
) {
  const { hideErrorToast, hideSuccessToast, successMsg } = options ?? {};
  const [isPending, startTransition] = useTransition();
  const request = (...args: Args): Promise<ActionResult<T>> => {
    return new Promise((resolve) => {
      startTransition(async () => {
        const result = await fn(...args);
        if (result.success) {
          if (!hideSuccessToast)
            toast.success(successMsg || "Done Successfully");
        } else {
          if (!hideErrorToast) toast.error(result.message);
        }
        resolve(result);
      });
    });
  };

  return { isPending, request };
}
