"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ITEMS = [
  { label: "Overview", href: "/dashboard" },
  { label: "Logs", href: "/logs" },
];

export default function InsightsSubNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Insights sections"
      className="bg-muted mb-4 grid max-w-xs grid-cols-2 gap-1 rounded-xl p-1"
    >
      {ITEMS.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-lg px-2 py-2 text-center text-sm font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
