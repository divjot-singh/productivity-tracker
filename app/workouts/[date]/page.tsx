"use client";

import Link from "next/link";
import { useMemo, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Dumbbell, Pencil, TrendingUp } from "lucide-react";
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

function getTargetProgress(topWeight: number, targetWeight: number) {
  if (targetWeight <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((topWeight / targetWeight) * 100));
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
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
        exercises: 0,
        totalSets: 0,
        warmupSets: 0,
        totalVolume: 0,
        avgEffort: null as number | null,
      };
    }

    let totalSets = 0;
    let warmupSets = 0;
    let totalVolume = 0;
    let effortSum = 0;
    let effortCount = 0;

    for (const exerciseEntry of workout.exercises) {
      totalSets += exerciseEntry.sets.length;

      for (const setEntry of exerciseEntry.sets) {
        if (setEntry.isWarmup) {
          warmupSets += 1;
        }

        totalVolume += getSetVolume(setEntry);

        if (setEntry.effort !== null) {
          effortSum += setEntry.effort;
          effortCount += 1;
        }
      }
    }

    return {
      exercises: workout.exercises.length,
      totalSets,
      warmupSets,
      totalVolume,
      avgEffort: effortCount > 0 ? effortSum / effortCount : null,
    };
  }, [workout]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6">
        <div className="space-y-3">
          <div className="bg-muted h-4 w-24 animate-pulse rounded" />
          <div className="bg-muted h-8 w-48 animate-pulse rounded" />
          <div className="bg-muted h-4 w-72 animate-pulse rounded" />
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="bg-muted h-20 animate-pulse rounded-2xl"
            />
          ))}
        </div>

        <div className="bg-muted h-64 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="mx-auto max-w-4xl p-4 sm:p-6">
        <div className="bg-card rounded-2xl border p-8 text-center">
          <p className="text-sm font-medium">
            No workout saved for {decodedDate}.
          </p>

          <p className="text-muted-foreground mt-1 text-sm">
            There is no workout history available for this date.
          </p>

          <Link
            href={`/workouts?date=${encodeURIComponent(decodedDate)}`}
            className="text-primary mt-4 inline-flex text-sm font-medium hover:underline"
          >
            Open workout log
          </Link>
        </div>
      </div>
    );
  }

  const combinationLabels = workout.combinationIds
    .map((combinationId) => combinationMap.get(combinationId) ?? combinationId)
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      {/* Header */}
      <section className="space-y-4">
        <Link
          href="/workouts/progress"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Progress
        </Link>

        <div className="bg-card rounded-2xl border p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                  <Dumbbell className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Workout
                  </p>

                  <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                    {workout.date}
                  </h1>
                </div>
              </div>

              {combinationLabels.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {combinationLabels.map((label) => (
                    <span
                      key={label}
                      className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-medium"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground mt-3 text-sm">
                  No workout combination selected.
                </p>
              )}
            </div>

            <Link
              href={`/workouts?date=${encodeURIComponent(workout.date)}`}
              className="border-input hover:bg-accent inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit workout
            </Link>
          </div>
        </div>
      </section>

      {/* Summary */}
      <section>
        <div className="mb-3">
          <h2 className="text-base font-semibold">Workout summary</h2>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Overview of this training session
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <SummaryCard label="Exercises" value={summary.exercises} />

          <SummaryCard label="Total sets" value={summary.totalSets} />

          <SummaryCard label="Volume" value={Math.round(summary.totalVolume)} />

          <SummaryCard
            label="Avg effort"
            value={
              summary.avgEffort !== null
                ? `${summary.avgEffort.toFixed(1)} / 5`
                : "—"
            }
          />
        </div>

        <div className="text-muted-foreground mt-2 flex items-center gap-2 text-xs">
          <span>{summary.warmupSets} warm-up sets</span>
          <span>•</span>
          <span>{summary.totalSets - summary.warmupSets} working sets</span>
        </div>
      </section>

      {/* Exercises */}
      <section>
        <div className="mb-3">
          <h2 className="text-base font-semibold">Exercises</h2>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Set-by-set breakdown of your workout
          </p>
        </div>

        <div className="space-y-4">
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

            const warmupSets = exerciseEntry.sets.filter(
              (setEntry) => setEntry.isWarmup,
            ).length;

            const workingSets = exerciseEntry.sets.length - warmupSets;

            const targetWeight = exercise?.targetWeight ?? null;

            const progressPercent =
              targetWeight !== null
                ? getTargetProgress(maxWeight, targetWeight)
                : null;

            const weightUnit = exercise?.weightTracking.unit ?? "kg";

            return (
              <article
                key={`${exerciseEntry.exerciseId}-${exerciseIndex}`}
                className="bg-card overflow-hidden rounded-2xl border"
              >
                {/* Exercise header */}
                <div className="border-b p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                          <Dumbbell className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold sm:text-base">
                            {exercise?.name ?? exerciseEntry.exerciseId}
                          </h3>

                          <p className="text-muted-foreground mt-0.5 text-xs">
                            {exercise?.categories?.join(" • ") ||
                              "Uncategorized"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold">
                        {formatNumber(maxWeight)} {weightUnit}
                      </p>

                      <p className="text-muted-foreground text-[11px]">
                        Top weight
                      </p>
                    </div>
                  </div>

                  {/* Exercise stats */}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <MiniStat label="Working sets" value={workingSets} />

                    <MiniStat
                      label="Volume"
                      value={Math.round(exerciseVolume)}
                    />

                    <MiniStat label="Warm-ups" value={warmupSets} />
                  </div>

                  {/* Target progress */}
                  {progressPercent !== null && targetWeight !== null ? (
                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="text-primary h-3.5 w-3.5" />

                          <p className="text-xs font-medium">Target progress</p>
                        </div>

                        <p className="text-muted-foreground text-[11px]">
                          {formatNumber(maxWeight)} /{" "}
                          {formatNumber(targetWeight)} {weightUnit}
                        </p>
                      </div>

                      <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                        <div
                          className="bg-primary h-full rounded-full transition-all"
                          style={{
                            width: `${progressPercent}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : null}

                  {exercise?.progression.repRange ? (
                    <div className="text-muted-foreground mt-3 text-xs">
                      Target reps:{" "}
                      <span className="text-foreground font-medium">
                        {exercise.progression.repRange.min}–
                        {exercise.progression.repRange.max}
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Sets */}
                <div className="p-3 sm:p-4">
                  <div className="text-muted-foreground hidden grid-cols-[56px_1fr_90px_80px_90px] gap-3 px-3 pb-2 text-[10px] font-semibold tracking-wide uppercase sm:grid">
                    <span>Set</span>
                    <span>Type</span>
                    <span>Weight</span>
                    <span>Reps</span>
                    <span>Effort</span>
                  </div>

                  <div className="space-y-1.5">
                    {exerciseEntry.sets.map((setEntry, setIndex) => {
                      const volume = getSetVolume(setEntry);

                      return (
                        <div
                          key={setIndex}
                          className="bg-muted/30 rounded-xl border px-3 py-2.5"
                        >
                          {/* Mobile */}
                          <div className="flex items-center justify-between gap-3 sm:hidden">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold">
                                  Set {setIndex + 1}
                                </span>

                                <span
                                  className={
                                    setEntry.isWarmup
                                      ? "bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-medium"
                                      : "bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-medium"
                                  }
                                >
                                  {setEntry.isWarmup ? "Warm-up" : "Working"}
                                </span>
                              </div>

                              <p className="text-muted-foreground mt-1 text-xs">
                                Volume {Math.round(volume)}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-sm font-semibold">
                                {setEntry.weight ?? "—"} {weightUnit}
                              </p>

                              <p className="text-muted-foreground text-xs">
                                {setEntry.reps ?? "—"} reps
                                {" • "}
                                Effort {setEntry.effort ?? "—"}
                              </p>
                            </div>
                          </div>

                          {/* Desktop */}
                          <div className="hidden grid-cols-[56px_1fr_90px_80px_90px] items-center gap-3 sm:grid">
                            <span className="text-xs font-semibold">
                              {setIndex + 1}
                            </span>

                            <span
                              className={
                                setEntry.isWarmup
                                  ? "text-muted-foreground text-xs"
                                  : "text-primary text-xs font-medium"
                              }
                            >
                              {setEntry.isWarmup ? "Warm-up" : "Working"}
                            </span>

                            <span className="text-sm font-medium">
                              {setEntry.weight ?? "—"} {weightUnit}
                            </span>

                            <span className="text-sm">
                              {setEntry.reps ?? "—"}
                            </span>

                            <span className="text-muted-foreground text-xs">
                              {setEntry.effort ?? "—"} / 5
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {exerciseEntry.notes ? (
                    <div className="bg-muted/30 mt-3 rounded-xl border px-3 py-2.5">
                      <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                        Exercise notes
                      </p>

                      <p className="mt-1 text-sm">{exerciseEntry.notes}</p>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Workout notes */}
      {workout.notes ? (
        <section className="bg-card rounded-2xl border p-4 sm:p-5">
          <div className="mb-2">
            <h2 className="text-base font-semibold">Workout notes</h2>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Notes recorded for this session
            </p>
          </div>

          <p className="text-muted-foreground text-sm leading-relaxed">
            {workout.notes}
          </p>
        </section>
      ) : null}
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-card rounded-2xl border px-3.5 py-3">
      <p className="text-muted-foreground text-[11px] font-medium">{label}</p>

      <p className="mt-1 text-base font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-muted/40 rounded-xl border px-2.5 py-2">
      <p className="text-muted-foreground text-[10px]">{label}</p>

      <p className="mt-0.5 text-xs font-semibold">{value}</p>
    </div>
  );
}
