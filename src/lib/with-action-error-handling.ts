import { getTranslations } from "next-intl/server";
import { AppError } from "./errors";
import { getExceptionMessage } from "./utils";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; message: string; fieldErrors?: Record<string, string[]> };

export function withErrorHandling<Args extends unknown[], T>(
  fn: (...args: Args) => Promise<T>,
) {
  return async (...args: Args): Promise<ActionResult<T>> => {
    try {
      const data = await fn(...args);
      return { success: true, data };
    } catch (err) {
      if (err instanceof AppError) {
        return { success: false, message: err.message };
      }
      const errorMsg = getExceptionMessage(err);
      console.error(errorMsg); // log unexpected errors server-side
      if (process.env.NODE_ENV === "production") {
        const t = await getTranslations("Errors");
        return { success: false, message: t("somethingWentWrong") };
      }
      return { success: false, message: errorMsg };
    }
  };
}
