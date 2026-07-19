import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Lightweight wrappers around Next.js' navigation APIs that consider the
// routing configuration, so `Link`/`useRouter`/etc. automatically prefix
// hrefs with the current locale.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
