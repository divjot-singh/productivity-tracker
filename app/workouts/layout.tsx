import { ReactNode } from "react";

import WorkoutRealmShell from "@/components/workouts/WorkoutRealmShell";
import WorkoutsOnboardingGate from "@/components/workouts/WorkoutsOnboardingGate";

interface WorkoutsLayoutProps {
  children: ReactNode;
}

export default function WorkoutsLayout({ children }: WorkoutsLayoutProps) {
  return (
    <WorkoutRealmShell>
      <WorkoutsOnboardingGate>{children}</WorkoutsOnboardingGate>
    </WorkoutRealmShell>
  );
}
