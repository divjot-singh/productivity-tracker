"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, Home } from "lucide-react";

import WorkoutBottomNavigation from "@/components/workouts/WorkoutBottomNavigation";
import WorkoutsSubNav from "@/components/workouts/WorkoutsSubNav";

interface WorkoutRealmShellProps {
  children: ReactNode;
}

export default function WorkoutRealmShell({
  children,
}: WorkoutRealmShellProps) {
  const pathname = usePathname();

  // Only the workout logging page gets the special scrolling header.
  const isWorkoutLogPage = pathname === "/workouts";
  const isWorkoutOnboardingPage = pathname === "/workouts/onboarding";

  if (isWorkoutLogPage) {
    return (
      <div className="bg-background min-h-dvh">
        {/* Compact sticky header */}
        <header className="bg-background/95 supports-backdrop-filter:bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
          <div className="mx-auto flex w-full max-w-screen-sm items-center justify-between px-4 py-3">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground inline-flex flex-1 items-center gap-1 text-sm transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <Home />
            </Link>

            <div className="mt-2">
              <h1 className="text-2xl font-bold tracking-tight">Workout Hub</h1>
            </div>
            <div className="flex-1"></div>
          </div>
        </header>

        {/* Everything below the compact header can scroll */}
        <main className="mx-auto w-full max-w-screen-sm px-4 pt-3 pb-6">
          {children}
        </main>

        {!isWorkoutOnboardingPage ? (
          <div className="fixed inset-x-0 bottom-0 z-50 lg:hidden">
            <WorkoutBottomNavigation />
          </div>
        ) : null}
      </div>
    );
  }

  // Existing behavior for every other workout page.
  return (
    <div className="bg-background min-h-dvh">
      <header className="bg-background/95 supports-backdrop-filter:bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto w-full max-w-screen-sm px-4 pt-4 pb-3">
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Dashboard
          </Link>

          <div className="mt-3">
            <h1 className="text-2xl font-bold tracking-tight">Workout Hub</h1>

            <p className="text-muted-foreground mt-1 text-sm">
              Log sessions, manage your library, and track progress.
            </p>
          </div>

          {!isWorkoutOnboardingPage ? (
            <div className="mt-4 hidden lg:block">
              <WorkoutsSubNav />
            </div>
          ) : null}
        </div>
      </header>

      <main className="mx-auto w-full max-w-screen-sm px-4 pt-4 pb-6">
        {children}
      </main>

      {!isWorkoutOnboardingPage ? (
        <div className="fixed inset-x-0 bottom-0 z-50 lg:hidden">
          <WorkoutBottomNavigation />
        </div>
      ) : null}
    </div>
  );
}
