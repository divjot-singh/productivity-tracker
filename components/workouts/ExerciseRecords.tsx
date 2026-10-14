"use client";

import Link from "next/link";

import { buildHistories, computeStats } from "@/lib/workouts/exercise-stats";
import type { WorkoutEntry } from "@/models/workout";

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card rounded-2xl border px-3.5 py-3">
      <p className="text-muted-foreground text-[11px] font-medium">{label}</p>
      <p className="mt-1 text-base font-semibold tracking-tight">{value}</p>
    </div>
  );
}

// Records and recent sessions, computed from the workouts that include this exercise.
export default function ExerciseRecords({
  exerciseId,
  workouts,
  unit,
}: {
  exerciseId: string;
  workouts: WorkoutEntry[];
  unit: string;
}) {
  const stats = computeStats(
    exerciseId,
    buildHistories(workouts).get(exerciseId) ?? {},
  );

  if (stats.totalSessions === 0) {
    return (
      <section className="mb-8">
        <h2 className="mb-3 text-base font-semibold">Your records</h2>

        <p className="text-muted-foreground bg-card rounded-2xl border p-4 text-sm">
          No sessions logged yet. Records appear after your first workout with
          this exercise.
        </p>
      </section>
    );
  }

  const recent = Object.values(stats.history)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-base font-semibold">Your records</h2>

      <div className="grid grid-cols-2 gap-2">
        <Tile
          label="Personal record"
          value={stats.prWeight ? `${stats.prWeight.value} ${unit}` : "-"}
        />
        <Tile
          label="Best est. 1RM"
          value={stats.best1RM ? `${stats.best1RM.value} ${unit}` : "-"}
        />
        <Tile
          label="Highest volume"
          value={
            stats.highestVolume
              ? `${Math.round(stats.highestVolume.value)}`
              : "-"
          }
        />
        <Tile label="Sessions" value={`${stats.totalSessions}`} />
      </div>

      <div className="bg-card mt-3 divide-y overflow-hidden rounded-2xl border">
        {recent.map((session) => (
          <Link
            key={session.date}
            href={`/workouts/${session.date}`}
            className="hover:bg-accent flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors"
          >
            <span className="text-muted-foreground">{session.date}</span>
            <span className="font-medium">
              {session.topWeight} {unit} x {session.topWeightReps}
              <span className="text-muted-foreground font-normal">
                {" "}
                - vol {Math.round(session.volume)}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
