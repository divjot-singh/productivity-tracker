import { Suspense } from "react";

import WorkoutLogScreen from "@/components/workouts/log/WorkoutLogScreen";

export default function WorkoutsLogPage() {
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground p-6 text-sm">
          Loading workout...
        </div>
      }
    >
      <WorkoutLogScreen />
    </Suspense>
  );
}
