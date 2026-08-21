import { ReactNode } from "react";

import WorkoutRealmShell from "@/components/workouts/WorkoutRealmShell";

interface WorkoutsLayoutProps {
  children: ReactNode;
}

export default function WorkoutsLayout({ children }: WorkoutsLayoutProps) {
  return <WorkoutRealmShell>{children}</WorkoutRealmShell>;
}
