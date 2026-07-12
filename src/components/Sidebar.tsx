"use client";

import { cn } from "@/lib/utils";
import {
  ArrowLeftRight,
  Gem,
  LayoutDashboard,
  PlusCircle,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const groups = [
  {
    label: "Overview",
    links: [{ href: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Manage",
    links: [
      { href: "/users", label: "Users", icon: Users },
      { href: "/stocks", label: "Stocks", icon: Gem },
    ],
  },
  {
    label: "Activity",
    links: [
      { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
      { href: "/transactions/new", label: "New Transaction", icon: PlusCircle },
      {
        href: "/transactions/new/gold",
        label: "New Gold Transaction",
        icon: Sparkles,
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border">
      <div className="px-5 pt-7 pb-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-md border border-primary/30 bg-primary/10">
            <Gem className="size-3.5 text-primary" strokeWidth={1.75} />
          </span>
          <span className="font-serif text-[1.05rem] font-medium tracking-tight text-foreground">
            Portfolio Manager
          </span>
        </div>
        <div className="mt-4 ledger-rule" />
      </div>

      <nav className="flex-1 px-3 space-y-6 overflow-y-auto pb-6">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-1.5 font-mono text-[0.65rem] font-medium uppercase tracking-[0.14em] text-sidebar-foreground/40">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.links.map((link) => {
                const active = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
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
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
