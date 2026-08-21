"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ITEMS = [
  { label: "Log", href: "/workouts" },
  { label: "Exercises", href: "/workouts/exercises" },
  { label: "Combinations", href: "/workouts/combinations" },
  { label: "Progress", href: "/workouts/progress" },
];

export default function WorkoutsSubNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-muted grid grid-cols-4 gap-1 rounded-xl p-1">
      {ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/workouts" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-lg px-2 py-2 text-center text-sm font-medium transition-colors",
              isActive
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
