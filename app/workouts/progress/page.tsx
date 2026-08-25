"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Dumbbell,
  Filter,
  RotateCcw,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { apiRequest } from "@/lib/api/client";
import {
  ExerciseDefinition,
  WorkoutCombination,
  WorkoutExerciseEntry,
  WorkoutEntry,
} from "@/models/workout";

const NATIVE_SELECT_CLASS =
  "border-input bg-background text-foreground focus:ring-primary/40 h-10 w-full rounded-xl border px-3 text-sm transition outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60";

const INITIAL_EXERCISE_COUNT = 0;

function getExerciseTopWeight(exerciseEntry: WorkoutExerciseEntry) {
  return exerciseEntry.sets.reduce((max, setEntry) => {
    if (setEntry.weight === null) {
      return max;
    }

    return Math.max(max, setEntry.weight);
  }, 0);
}

function getExerciseTopSet(exerciseEntry: WorkoutExerciseEntry) {
  return exerciseEntry.sets.reduce<{
    weight: number | null;
    reps: number | null;
  } | null>((best, setEntry) => {
    if (setEntry.weight === null && setEntry.reps === null) {
      return best;
    }

    if (!best) {
      return {
        weight: setEntry.weight,
        reps: setEntry.reps,
      };
    }

    const currentWeight = setEntry.weight ?? 0;
    const bestWeight = best.weight ?? 0;

    if (currentWeight > bestWeight) {
      return {
        weight: setEntry.weight,
        reps: setEntry.reps,
      };
    }

    return best;
  }, null);
}

function getTargetProgress(topWeight: number, targetWeight: number) {
  if (targetWeight <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((topWeight / targetWeight) * 100));
}

function getWarmupSetCount(exerciseEntry: WorkoutExerciseEntry) {
  return exerciseEntry.sets.filter((setEntry) => setEntry.isWarmup).length;
}

function getWorkingSetCount(exerciseEntry: WorkoutExerciseEntry) {
  return exerciseEntry.sets.filter((setEntry) => !setEntry.isWarmup).length;
}

function getWorkoutVolume(workout: WorkoutEntry) {
  return workout.exercises.reduce(
    (exerciseSum, exercise) =>
      exerciseSum +
      exercise.sets.reduce((setSum, setEntry) => {
        if (setEntry.weight === null || setEntry.reps === null) {
          return setSum;
        }

        return setSum + setEntry.weight * setEntry.reps;
      }, 0),
    0,
  );
}

function getWorkoutEffort(workout: WorkoutEntry) {
  let effortCount = 0;
  const totalEffort = workout.exercises.reduce((effortSum, exercise) => {
    const sumEffort =
      effortSum +
      exercise.sets.reduce((setSum, setEntry) => {
        effortCount += 1;
        return setSum + (setEntry.effort ?? 0);
      }, 0);
    return sumEffort;
  }, 0);

  return totalEffort / effortCount;
}

function getWorkoutSetCount(workout: WorkoutEntry) {
  return workout.exercises.reduce(
    (sum, exercise) => sum + exercise.sets.length,
    0,
  );
}

