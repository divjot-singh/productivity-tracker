"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import WorkoutBottomNavigation from "@/components/workouts/WorkoutBottomNavigation";
import WorkoutsSubNav from "@/components/workouts/WorkoutsSubNav";

interface WorkoutRealmShellProps {
  children: ReactNode;
}

export default function WorkoutRealmShell({
  children,
}: WorkoutRealmShellProps) {
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

          <div className="mt-4 hidden lg:block">
            <WorkoutsSubNav />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-screen-sm px-4 pt-4 pb-24 lg:pb-6">
        {children}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-50 lg:hidden">
        <WorkoutBottomNavigation />
      </div>
    </div>
  );
}
