import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // All locales supported by the app
  locales: ["en", "fa"],

  // Used when no locale matches
  defaultLocale: "en",
});
