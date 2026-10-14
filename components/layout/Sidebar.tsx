"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import BrandLogo from "@/components/common/BrandLogo";
import { NAV_TABS, isTabActive } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-sidebar border-border w-64 border-r">
      <div className="border-border border-b p-6">
        <BrandLogo size={30} textClassName="text-sm font-semibold" />
      </div>

      <nav aria-label="Primary" className="space-y-1 p-4">
        {NAV_TABS.map((tab) => {
          const active = isTabActive(tab, pathname);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent text-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className={cn("h-4 w-4", active && "text-primary")} />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
