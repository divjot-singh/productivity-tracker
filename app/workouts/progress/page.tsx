"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
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

function getExerciseTopWeight(exerciseEntry: WorkoutExerciseEntry) {
  return exerciseEntry.sets.reduce((max, setEntry) => {
    if (setEntry.weight === null) {
      return max;
    }

    return Math.max(max, setEntry.weight);
  }, 0);
}

function getTargetProgress(topWeight: number, targetWeight: number) {
  if (targetWeight <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((topWeight / targetWeight) * 100));
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

    const getSetCount = (workout: WorkoutEntry) =>
      workout.exercises.reduce(
        (sum, exercise) => sum + exercise.sets.length,
        0,
      );

    const getVolume = (workout: WorkoutEntry) =>
      workout.exercises.reduce(
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

    return filtered.sort((left, right) => {
      switch (sortBy) {
        case "oldest":
          return left.date.localeCompare(right.date);
        case "most-sets":
          return getSetCount(right) - getSetCount(left);
        case "highest-volume":
          return getVolume(right) - getVolume(left);
        case "recent":
        default:
          return right.date.localeCompare(left.date);
      }
    });
  }, [dateQuery, selectedCombinationId, selectedExerciseId, sortBy, workouts]);

  return (
    <div className="space-y-6 pb-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Progress</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Workout history is available now. Exercise-level analytics will follow
          in Phase 3.
        </p>
      </div>

      {loading ? (
        <div className="text-muted-foreground p-6 text-sm">
          Loading workout history...
        </div>
      ) : workouts.length === 0 ? (
        <div className="bg-card rounded-2xl border p-8 text-center">
          <p className="text-muted-foreground text-sm">
            No workouts saved yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border p-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <input
                value={dateQuery}
                onChange={(e) => setDateQuery(e.target.value)}
                placeholder="Filter by date"
                className="border-input bg-background text-foreground focus:ring-primary/40 h-10 w-full rounded-[10px] border px-3 text-sm transition outline-none focus:ring-1"
              />

              <select
                value={selectedExerciseId}
                onChange={(e) => setSelectedExerciseId(e.target.value)}
                className="border-input bg-background text-foreground focus:ring-primary/40 h-10 w-full rounded-[10px] border px-3 text-sm transition outline-none focus:ring-1"
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
                className="border-input bg-background text-foreground focus:ring-primary/40 h-10 w-full rounded-[10px] border px-3 text-sm transition outline-none focus:ring-1"
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
                className="border-input bg-background text-foreground focus:ring-primary/40 h-10 w-full rounded-[10px] border px-3 text-sm transition outline-none focus:ring-1"
              >
                <option value="recent">Most recent</option>
                <option value="oldest">Oldest first</option>
                <option value="most-sets">Most sets</option>
                <option value="highest-volume">Highest volume</option>
              </select>
            </div>
          </div>

          {filteredWorkouts.map((workout) => {
            const totalSets = workout.exercises.reduce(
              (sum, exercise) => sum + exercise.sets.length,
              0,
            );

            const volume = workout.exercises.reduce(
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

            const combinationLabels = workout.combinationIds.map(
              (combinationId) =>
                combinationMap.get(combinationId) ?? combinationId,
            );

            return (
              <div
                key={workout.id}
                className="bg-card overflow-hidden rounded-2xl border"
              >
                <Link
                  href={`/workouts/${workout.date}`}
                  className="hover:bg-accent flex items-center justify-between gap-3 border-b px-4 py-3 transition-colors"
                >
                  <div>
                    <p className="font-medium">{workout.date}</p>
                    <p className="text-muted-foreground text-xs">
                      {totalSets} set{totalSets === 1 ? "" : "s"} • Volume{" "}
                      {Math.round(volume)}
                    </p>
                  </div>

                  <div className="text-muted-foreground inline-flex items-center gap-1 text-xs font-medium">
                    Open insights
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </div>
                </Link>

                <div className="space-y-2 px-4 py-3 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg border px-2 py-1.5">
                      <p className="text-muted-foreground text-[11px]">
                        Exercises
                      </p>
                      <p className="text-xs font-semibold">
                        {workout.exercises.length}
                      </p>
                    </div>
                    <div className="rounded-lg border px-2 py-1.5">
                      <p className="text-muted-foreground text-[11px]">Sets</p>
                      <p className="text-xs font-semibold">{totalSets}</p>
                    </div>
                    <div className="rounded-lg border px-2 py-1.5">
                      <p className="text-muted-foreground text-[11px]">
                        Volume
                      </p>
                      <p className="text-xs font-semibold">
                        {Math.round(volume)}
                      </p>
                    </div>
                  </div>

                  <p className="text-muted-foreground text-xs font-medium uppercase">
                    Combinations
                  </p>

                  <p>
                    {combinationLabels.length > 0
                      ? combinationLabels.join(", ")
                      : "None"}
                  </p>

                  <p className="text-muted-foreground text-xs font-medium uppercase">
                    Exercises
                  </p>

                  <div className="space-y-2">
                    {workout.exercises.length === 0 ? (
                      <p>None</p>
                    ) : (
                      workout.exercises.map((exerciseEntry, index) => {
                        const exercise = exerciseMap.get(
                          exerciseEntry.exerciseId,
                        );
                        const topWeight = getExerciseTopWeight(exerciseEntry);
                        const targetWeight = exercise?.targetWeight ?? null;
                        const progressPercent =
                          targetWeight !== null
                            ? getTargetProgress(topWeight, targetWeight)
                            : null;
                        const notes =
                          Array.isArray(exercise?.notes) &&
                          exercise.notes.length > 0
                            ? exercise.notes.join(" • ")
                            : "";
                        const hasExerciseDetails =
                          Boolean(exercise?.description) || Boolean(notes);
                        const weightUnit =
                          exercise?.weightTracking.unit ?? "kg";

                        return (
                          <div
                            key={`${workout.id}-${exerciseEntry.exerciseId}-${index}`}
                            className="rounded-xl border p-2.5"
                          >
                            <p className="text-sm font-medium">
                              {exercise?.name ?? exerciseEntry.exerciseId}
                            </p>
                            {hasExerciseDetails ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground mt-1 h-auto px-0 text-xs"
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
                                View details
                              </Button>
                            ) : null}

                            {progressPercent !== null ? (
                              <div className="mt-2">
                                <div className="mb-1 flex items-center justify-between gap-2">
                                  <p className="text-[11px] font-medium">
                                    Target progress
                                  </p>
                                  <p className="text-muted-foreground text-[11px]">
                                    {topWeight} / {targetWeight} {weightUnit}
                                  </p>
                                </div>
                                <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                                  <div
                                    className="bg-primary h-full rounded-full"
                                    style={{ width: `${progressPercent}%` }}
                                  />
                                </div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredWorkouts.length === 0 ? (
            <div className="bg-card rounded-2xl border p-8 text-center">
              <p className="text-muted-foreground text-sm">
                No workouts match the current filters.
              </p>
            </div>
          ) : null}
        </div>
      )}

      <Sheet
        open={exerciseDetails !== null}
        onOpenChange={(open) => {
          if (!open) {
            setExerciseDetails(null);
          }
        }}
      >
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{exerciseDetails?.name}</SheetTitle>
            <SheetDescription>
              Exercise information and coaching notes
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3 px-4 pb-6 text-sm">
            {exerciseDetails?.description ? (
              <div>
                <p className="text-foreground font-medium">Description</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {exerciseDetails.description}
                </p>
              </div>
            ) : null}

            {exerciseDetails?.notes ? (
              <div>
                <p className="text-foreground font-medium">Notes</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {exerciseDetails.notes}
                </p>
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
