"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

import AppShell from "@/components/layout/AppShell";
import WorkoutsSubNav from "@/components/workouts/WorkoutsSubNav";

interface WorkoutRealmShellProps {
  children: ReactNode;
}

// Workouts share the main app chrome; the sub-nav switches between its own sections.
export default function WorkoutRealmShell({
  children,
}: WorkoutRealmShellProps) {
  const pathname = usePathname();

  const showSubNav = pathname !== "/workouts/onboarding";

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-screen-sm pb-24">
        {showSubNav ? (
          <div className="mb-4">
            <WorkoutsSubNav />
          </div>
        ) : null}

        {children}
      </div>
    </AppShell>
  );
}
