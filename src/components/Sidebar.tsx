/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  ArrowLeftRight,
  ChevronsLeft,
  ChevronsRight,
  Gem,
  Languages,
  LayoutDashboard,
  Moon,
  PlusCircle,
  Sparkles,
  Sun,
  Users,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import Switch from "./ui/switch";

const COLLAPSE_STORAGE_KEY = "sidebar-collapsed";
const THEME_STORAGE_KEY = "theme";
const LOCALES = ["en", "fa"] as const;

export default function Sidebar() {
  const t = useTranslations("Sidebar");
  const locale = useLocale();
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  const groups = [
    {
      label: t("groupOverview"),
      links: [{ href: "/", label: t("dashboard"), icon: LayoutDashboard }],
    },
    {
      label: t("groupManage"),
      links: [
        { href: "/users", label: t("users"), icon: Users },
        { href: "/stocks", label: t("stocks"), icon: Gem },
      ],
    },
    {
      label: t("groupActivity"),
      links: [
        {
          href: "/transactions",
          label: t("transactions"),
          icon: ArrowLeftRight,
        },
        {
          href: "/transactions/new",
          label: t("newTransaction"),
          icon: PlusCircle,
        },
        {
          href: "/transactions/new/gold",
          label: t("newGoldTransaction"),
          icon: Sparkles,
        },
      ],
    },
  ];

  useEffect(() => {
    const stored = window.localStorage.getItem(COLLAPSE_STORAGE_KEY);
    if (stored === "1") setCollapsed(true);

    // The blocking script in [locale]/layout.tsx already applied the
    // stored/default theme before paint -- just read the resulting class
    // rather than re-deciding a default here.
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  function toggleTheme() {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  }

  function switchLocale(nextLocale: string) {
    router.replace(
      // @ts-expect-error -- pathname/params are dynamic across routes
      { pathname, params },
      { locale: nextLocale },
    );
  }

  return (
    <aside
      className={cn(
        "shrink-0 bg-sidebar text-sidebar-foreground flex flex-col border-e border-sidebar-border transition-[width] duration-150",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className={cn("pt-7 pb-6", collapsed ? "px-3" : "px-5")}>
        <div
          className={cn(
            "flex items-center gap-2.5",
            collapsed && "justify-center",
          )}
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/10">
            <Gem className="size-3.5 text-primary" strokeWidth={1.75} />
          </span>
          {!collapsed && (
            <span className="font-serif text-[1.05rem] font-medium tracking-tight text-foreground">
              {t("brand")}
            </span>
          )}
        </div>
        <div className={`mt-4 ledger-rule ${collapsed ? "w-full!" : ""}`} />
      </div>

      <nav
        className={cn(
          "flex-1 space-y-6 overflow-y-auto pb-6",
          collapsed ? "px-2" : "px-3",
        )}
      >
        {groups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-3 pb-1.5 font-mono text-[0.65rem] font-medium uppercase tracking-[0.14em] text-sidebar-foreground/40">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.links.map((link) => {
                const active = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    title={collapsed ? link.label : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      collapsed && "justify-center px-0",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_2px_0_0_0_var(--sidebar-primary)]"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0",
                        active ? "text-primary" : "text-sidebar-foreground/40",
                      )}
                      strokeWidth={1.75}
                    />
                    {!collapsed && link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div
        className={cn(
          "border-t border-sidebar-border py-3",
          collapsed ? "px-2" : "px-3",
        )}
      >
        {!collapsed && (
          <div className="mb-1 flex items-center justify-between gap-2 px-3 py-1.5">
            <span className="flex items-center gap-2">
              {theme === "dark" ? (
                <Moon
                  className="size-4 shrink-0 text-sidebar-foreground/40"
                  strokeWidth={1.75}
                />
              ) : (
                <Sun
                  className="size-4 shrink-0 text-sidebar-foreground/40"
                  strokeWidth={1.75}
                />
              )}
              <span className="text-sm font-medium text-sidebar-foreground/70">
                {t("theme")}
              </span>
            </span>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={toggleTheme}
              aria-label={t("theme")}
            />
          </div>
        )}

        {!collapsed && (
          <div className="mb-1 flex items-center gap-2 px-3 py-1.5">
            <Languages
              className="size-4 shrink-0 text-sidebar-foreground/40"
              strokeWidth={1.75}
            />

            <Select
              id="stock"
              name="stock"
              required
              onValueChange={(value) => {
                switchLocale(value!);
              }}
              aria-label={t("language")}
              value={locale}
            >
              <SelectTrigger className="w-45">
                <SelectValue>
                  {(value) =>
                    LOCALES[LOCALES.indexOf(value)] === "en"
                      ? "English"
                      : "فارسی"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {LOCALES.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l === "en" ? "English" : "فارسی"}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        )}

        <button
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? t("expandSidebar") : t("collapseSidebar")}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            collapsed && "justify-center px-0",
          )}
        >
          {collapsed ? (
            <ChevronsRight className="size-4 shrink-0" strokeWidth={1.75} />
          ) : (
            <>
              <ChevronsLeft
                className="size-4 shrink-0 rtl:rotate-180"
                strokeWidth={1.75}
              />
              {t("collapse")}
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
