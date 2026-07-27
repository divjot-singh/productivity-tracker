"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  CalendarCheck,
  ChartSpline,
  Settings,
} from "lucide-react";

const ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/today",
    label: "Today",
    icon: CalendarCheck,
  },
  {
    href: "/logs",
    label: "Logs",
    icon: ChartSpline,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-xl supports-[backdrop-filter]:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-screen-sm items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-[64px] flex-col items-center justify-center rounded-xl px-3 py-2 transition-colors ${
                active ? "text-blue-500" : "text-primary hover:text-zinc-200"
              }`}
            >
              <Icon size={22} strokeWidth={2} />

              <span className="mt-1 text-[11px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
