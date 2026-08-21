"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { EFFORT_OPTIONS } from "@/lib/workouts/constants";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { apiRequest } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { validateWorkout } from "@/lib/workouts/normalize";
import {
  ExerciseDefinition,
  WorkoutCombination,
  WorkoutEntry,
  WorkoutExerciseEntry,
  WorkoutSetEntry,
} from "@/models/workout";

const NATIVE_SELECT_CLASS =
  "border-input bg-background text-foreground focus:ring-primary/40 h-10 w-full appearance-none rounded-[10px] border px-3 text-sm transition outline-none focus:ring-1";

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function createDefaultSet(): WorkoutSetEntry {
  return {
    weight: null,
    reps: null,
    effort: 3,
  };
}

function createExerciseEntry(exerciseId: string): WorkoutExerciseEntry {
  return {
    exerciseId,
    sets: [createDefaultSet()],
  };
}

function createEmptyWorkout(date: string): WorkoutEntry {
  return {
    id: date,
    date,
    combinationIds: [],
    exercises: [],
  };
}

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

function WorkoutsLogPageContent() {
  const { user } = useRequireAuth();
  const searchParams = useSearchParams();

  const [selectedDate, setSelectedDate] = useState(getTodayDateString);
  const [workout, setWorkout] = useState<WorkoutEntry>(
    createEmptyWorkout(getTodayDateString()),
  );
  const [combinations, setCombinations] = useState<WorkoutCombination[]>([]);
  const [exercises, setExercises] = useState<ExerciseDefinition[]>([]);
  const [manualExerciseId, setManualExerciseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasSavedWorkout, setHasSavedWorkout] = useState(false);
  const [exerciseDetails, setExerciseDetails] = useState<{
    name: string;
    description?: string;
    notes?: string;
  } | null>(null);

  useEffect(() => {
    const routeDate = searchParams.get("date");

    if (routeDate && routeDate !== selectedDate) {
      setSelectedDate(routeDate);
    }
  }, [searchParams, selectedDate]);

  useEffect(() => {
    async function load() {
      if (!user) {
        return;
      }

      try {
        setLoading(true);

        const [combinationData, exerciseData, workoutData] = await Promise.all([
          apiRequest<WorkoutCombination[]>(
            user,
            "/api/combinations?includeInactive=true",
          ),
          apiRequest<ExerciseDefinition[]>(
            user,
            "/api/exercises?includeInactive=true",
          ),
          apiRequest<WorkoutEntry | null>(
            user,
            `/api/workouts/${selectedDate}`,
          ),
        ]);

        const activeExercises = (exerciseData ?? []).filter(
          (exercise) => exercise.active,
        );

        setCombinations(
          (combinationData ?? []).filter((combination) => combination.active),
        );
        setExercises(activeExercises);
        setWorkout(workoutData ?? createEmptyWorkout(selectedDate));
        setHasSavedWorkout(Boolean(workoutData));
      } catch (error) {
        console.error(error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load workout data",
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [selectedDate, user]);

  const exerciseMap = useMemo(() => {
    return new Map(exercises.map((exercise) => [exercise.id, exercise]));
  }, [exercises]);

  const availableManualExercises = useMemo(() => {
    const existingIds = new Set(
      workout.exercises.map((exercise) => exercise.exerciseId),
    );
    return exercises.filter((exercise) => !existingIds.has(exercise.id));
  }, [exercises, workout.exercises]);

  const workoutValidationErrors = useMemo(() => {
    return validateWorkout({
      ...workout,
      id: selectedDate,
      date: selectedDate,
    });
  }, [selectedDate, workout]);

  function getSetErrors(setEntry: WorkoutSetEntry): string[] {
    const errors: string[] = [];

    if (setEntry.weight !== null && setEntry.weight < 0) {
      errors.push("Weight must be non-negative.");
    }

    if (setEntry.reps === null || setEntry.reps <= 0) {
      errors.push("Reps must be greater than 0.");
    }

    if (setEntry.effort === null) {
      errors.push("Effort is required.");
    }

    return errors;
  }

  function updateCombination(combinationId: string) {
    if (!combinationId) {
      setWorkout((prev) => ({
        ...prev,
        combinationIds: [],
      }));
      return;
    }

    const selected = combinations.find(
      (combination) => combination.id === combinationId,
    );

    setWorkout((prev) => {
      if (!selected) {
        return {
          ...prev,
          combinationIds: [combinationId],
        };
      }

      const existingIds = new Set(
        prev.exercises.map((exercise) => exercise.exerciseId),
      );
      const nextExercises = [...prev.exercises];

      for (const exerciseId of selected.exerciseIds) {
        if (!existingIds.has(exerciseId)) {
          nextExercises.push(createExerciseEntry(exerciseId));
        }
      }

      return {
        ...prev,
        combinationIds: [combinationId],
        exercises: nextExercises,
      };
    });
  }

  function addManualExercise() {
    if (!manualExerciseId) {
      return;
    }

    setWorkout((prev) => ({
      ...prev,
      exercises: [...prev.exercises, createExerciseEntry(manualExerciseId)],
    }));
    setManualExerciseId("");
  }

  function removeExercise(index: number) {
    setWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.filter(
        (_, currentIndex) => currentIndex !== index,
      ),
    }));
  }

  function moveExercise(index: number, direction: -1 | 1) {
    setWorkout((prev) => {
      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= prev.exercises.length) {
        return prev;
      }

      const nextExercises = [...prev.exercises];
      const [item] = nextExercises.splice(index, 1);
      nextExercises.splice(nextIndex, 0, item);

      return {
        ...prev,
        exercises: nextExercises,
      };
    });
  }

  function updateExerciseEntry(
    index: number,
    partial: Partial<WorkoutExerciseEntry>,
  ) {
    setWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise, currentIndex) =>
        currentIndex === index ? { ...exercise, ...partial } : exercise,
      ),
    }));
  }

  function addSet(exerciseIndex: number) {
    setWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise, currentIndex) =>
        currentIndex === exerciseIndex
          ? { ...exercise, sets: [...exercise.sets, createDefaultSet()] }
          : exercise,
      ),
    }));
  }

  function updateSet(
    exerciseIndex: number,
    setIndex: number,
    partial: Partial<WorkoutSetEntry>,
  ) {
    setWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise, currentExerciseIndex) => {
        if (currentExerciseIndex !== exerciseIndex) {
          return exercise;
        }

        return {
          ...exercise,
          sets: exercise.sets.map((setEntry, currentSetIndex) =>
            currentSetIndex === setIndex
              ? { ...setEntry, ...partial }
              : setEntry,
          ),
        };
      }),
    }));
  }

  function removeSet(exerciseIndex: number, setIndex: number) {
    setWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise, currentExerciseIndex) => {
        if (currentExerciseIndex !== exerciseIndex) {
          return exercise;
        }

        const nextSets = exercise.sets.filter(
          (_, currentSetIndex) => currentSetIndex !== setIndex,
        );

        return {
          ...exercise,
          sets: nextSets.length > 0 ? nextSets : [createDefaultSet()],
        };
      }),
    }));
  }

  async function handleSave() {
    if (!user) {
      return;
    }

    try {
      if (workoutValidationErrors.length > 0) {
        toast.error(workoutValidationErrors[0]);
        return;
      }

      setSaving(true);

      const payload: WorkoutEntry = {
        ...workout,
        id: selectedDate,
        date: selectedDate,
      };

      await apiRequest(user, `/api/workouts/${selectedDate}`, {
        method: "PUT",
        body: payload,
      });

      setHasSavedWorkout(true);
      toast.success("Workout saved");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save workout",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteWorkout() {
    if (!user) {
      return;
    }

    try {
      await apiRequest(user, `/api/workouts/${selectedDate}`, {
        method: "DELETE",
      });

      setWorkout(createEmptyWorkout(selectedDate));
      setHasSavedWorkout(false);
      toast.success("Workout deleted");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete workout",
      );
    }
  }

  const totalSets = workout.exercises.reduce(
    (sum, exercise) => sum + exercise.sets.length,
    0,
  );
  const selectedCombinationId = workout.combinationIds[0] ?? "";

  return (
    <div className="flex h-[calc(100dvh-14.5rem)] min-h-0 flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]">
      {loading ? (
        <div className="text-muted-foreground p-6 text-sm">
          Loading workout...
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-4">
            <section className="bg-card rounded-2xl border p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="text-muted-foreground rounded-xl border px-3 py-2 text-xs">
                    {hasSavedWorkout
                      ? "Existing workout loaded"
                      : "New workout for this date"}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border px-3 py-2">
                  <p className="text-muted-foreground text-xs">Exercises</p>
                  <p className="text-sm font-semibold">
                    {workout.exercises.length}
                  </p>
                </div>

                <div className="rounded-xl border px-3 py-2">
                  <p className="text-muted-foreground text-xs">Total sets</p>
                  <p className="text-sm font-semibold">{totalSets}</p>
                </div>
              </div>

              <div className="mt-3">
                <Link
                  href={`/workouts/${selectedDate}`}
                  className="text-primary text-xs font-medium underline-offset-2 hover:underline"
                >
                  View this date insights
                </Link>
              </div>
            </section>

            <section className="bg-card rounded-2xl border p-4">
              <Label className="mb-2 block">Workout Combination</Label>
              <p className="text-muted-foreground mb-3 text-xs">
                Select one combination. Add anything extra later from Add
                Exercise.
              </p>
              <div className="space-y-2">
                <select
                  className={NATIVE_SELECT_CLASS}
                  value={selectedCombinationId}
                  onChange={(e) => updateCombination(e.target.value)}
                >
                  <option value="">No combination selected</option>
                  {combinations.map((combination) => (
                    <option key={combination.id} value={combination.id}>
                      {combination.name} ({combination.exerciseIds.length})
                    </option>
                  ))}
                </select>
                {selectedCombinationId ? (
                  <p className="text-muted-foreground text-xs">
                    Base exercises loaded. You can reorder/remove or add custom
                    exercises.
                  </p>
                ) : null}
              </div>
            </section>

            <section className="space-y-4">
              {workoutValidationErrors.length > 0 ? (
                <div className="border-destructive/50 bg-destructive/5 rounded-2xl border p-4">
                  <p className="text-destructive text-sm font-medium">
                    Fix these workout issues before saving:
                  </p>
                  <div className="text-destructive mt-2 space-y-1 text-sm">
                    {workoutValidationErrors.map((error) => (
                      <p key={error}>{error}</p>
                    ))}
                  </div>
                </div>
              ) : null}

              {workout.exercises.length === 0 ? (
                <div className="bg-card text-muted-foreground rounded-2xl border p-8 text-center text-sm">
                  Select combinations or add exercises manually to start
                  today&apos;s workout.
                </div>
              ) : (
                workout.exercises.map((exerciseEntry, exerciseIndex) => {
                  const exercise = exerciseMap.get(exerciseEntry.exerciseId);
                  const topWeight = getExerciseTopWeight(exerciseEntry);
                  const targetWeight = exercise?.targetWeight ?? null;
                  const progressPercent =
                    targetWeight !== null
                      ? getTargetProgress(topWeight, targetWeight)
                      : null;
                  const exerciseNotes =
                    Array.isArray(exercise?.notes) && exercise.notes.length > 0
                      ? exercise.notes.join(" • ")
                      : "";
                  const hasExerciseDetails =
                    Boolean(exercise?.description) || Boolean(exerciseNotes);
                  const weightUnit = exercise?.weightTracking.unit ?? "kg";

                  return (
                    <div
                      key={`${exerciseEntry.exerciseId}-${exerciseIndex}`}
                      className="bg-card rounded-2xl border p-4"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <h2 className="font-semibold">
                            {exercise?.name ?? exerciseEntry.exerciseId}
                          </h2>
                          <p className="text-muted-foreground text-xs">
                            {exercise?.categories.join(", ") ?? ""}
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
                                    exercise?.name ?? exerciseEntry.exerciseId,
                                  description: exercise?.description,
                                  notes: exerciseNotes || undefined,
                                })
                              }
                            >
                              View details
                            </Button>
                          ) : null}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => moveExercise(exerciseIndex, -1)}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => moveExercise(exerciseIndex, 1)}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeExercise(exerciseIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {progressPercent !== null ? (
                        <div className="mb-4 rounded-xl border p-3">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <p className="text-xs font-medium">
                              Target Progress
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {topWeight} / {targetWeight} {weightUnit}
                            </p>
                          </div>
                          <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                            <div
                              className="bg-primary h-full rounded-full transition-all"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <p className="text-muted-foreground mt-1 text-[11px]">
                            {progressPercent}% of target
                          </p>
                        </div>
                      ) : null}

                      <div className="space-y-3">
                        {exerciseEntry.sets.map((setEntry, setIndex) => (
                          <div
                            key={setIndex}
                            className="space-y-2 rounded-xl border p-3"
                          >
                            <div className="grid gap-3 sm:grid-cols-[80px_1fr_1fr_1fr_auto]">
                              <div className="text-muted-foreground flex items-center text-sm font-medium">
                                Set {setIndex + 1}
                              </div>

                              <Input
                                type="number"
                                min={0}
                                value={setEntry.weight ?? ""}
                                onChange={(e) =>
                                  updateSet(exerciseIndex, setIndex, {
                                    weight:
                                      e.target.value === ""
                                        ? null
                                        : Number(e.target.value),
                                  })
                                }
                                placeholder="Weight"
                              />

                              <Input
                                type="number"
                                min={1}
                                value={setEntry.reps ?? ""}
                                onChange={(e) =>
                                  updateSet(exerciseIndex, setIndex, {
                                    reps:
                                      e.target.value === ""
                                        ? null
                                        : Number(e.target.value),
                                  })
                                }
                                placeholder="Reps"
                              />

                              <select
                                className={NATIVE_SELECT_CLASS}
                                value={setEntry.effort ?? ""}
                                onChange={(e) =>
                                  updateSet(exerciseIndex, setIndex, {
                                    effort:
                                      e.target.value === ""
                                        ? null
                                        : (Number(
                                            e.target.value,
                                          ) as WorkoutSetEntry["effort"]),
                                  })
                                }
                              >
                                <option value="">Effort</option>
                                {EFFORT_OPTIONS.map((effort) => (
                                  <option key={effort} value={effort}>
                                    {effort}
                                  </option>
                                ))}
                              </select>

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  removeSet(exerciseIndex, setIndex)
                                }
                              >
                                Remove
                              </Button>
                            </div>

                            {getSetErrors(setEntry).length > 0 ? (
                              <div className="text-destructive space-y-1 text-xs">
                                {getSetErrors(setEntry).map((error) => (
                                  <p key={error}>{error}</p>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))}

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addSet(exerciseIndex)}
                        >
                          <Plus className="mr-1.5 h-4 w-4" />
                          Add Set
                        </Button>

                        <div className="space-y-2">
                          <Label>Exercise Notes</Label>
                          <Textarea
                            value={exerciseEntry.notes ?? ""}
                            onChange={(e) =>
                              updateExerciseEntry(exerciseIndex, {
                                notes: e.target.value,
                              })
                            }
                            placeholder="Optional exercise notes"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </section>

            <section className="bg-card rounded-2xl border p-4">
              <div className="space-y-2">
                <Label>Workout Notes</Label>
                <Textarea
                  value={workout.notes ?? ""}
                  onChange={(e) =>
                    setWorkout((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Optional notes for the day"
                />
              </div>
            </section>

            <section className="bg-card rounded-2xl border p-4">
              <Label className="mb-3 block">Add Exercise</Label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  className={cn(NATIVE_SELECT_CLASS, "sm:flex-1")}
                  value={manualExerciseId}
                  onChange={(e) => setManualExerciseId(e.target.value)}
                >
                  <option value="">Select an exercise</option>
                  {availableManualExercises.map((exercise) => (
                    <option key={exercise.id} value={exercise.id}>
                      {exercise.name}
                    </option>
                  ))}
                </select>

                <Button
                  type="button"
                  onClick={addManualExercise}
                  disabled={!manualExerciseId}
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  Add
                </Button>
              </div>
            </section>
          </div>

          <div className="bg-background shrink-0 border-t pt-3 pb-[calc(env(safe-area-inset-bottom))] lg:pb-1">
            <div className="flex flex-wrap gap-2">
              <Button
                className="h-11 flex-1"
                onClick={handleSave}
                disabled={saving || workoutValidationErrors.length > 0}
              >
                {saving ? "Saving..." : "Save Workout"}
              </Button>

              {hasSavedWorkout ? (
                <Button
                  className="h-11"
                  variant="destructive"
                  onClick={handleDeleteWorkout}
                >
                  Delete Workout
                </Button>
              ) : null}
            </div>
          </div>

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
        </>
      )}
    </div>
  );
}

export default function WorkoutsLogPage() {
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground p-6 text-sm">Loading workout...</div>
      }
    >
      <WorkoutsLogPageContent />
    </Suspense>
  );
}
