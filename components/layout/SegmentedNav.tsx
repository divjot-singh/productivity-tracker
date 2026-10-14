"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export interface SegmentedNavItem {
  label: string;
  href: string;
  /** Extra path prefixes that keep this item selected. */
  match?: string[];
}

function isActive(
  item: SegmentedNavItem,
  pathname: string,
  all: SegmentedNavItem[],
) {
  const prefixes = [item.href, ...(item.match ?? [])];

  const hit = prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!hit) return false;

  // The longest matching href wins so "/workouts" does not stay lit on "/workouts/exercises".
  const longest = all
    .filter((other) =>
      [other.href, ...(other.match ?? [])].some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
      ),
    )
    .reduce((best, other) =>
      other.href.length > best.href.length ? other : best,
    );

  return longest.href === item.href;
}

// Pinned under the fixed top bar so only the content below scrolls; items scroll sideways instead of overlapping.
export default function SegmentedNav({
  items,
  label,
}: {
  items: SegmentedNavItem[];
  label: string;
}) {
  const pathname = usePathname();

  return (
    <div className="bg-background sticky top-[var(--top-bar)] z-30 -mx-4 px-4 pt-1 pb-3">
      <nav
        aria-label={label}
        className="bg-muted/60 border-border flex [scrollbar-width:none] gap-1 overflow-x-auto rounded-xl border p-1 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => {
          const active = isActive(item, pathname, items);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-9 flex-1 items-center justify-center rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors",
                active
                  ? "bg-primary/15 text-primary ring-primary/30 font-semibold ring-1 ring-inset"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
