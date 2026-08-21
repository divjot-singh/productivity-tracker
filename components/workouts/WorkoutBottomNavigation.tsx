"use client";

import Link from "next/link";
import {
  Activity,
  Dumbbell,
  Layers3,
  ListChecks,
  LucideIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ITEMS: Array<{ label: string; href: string; Icon: LucideIcon }> = [
  { label: "Log", href: "/workouts", Icon: Dumbbell },
  { label: "Exercises", href: "/workouts/exercises", Icon: ListChecks },
  {
    label: "Combinations",
    href: "/workouts/combinations",
    Icon: Layers3,
  },
  { label: "Progress", href: "/workouts/progress", Icon: Activity },
];

export default function WorkoutBottomNavigation() {
  const pathname = usePathname();

  return (
    <div className="border-t border-gray-800 bg-gray-900 px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      <div className="flex items-end justify-around gap-1">
        {ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/workouts" && pathname.startsWith(item.href));

          const { Icon } = item;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center",
                isActive ? "text-primary" : "text-gray-500",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="mt-1 text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
