"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Dumbbell } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api/client";
import { localDate } from "@/lib/dates";
import { summarizeSession } from "@/lib/workouts/exercise-stats";
import type { WorkoutEntry } from "@/models/workout";

interface LoadedWorkout {
  date: string;
  workout: WorkoutEntry | null;
}

export default function WorkoutSummaryCard({ date }: { date: string }) {
  const { user } = useAuth();
  const [loaded, setLoaded] = useState<LoadedWorkout | null>(null);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    apiRequest<WorkoutEntry | null>(user, `/api/workouts/${date}`)
      .then((workout) => {
        if (!cancelled) setLoaded({ date, workout });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ date, workout: null });
      });

    return () => {
      cancelled = true;
    };
  }, [user, date]);

  const href = date === localDate() ? "/workouts" : `/workouts/${date}`;
  const workout = loaded?.date === date ? loaded.workout : null;
  const ready = loaded?.date === date;

  const summaries = (workout?.exercises ?? [])
    .map((entry) => summarizeSession(date, entry.sets))
    .filter((summary) => summary !== null);

  const totalSets = summaries.reduce((sum, s) => sum + s.totalSets, 0);
  const volume = summaries.reduce((sum, s) => sum + s.volume, 0);

  return (
    <div className="bg-card flex items-center gap-3 rounded-2xl border p-4">
      <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
        <Dumbbell size={20} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {!ready ? "Workout" : workout ? "Workout logged" : "No workout yet"}
        </p>

        <p className="text-muted-foreground truncate text-xs">
          {workout
            ? `${summaries.length} exercises, ${totalSets} sets, ${Math.round(volume).toLocaleString()} kg volume`
            : "Log your training for this day"}
        </p>
      </div>

      <Link
        href={href}
        className="text-primary shrink-0 text-sm font-medium hover:underline"
      >
        {workout ? "View" : "Start"}
      </Link>
    </div>
  );
}
