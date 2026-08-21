"use client";

import Link from "next/link";
import { useMemo, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { apiRequest } from "@/lib/api/client";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import {
  ExerciseDefinition,
  WorkoutCombination,
  WorkoutEntry,
  WorkoutSetEntry,
} from "@/models/workout";

function getSetVolume(setEntry: WorkoutSetEntry) {
  if (setEntry.weight === null || setEntry.reps === null) {
    return 0;
  }

  return setEntry.weight * setEntry.reps;
}

export default function WorkoutDateInsightsPage() {
  const { user } = useRequireAuth();
  const { date } = useParams<{ date: string }>();
  const decodedDate = decodeURIComponent(date);

  const [workout, setWorkout] = useState<WorkoutEntry | null>(null);
  const [exercises, setExercises] = useState<ExerciseDefinition[]>([]);
  const [combinations, setCombinations] = useState<WorkoutCombination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) {
        return;
      }

      try {
        setLoading(true);

        const [workoutData, exerciseData, combinationData] = await Promise.all([
          apiRequest<WorkoutEntry | null>(user, `/api/workouts/${decodedDate}`),
          apiRequest<ExerciseDefinition[]>(
            user,
            "/api/exercises?includeInactive=true",
          ),
          apiRequest<WorkoutCombination[]>(
            user,
            "/api/combinations?includeInactive=true",
          ),
        ]);

        setWorkout(workoutData);
        setExercises(exerciseData ?? []);
        setCombinations(combinationData ?? []);
      } catch (error) {
        console.error(error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load workout insights",
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [decodedDate, user]);

  const exerciseMap = useMemo(
    () => new Map(exercises.map((exercise) => [exercise.id, exercise])),
    [exercises],
  );

  const combinationMap = useMemo(
    () =>
      new Map(
        combinations.map((combination) => [combination.id, combination.name]),
      ),
    [combinations],
  );

  const summary = useMemo(() => {
    if (!workout) {
      return {
        totalSets: 0,
        totalVolume: 0,
        avgEffort: null as number | null,
      };
    }

    let totalSets = 0;
    let totalVolume = 0;
    let effortSum = 0;
    let effortCount = 0;

    for (const exerciseEntry of workout.exercises) {
      totalSets += exerciseEntry.sets.length;

      for (const setEntry of exerciseEntry.sets) {
        totalVolume += getSetVolume(setEntry);
        if (setEntry.effort !== null) {
          effortSum += setEntry.effort;
          effortCount += 1;
        }
      }
    }

    return {
      totalSets,
      totalVolume,
      avgEffort: effortCount > 0 ? effortSum / effortCount : null,
    };
  }, [workout]);

  if (loading) {
    return (
      <div className="text-muted-foreground p-6 text-sm">
        Loading workout insights...
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="bg-card rounded-2xl border p-8 text-center">
        <p className="text-muted-foreground text-sm">
          No workout saved for {decodedDate}.
        </p>
        <Link
          href={`/workouts?date=${encodeURIComponent(decodedDate)}`}
          className="text-primary mt-3 inline-block text-sm font-medium hover:underline"
        >
          Open log for this date
        </Link>
      </div>
    );
  }

  const combinationLabels = workout.combinationIds
    .map((combinationId) => combinationMap.get(combinationId) ?? combinationId)
    .join(", ");

  return (
    <div className="space-y-4 pb-4">
      <section className="bg-card rounded-2xl border p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              {workout.date}
            </h2>
            <p className="text-muted-foreground mt-1 text-xs">
              {combinationLabels || "No combination selected"}
            </p>
          </div>

          <Link
            href={`/workouts?date=${encodeURIComponent(workout.date)}`}
            className="text-primary text-sm font-medium hover:underline"
          >
            Edit log
          </Link>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border px-3 py-2">
            <p className="text-muted-foreground text-xs">Exercises</p>
            <p className="text-sm font-semibold">{workout.exercises.length}</p>
          </div>
          <div className="rounded-xl border px-3 py-2">
            <p className="text-muted-foreground text-xs">Total sets</p>
            <p className="text-sm font-semibold">{summary.totalSets}</p>
          </div>
          <div className="rounded-xl border px-3 py-2">
            <p className="text-muted-foreground text-xs">Total volume</p>
            <p className="text-sm font-semibold">
              {Math.round(summary.totalVolume)}
            </p>
          </div>
        </div>

        {summary.avgEffort !== null ? (
          <p className="text-muted-foreground mt-3 text-xs">
            Average effort: {summary.avgEffort.toFixed(1)} / 5
          </p>
        ) : null}
      </section>

      {workout.exercises.map((exerciseEntry, exerciseIndex) => {
        const exercise = exerciseMap.get(exerciseEntry.exerciseId);

        const exerciseVolume = exerciseEntry.sets.reduce(
          (sum, setEntry) => sum + getSetVolume(setEntry),
          0,
        );

        const maxWeight = exerciseEntry.sets.reduce((max, setEntry) => {
          if (setEntry.weight === null) {
            return max;
          }
          return Math.max(max, setEntry.weight);
        }, 0);

        return (
          <section
            key={`${exerciseEntry.exerciseId}-${exerciseIndex}`}
            className="bg-card rounded-2xl border p-4"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">
                  {exercise?.name ?? exerciseEntry.exerciseId}
                </h3>
                <p className="text-muted-foreground text-xs">
                  {exercise?.categories.join(", ") || "Uncategorized"}
                </p>
              </div>

              <div className="text-right text-xs">
                <p className="text-muted-foreground">
                  Sets: {exerciseEntry.sets.length}
                </p>
                <p className="text-muted-foreground">
                  Volume: {Math.round(exerciseVolume)}
                </p>
                <p className="text-muted-foreground">Top weight: {maxWeight}</p>
              </div>
            </div>

            <div className="space-y-2">
              {exerciseEntry.sets.map((setEntry, setIndex) => {
                const volume = getSetVolume(setEntry);

                return (
                  <div
                    key={setIndex}
                    className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2"
                  >
                    <p className="text-sm font-medium">Set {setIndex + 1}</p>
                    <div className="text-muted-foreground flex items-center gap-3 text-xs">
                      <span>{setEntry.weight ?? "-"} kg</span>
                      <ChevronRight className="h-3 w-3" />
                      <span>{setEntry.reps ?? "-"} reps</span>
                      <ChevronRight className="h-3 w-3" />
                      <span>Effort {setEntry.effort ?? "-"}</span>
                      <ChevronRight className="h-3 w-3" />
                      <span>Vol {Math.round(volume)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {exerciseEntry.notes ? (
              <p className="text-muted-foreground mt-3 text-xs">
                Notes: {exerciseEntry.notes}
              </p>
            ) : null}
          </section>
        );
      })}

      {workout.notes ? (
        <section className="bg-card rounded-2xl border p-4">
          <p className="text-sm font-medium">Workout Notes</p>
          <p className="text-muted-foreground mt-1 text-sm">{workout.notes}</p>
        </section>
      ) : null}
    </div>
  );
}
