"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/users", label: "Users" },
  { href: "/stocks", label: "Stocks" },
  { href: "/transactions", label: "Transactions" },
  { href: "/transactions/new", label: "New Transaction" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 bg-zinc-900 text-zinc-100 flex flex-col">
      <div className="px-5 py-6 text-lg font-bold tracking-tight">
        Portfolio Manager
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {links.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
