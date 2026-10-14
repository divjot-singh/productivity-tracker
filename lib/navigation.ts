import {
  BarChart3,
  CalendarCheck,
  Dumbbell,
  User,
  type LucideIcon,
} from "lucide-react";

export interface NavTab {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Path prefixes that keep this tab highlighted. */
  match: string[];
}

export const NAV_TABS: NavTab[] = [
  { label: "Today", href: "/today", icon: CalendarCheck, match: ["/today"] },
  {
    label: "Workouts",
    href: "/workouts",
    icon: Dumbbell,
    match: ["/workouts"],
  },
  {
    label: "Insights",
    href: "/dashboard",
    icon: BarChart3,
    match: ["/dashboard", "/logs"],
  },
  { label: "Me", href: "/settings", icon: User, match: ["/settings"] },
];

export function isTabActive(tab: NavTab, pathname: string): boolean {
  return tab.match.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

// Screens that render no app chrome (auth and first-run).
export const CHROMELESS_PREFIXES = ["/login", "/onboarding"];
