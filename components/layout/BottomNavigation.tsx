"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_TABS, isTabActive } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="bg-card border-border flex h-[var(--bottom-nav)] items-center border-t px-2 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex w-full max-w-screen-sm items-center justify-around gap-1">
        {NAV_TABS.map((tab) => {
          const active = isTabActive(tab, pathname);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl py-1 text-xs transition-colors",
                active
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