function formatVolume(volume: number) {
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}k`;
  }

  return Math.round(volume).toString();
}

function formatDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs font-medium">{label}</p>

        <div className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-lg">
          {icon}
        </div>
      </div>

      <p className="mt-2 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export default function WorkoutsProgressPage() {
  const { user } = useRequireAuth();

  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [exercises, setExercises] = useState<ExerciseDefinition[]>([]);
  const [combinations, setCombinations] = useState<WorkoutCombination[]>([]);

  const [dateQuery, setDateQuery] = useState("");
  const [selectedExerciseId, setSelectedExerciseId] = useState("all");
  const [selectedCombinationId, setSelectedCombinationId] = useState("all");

  const [sortBy, setSortBy] = useState<
    "recent" | "oldest" | "most-sets" | "highest-volume"
  >("recent");

  const [loading, setLoading] = useState(true);

  const [exerciseDetails, setExerciseDetails] = useState<{
    name: string;
    description?: string;
    notes?: string;
  } | null>(null);

  const [expandedWorkoutIds, setExpandedWorkoutIds] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    async function load() {
      if (!user) {
        return;
      }

      try {
        setLoading(true);

        const [workoutData, exerciseData, combinationData] = await Promise.all([
          apiRequest<WorkoutEntry[]>(user, "/api/workouts"),
          apiRequest<ExerciseDefinition[]>(
            user,
            "/api/exercises?includeInactive=true",
          ),
          apiRequest<WorkoutCombination[]>(
            user,
            "/api/combinations?includeInactive=true",
          ),
        ]);

        setWorkouts(workoutData ?? []);
        setExercises(exerciseData ?? []);
        setCombinations(combinationData ?? []);
      } catch (error) {
        console.error(error);

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load workout history",
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

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

  const hasActiveFilters =
    dateQuery.trim().length > 0 ||
    selectedExerciseId !== "all" ||
    selectedCombinationId !== "all";

  function clearFilters() {
    setDateQuery("");
    setSelectedExerciseId("all");
    setSelectedCombinationId("all");
  }

  function toggleWorkoutExpanded(workoutId: string) {
    setExpandedWorkoutIds((previous) => {
      const next = new Set(previous);

      if (next.has(workoutId)) {
        next.delete(workoutId);
      } else {
        next.add(workoutId);
      }

      return next;
    });
  }

  const filteredWorkouts = useMemo(() => {
    const filtered = workouts.filter((workout) => {
      const matchesDate =
        dateQuery.trim().length === 0 ||
        workout.date.includes(dateQuery.trim());

      const matchesExercise =
        selectedExerciseId === "all" ||
        workout.exercises.some(
          (exercise) => exercise.exerciseId === selectedExerciseId,
        );

      const matchesCombination =
        selectedCombinationId === "all" ||
        workout.combinationIds.includes(selectedCombinationId);

      return matchesDate && matchesExercise && matchesCombination;
    });

    return [...filtered].sort((left, right) => {
      switch (sortBy) {
        case "oldest":
          return left.date.localeCompare(right.date);

        case "most-sets":
          return getWorkoutSetCount(right) - getWorkoutSetCount(left);

        case "highest-volume":
          return getWorkoutVolume(right) - getWorkoutVolume(left);

        case "recent":
        default:
          return right.date.localeCompare(left.date);
      }
    });
  }, [dateQuery, selectedCombinationId, selectedExerciseId, sortBy, workouts]);

  const overallSummary = useMemo(() => {
    return filteredWorkouts.reduce(
      (summary, workout) => {
        const exercisesCount = workout.exercises.length;

        const totalSets = getWorkoutSetCount(workout);

        const volume = getWorkoutVolume(workout);

        return {
          workouts: summary.workouts + 1,
          exercises: summary.exercises + exercisesCount,
          sets: summary.sets + totalSets,
          volume: summary.volume + volume,
        };
      },
      {
        workouts: 0,
        exercises: 0,
        sets: 0,
        volume: 0,
      },
    );
  }, [filteredWorkouts]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Progress</h2>

        <p className="text-muted-foreground mt-1 text-sm">
          Track your training history, volume, and exercise progress.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="bg-muted h-24 animate-pulse rounded-2xl"
              />
            ))}
          </div>

          <div className="bg-muted h-20 animate-pulse rounded-2xl" />
        </div>
      ) : workouts.length === 0 ? (
        <div className="bg-card rounded-2xl border p-10 text-center">
          <div className="bg-muted mx-auto flex h-12 w-12 items-center justify-center rounded-2xl">
            <Dumbbell className="text-muted-foreground h-5 w-5" />
          </div>

          <h3 className="mt-4 text-sm font-semibold">No workouts yet</h3>

          <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
            Complete and save a workout to start seeing your training history
            here.
          </p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard
              label="Workouts"
              value={overallSummary.workouts}
              icon={<CalendarDays className="h-3.5 w-3.5" />}
            />

            <SummaryCard
              label="Exercises"
              value={overallSummary.exercises}
              icon={<Dumbbell className="h-3.5 w-3.5" />}
            />

            <SummaryCard
              label="Total sets"
              value={overallSummary.sets}
              icon={<TrendingUp className="h-3.5 w-3.5" />}
            />

            <SummaryCard
              label="Total volume"
              value={formatVolume(overallSummary.volume)}
              icon={<TrendingUp className="h-3.5 w-3.5" />}
            />
          </div>

          {/* Filters */}
          <div className="bg-card rounded-2xl border p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="bg-muted flex h-7 w-7 items-center justify-center rounded-lg">
                  <Filter className="text-muted-foreground h-3.5 w-3.5" />
                </div>

                <p className="text-sm font-medium">Filters</p>
              </div>

              {hasActiveFilters ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground h-8 px-2 text-xs"
                >
                  <RotateCcw className="mr-1.5 h-3 w-3" />
                  Clear
                </Button>
              ) : null}
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative">
                <CalendarDays className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />

                <input
                  value={dateQuery}
                  onChange={(e) => setDateQuery(e.target.value)}
                  placeholder="Filter by date"
                  className={`${NATIVE_SELECT_CLASS} pl-9`}
                />
              </div>

              <select
                value={selectedExerciseId}
                onChange={(e) => setSelectedExerciseId(e.target.value)}
                className={NATIVE_SELECT_CLASS}
              >
                <option value="all">All exercises</option>

                {exercises.map((exercise) => (
                  <option key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedCombinationId}
                onChange={(e) => setSelectedCombinationId(e.target.value)}
                className={NATIVE_SELECT_CLASS}
              >
                <option value="all">All combinations</option>

                {combinations.map((combination) => (
                  <option key={combination.id} value={combination.id}>
                    {combination.name}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as
                      "recent" | "oldest" | "most-sets" | "highest-volume",
                  )
                }
                className={NATIVE_SELECT_CLASS}
              >
                <option value="recent">Most recent</option>
                <option value="oldest">Oldest first</option>
                <option value="most-sets">Most sets</option>
                <option value="highest-volume">Highest volume</option>
              </select>
            </div>

            {hasActiveFilters ? (
              <p className="text-muted-foreground mt-3 text-xs">
                Showing {filteredWorkouts.length} of {workouts.length} workouts.
              </p>
            ) : null}
          </div>

          {/* Workout history */}
          <div className="space-y-4">
            {filteredWorkouts.map((workout) => {
              const totalSets = getWorkoutSetCount(workout);
              const volume = getWorkoutVolume(workout);
              const effort = getWorkoutEffort(workout);
              const isExpanded = expandedWorkoutIds.has(workout.id);

              const visibleExercises = isExpanded
                ? workout.exercises
                : workout.exercises.slice(0, INITIAL_EXERCISE_COUNT);

              const hiddenExerciseCount =
                workout.exercises.length - visibleExercises.length;

              const combinationLabels = workout.combinationIds
                .map((combinationId) => combinationMap.get(combinationId))
                .filter(Boolean);

              return (
                <div
                  key={workout.id}
                  className="bg-card overflow-hidden rounded-2xl border"
                >
                  {/* Workout header */}
                  <Link
                    href={`/workouts/${workout.date}`}
                    className="hover:bg-accent/50 flex items-center justify-between gap-4 border-b px-4 py-4 transition-colors sm:px-5"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold sm:text-base">
                          {formatDate(workout.date)}
                        </h3>

                        {combinationLabels.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {combinationLabels.map((label) => (
                              <span
                                key={label}
                                className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-medium"
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <p className="text-muted-foreground mt-1 text-xs">
                        {workout.exercises.length} exercise
                        {workout.exercises.length === 1 ? "" : "s"} ·{" "}
                        {totalSets} set{totalSets === 1 ? "" : "s"} ·{" "}
                        {formatVolume(volume)} volume
                      </p>
                    </div>

                    <div className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs font-medium">
                      <span className="hidden sm:inline">Open</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </Link>

                  {/* Workout stats */}
                  <div className="grid grid-cols-4 gap-2 border-b p-3 sm:p-4">
                    <div className="bg-muted/40 rounded-xl px-3 py-2.5">
                      <p className="text-muted-foreground text-[10px] font-medium uppercase">
                        Exercises
                      </p>
                      <p className="mt-0.5 text-sm font-semibold">
                        {workout.exercises.length}
                      </p>
                    </div>

                    <div className="bg-muted/40 rounded-xl px-3 py-2.5">
                      <p className="text-muted-foreground text-[10px] font-medium uppercase">
                        Sets
                      </p>
                      <p className="mt-0.5 text-sm font-semibold">
                        {totalSets}
                      </p>
                    </div>

                    <div className="bg-muted/40 rounded-xl px-3 py-2.5">
                      <p className="text-muted-foreground text-[10px] font-medium uppercase">
                        Volume
                      </p>
                      <p className="mt-0.5 text-sm font-semibold">
                        {formatVolume(volume)}
                      </p>
                    </div>
                    <div className="bg-muted/40 rounded-xl px-3 py-2.5">
                      <p className="text-muted-foreground text-[10px] font-medium uppercase">
                        Effort
                      </p>
                      <p className="mt-0.5 text-sm font-semibold">
                        {effort.toFixed(1)}/5
                      </p>
                    </div>
                  </div>

                  {/* Exercises */}
                  <div className="space-y-2 p-3 sm:p-4">
                    {visibleExercises.map((exerciseEntry, index) => {
                      const exercise = exerciseMap.get(
                        exerciseEntry.exerciseId,
                      );

                      const topWeight = getExerciseTopWeight(exerciseEntry);

                      const topSet = getExerciseTopSet(exerciseEntry);

                      const targetWeight = exercise?.targetWeight ?? null;

                      const progressPercent =
                        targetWeight !== null
                          ? getTargetProgress(topWeight, targetWeight)
                          : null;

                      const warmupSets = getWarmupSetCount(exerciseEntry);

                      const workingSets = getWorkingSetCount(exerciseEntry);

                      const notes =
                        Array.isArray(exercise?.notes) &&
                        exercise.notes.length > 0
                          ? exercise.notes.join(" • ")
                          : "";

                      const hasExerciseDetails =
                        Boolean(exercise?.description) || Boolean(notes);

                      const weightUnit = exercise?.weightTracking.unit ?? "kg";

                      return (
                        <div
                          key={`${workout.id}-${exerciseEntry.exerciseId}-${index}`}
                          className="rounded-xl border p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {exercise?.name ?? exerciseEntry.exerciseId}
                              </p>

                              <p className="text-muted-foreground mt-1 text-[11px]">
                                {workingSets} working set
                                {workingSets === 1 ? "" : "s"} · {warmupSets}{" "}
                                warm-up set
                                {warmupSets === 1 ? "" : "s"}
                              </p>
                            </div>

                            {hasExerciseDetails ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground h-7 shrink-0 px-2 text-[11px]"
                                onClick={() =>
                                  setExerciseDetails({
                                    name:
                                      exercise?.name ??
                                      exerciseEntry.exerciseId,
                                    description: exercise?.description,
                                    notes: notes || undefined,
                                  })
                                }
                              >
                                Details
                              </Button>
                            ) : null}
                          </div>

                          {progressPercent !== null ? (
                            <div className="mt-3">
                              <div className="mb-1.5 flex items-center justify-between gap-2">
                                <div>
                                  <p className="text-[11px] font-medium">
                                    Target progress
                                  </p>

                                  <p className="text-muted-foreground text-[10px]">
                                    {topWeight} / {targetWeight} {weightUnit}
                                  </p>
                                </div>

                                <p className="text-primary text-xs font-semibold">
                                  {progressPercent}%
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
                          ) : topSet ? (
                            <div className="bg-muted/40 mt-3 flex items-center justify-between rounded-lg px-3 py-2">
                              <span className="text-muted-foreground text-[11px]">
                                Top set
                              </span>

                              <span className="text-xs font-semibold">
                                {topSet.weight !== null
                                  ? `${topSet.weight} ${weightUnit}`
                                  : "—"}

                                {topSet.reps !== null
                                  ? ` × ${topSet.reps}`
                                  : ""}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}

                    {workout.exercises.length > INITIAL_EXERCISE_COUNT ? (
                      <button
                        type="button"
                        onClick={() => toggleWorkoutExpanded(workout.id)}
                        className="text-muted-foreground hover:text-foreground flex w-full items-center justify-center gap-1 rounded-xl border border-dashed px-3 py-2.5 text-xs font-medium transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            Show less
                            <ChevronDown className="h-3.5 w-3.5 rotate-180" />
                          </>
                        ) : (
                          <>
                            Show {hiddenExerciseCount} exercise
                            {hiddenExerciseCount === 1 ? "" : "s"}
                            <ChevronDown className="h-3.5 w-3.5" />
                          </>
                        )}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {filteredWorkouts.length === 0 ? (
              <div className="bg-card rounded-2xl border p-10 text-center">
                <div className="bg-muted mx-auto flex h-10 w-10 items-center justify-center rounded-xl">
                  <Filter className="text-muted-foreground h-4 w-4" />
                </div>

                <p className="mt-3 text-sm font-medium">No workouts found</p>

                <p className="text-muted-foreground mt-1 text-xs">
                  Try changing or clearing your filters.
                </p>

                {hasActiveFilters ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={clearFilters}
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    Clear filters
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </>
      )}

      {/* Exercise details */}
      <Sheet
        open={exerciseDetails !== null}
        onOpenChange={(open) => {
          if (!open) {
            setExerciseDetails(null);
          }
        }}
      >
        <SheetContent side="bottom" className="max-h-[80vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{exerciseDetails?.name}</SheetTitle>

            <SheetDescription>
              Exercise information and coaching notes
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 overflow-y-auto px-4 pb-8 text-sm">
            {exerciseDetails?.description ? (
              <div>
                <p className="text-xs font-semibold tracking-wide uppercase">
                  Description
                </p>

                <p className="text-muted-foreground mt-2 leading-relaxed">
                  {exerciseDetails.description}
                </p>
              </div>
            ) : null}

            {exerciseDetails?.notes ? (
              <div>
                <p className="text-xs font-semibold tracking-wide uppercase">
                  Coaching notes
                </p>

                <div className="bg-muted/40 mt-2 rounded-xl border p-3">
                  <p className="text-muted-foreground leading-relaxed">
                    {exerciseDetails.notes}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
