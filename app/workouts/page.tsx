"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import DateSelector from "@/components/today/DateSelector";
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

interface PreviousExerciseSnapshot {
  date: string;
  sets: Array<{
    weight: number;
    reps: number;
    volume: number;
  }>;
}

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
    isWarmup: false,
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
  const [workoutDates, setWorkoutDates] = useState<Set<string>>(new Set());
  const [allWorkouts, setAllWorkouts] = useState<WorkoutEntry[]>([]);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
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

  useEffect(() => {
    async function loadWorkoutDates() {
      if (!user) {
        return;
      }

      try {
        const workouts = await apiRequest<WorkoutEntry[]>(
          user,
          "/api/workouts",
        );
        setWorkoutDates(new Set(workouts.map((item) => item.date)));
        setAllWorkouts(workouts);
      } catch (error) {
        console.error(error);
      }
    }

    loadWorkoutDates();
  }, [user]);

  const exerciseMap = useMemo(() => {
    return new Map(exercises.map((exercise) => [exercise.id, exercise]));
  }, [exercises]);

  const combinationMap = useMemo(() => {
    return new Map(
      combinations.map((combination) => [combination.id, combination]),
    );
  }, [combinations]);

  const selectedCombination = useMemo(() => {
    const selectedId = workout.combinationIds[0];
    if (!selectedId) {
      return null;
    }

    return combinationMap.get(selectedId) ?? null;
  }, [combinationMap, workout.combinationIds]);

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

  const previousExerciseMap = useMemo(() => {
    const previousMap = new Map<string, PreviousExerciseSnapshot>();

    for (const exerciseEntry of workout.exercises) {
      if (previousMap.has(exerciseEntry.exerciseId)) {
        continue;
      }

      const previousWorkout = allWorkouts
        .filter((workoutItem) => workoutItem.date < selectedDate)
        .sort((left, right) => right.date.localeCompare(left.date))
        .find((workoutItem) =>
          workoutItem.exercises.some(
            (item) => item.exerciseId === exerciseEntry.exerciseId,
          ),
        );

      if (!previousWorkout) {
        continue;
      }

      const previousExercise = previousWorkout.exercises.find(
        (item) => item.exerciseId === exerciseEntry.exerciseId,
      );

      if (!previousExercise) {
        continue;
      }

      const nonWarmupSets = previousExercise.sets
        .filter(
          (setEntry) =>
            !setEntry.isWarmup &&
            setEntry.weight !== null &&
            setEntry.reps !== null,
        )
        .map((setEntry) => ({
          weight: setEntry.weight as number,
          reps: setEntry.reps as number,
          volume: (setEntry.weight as number) * (setEntry.reps as number),
        }));

      if (nonWarmupSets.length === 0) {
        continue;
      }

      previousMap.set(exerciseEntry.exerciseId, {
        date: previousWorkout.date,
        sets: nonWarmupSets,
      });
    }

    return previousMap;
  }, [allWorkouts, selectedDate, workout.exercises]);

  useEffect(() => {
    if (workout.exercises.length === 0) {
      setActiveExerciseIndex(0);
      return;
    }

    setActiveExerciseIndex((current) =>
      Math.min(current, Math.max(0, workout.exercises.length - 1)),
    );
  }, [workout.exercises.length]);

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

  async function handleSave(successMessage = "Workout saved") {
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
      setAllWorkouts((prev) => {
        const filtered = prev.filter((entry) => entry.date !== selectedDate);
        return [payload, ...filtered].sort((left, right) =>
          right.date.localeCompare(left.date),
        );
      });
      setWorkoutDates((prev) => new Set(prev).add(selectedDate));
      toast.success(successMessage);
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
      setAllWorkouts((prev) =>
        prev.filter((entry) => entry.date !== selectedDate),
      );
      setWorkoutDates((prev) => {
        const next = new Set(prev);
        next.delete(selectedDate);
        return next;
      });
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
  const totalWarmupSets = workout.exercises.reduce(
    (sum, exercise) =>
      sum + exercise.sets.filter((setEntry) => setEntry.isWarmup).length,
    0,
  );
  const selectedCombinationId = workout.combinationIds[0] ?? "";
  const activeExerciseEntry =
    workout.exercises.length > 0
      ? workout.exercises[
          Math.min(activeExerciseIndex, workout.exercises.length - 1)
        ]
      : null;
  const activeExercise = activeExerciseEntry
    ? exerciseMap.get(activeExerciseEntry.exerciseId)
    : null;
  const activeExerciseNotes =
    Array.isArray(activeExercise?.notes) && activeExercise.notes.length > 0
      ? activeExercise.notes.join(" • ")
      : "";
  const activePreviousSnapshot = activeExerciseEntry
    ? previousExerciseMap.get(activeExerciseEntry.exerciseId)
    : null;
  const activeWeightUnit = activeExercise?.weightTracking.unit ?? "kg";
  const activeTopWeight = activeExerciseEntry
    ? getExerciseTopWeight(activeExerciseEntry)
    : 0;
  const activeTargetWeight = activeExercise?.targetWeight ?? null;
  const activeProgressPercent =
    activeTargetWeight !== null
      ? getTargetProgress(activeTopWeight, activeTargetWeight)
      : null;

  return (
    <div className="flex h-[calc(100dvh-14.5rem)] min-h-0 flex-col overflow-hidden">
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
                  <DateSelector
                    selectedDate={selectedDate}
                    hasEntry={hasSavedWorkout}
                    entryDates={workoutDates}
                    onChange={setSelectedDate}
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

                <div className="rounded-xl border px-3 py-2 sm:col-span-2">
                  <p className="text-muted-foreground text-xs">Warm-up sets</p>
                  <p className="text-sm font-semibold">{totalWarmupSets}</p>
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

                {selectedCombination ? (
                  <div className="mt-2 space-y-2 rounded-xl border p-3">
                    {selectedCombination.description ? (
                      <div>
                        <p className="text-xs font-semibold">Day overview</p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {selectedCombination.description}
                        </p>
                      </div>
                    ) : null}

                    {selectedCombination.coachingNotes ? (
                      <div>
                        <p className="text-xs font-semibold">Coaching notes</p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {selectedCombination.coachingNotes}
                        </p>
                      </div>
                    ) : null}

                    {selectedCombination.warmupGuidance ? (
                      <div>
                        <p className="text-xs font-semibold">
                          Warm-up guidance
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {selectedCombination.warmupGuidance}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </section>

            <section className="space-y-4">
              {workout.exercises.length > 0 ? (
                <div className="bg-card space-y-3 rounded-2xl border p-3">
                  <div>
                    <p className="text-xs font-medium">Exercise flow</p>
                    <p className="text-muted-foreground text-xs">
                      Exercise {activeExerciseIndex + 1} of{" "}
                      {workout.exercises.length} -{" "}
                      {exerciseMap.get(
                        workout.exercises[activeExerciseIndex]?.exerciseId ??
                          "",
                      )?.name ??
                        workout.exercises[activeExerciseIndex]?.exerciseId}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {workout.exercises.map((exerciseEntry, exerciseIndex) => (
                      <Button
                        key={`${exerciseEntry.exerciseId}-${exerciseIndex}`}
                        type="button"
                        variant={
                          exerciseIndex === activeExerciseIndex
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => setActiveExerciseIndex(exerciseIndex)}
                      >
                        {exerciseIndex + 1}
                      </Button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={activeExerciseIndex <= 0}
                      onClick={() =>
                        setActiveExerciseIndex((current) =>
                          Math.max(0, current - 1),
                        )
                      }
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={
                        activeExerciseIndex >= workout.exercises.length - 1
                      }
                      onClick={() =>
                        setActiveExerciseIndex((current) =>
                          Math.min(workout.exercises.length - 1, current + 1),
                        )
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : null}

              {workout.exercises.length === 0 ? (
                <div className="bg-card text-muted-foreground rounded-2xl border p-8 text-center text-sm">
                  Select combinations or add exercises manually to start
                  today&apos;s workout.
                </div>
              ) : activeExerciseEntry ? (
                <div className="bg-card rounded-2xl border p-4">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">
                        {activeExercise?.name ?? activeExerciseEntry.exerciseId}
                      </h2>
                      <p className="text-muted-foreground text-xs">
                        {activeExercise?.categories.join(", ") ?? ""}
                      </p>
                      {Boolean(activeExercise?.description) ||
                      Boolean(activeExerciseNotes) ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground mt-1 h-auto px-0 text-xs"
                          onClick={() =>
                            setExerciseDetails({
                              name:
                                activeExercise?.name ??
                                activeExerciseEntry.exerciseId,
                              description: activeExercise?.description,
                              notes: activeExerciseNotes || undefined,
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
                        disabled={activeExerciseIndex <= 0}
                        onClick={() => moveExercise(activeExerciseIndex, -1)}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={
                          activeExerciseIndex >= workout.exercises.length - 1
                        }
                        onClick={() => moveExercise(activeExerciseIndex, 1)}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeExercise(activeExerciseIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {activeProgressPercent !== null ? (
                    <div className="mb-4 rounded-xl border p-3">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="text-xs font-medium">Target Progress</p>
                        <p className="text-muted-foreground text-xs">
                          {activeTopWeight} / {activeTargetWeight}{" "}
                          {activeWeightUnit}
                        </p>
                      </div>
                      <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                        <div
                          className="bg-primary h-full rounded-full transition-all"
                          style={{ width: `${activeProgressPercent}%` }}
                        />
                      </div>
                      <p className="text-muted-foreground mt-1 text-[11px]">
                        {activeProgressPercent}% of target
                      </p>
                    </div>
                  ) : null}

                  {activePreviousSnapshot ? (
                    <div className="mb-4 rounded-xl border p-3">
                      <p className="text-xs font-medium">
                        Previous working sets
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        Date: {activePreviousSnapshot.date}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Weights:{" "}
                        {activePreviousSnapshot.sets
                          .map((setEntry) => setEntry.weight)
                          .join(", ")}
                      </p>
                      <div className="mt-2 space-y-1">
                        {activePreviousSnapshot.sets.map(
                          (setEntry, setIndex) => (
                            <p
                              key={`${activePreviousSnapshot.date}-${setIndex}`}
                              className="text-muted-foreground text-xs"
                            >
                              Set {setIndex + 1}: {setEntry.weight}{" "}
                              {activeWeightUnit} x {setEntry.reps} reps (volume{" "}
                              {setEntry.volume})
                            </p>
                          ),
                        )}
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-3">
                    {activeExerciseEntry.sets.map((setEntry, setIndex) => (
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
                              updateSet(activeExerciseIndex, setIndex, {
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
                              updateSet(activeExerciseIndex, setIndex, {
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
                              updateSet(activeExerciseIndex, setIndex, {
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
                              removeSet(activeExerciseIndex, setIndex)
                            }
                          >
                            Remove
                          </Button>
                        </div>

                        <label className="text-muted-foreground inline-flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={setEntry.isWarmup}
                            onChange={(e) =>
                              updateSet(activeExerciseIndex, setIndex, {
                                isWarmup: e.target.checked,
                              })
                            }
                          />
                          Mark as warm-up set
                        </label>

                        {getSetErrors(setEntry).length > 0 ? (
                          <div className="text-muted-foreground space-y-1 text-xs">
                            {getSetErrors(setEntry).map((error) => (
                              <p key={error}>{error}</p>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addSet(activeExerciseIndex)}
                      >
                        <Plus className="mr-1.5 h-4 w-4" />
                        Add Set
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          handleSave(
                            `${activeExercise?.name ?? "Exercise"} saved`,
                          )
                        }
                      >
                        Save Exercise
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={
                          activeExerciseIndex >= workout.exercises.length - 1
                        }
                        onClick={() =>
                          setActiveExerciseIndex((current) =>
                            Math.min(workout.exercises.length - 1, current + 1),
                          )
                        }
                      >
                        Save and Next
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Exercise Notes</Label>
                      <Textarea
                        value={activeExerciseEntry.notes ?? ""}
                        onChange={(e) =>
                          updateExerciseEntry(activeExerciseIndex, {
                            notes: e.target.value,
                          })
                        }
                        placeholder="Optional exercise notes"
                      />
                    </div>
                  </div>
                </div>
              ) : null}
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
            {workoutValidationErrors.length > 0 ? (
              <p className="text-muted-foreground mb-2 text-xs">
                Fix highlighted field issues before saving.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                className="h-11 flex-1"
                onClick={() => handleSave()}
                disabled={saving || workoutValidationErrors.length > 0}
              >
                {saving ? "Saving..." : "Save Workout"}
              </Button>

              <Button
                className="h-11"
                variant="secondary"
                onClick={() => handleSave("Workout ended and saved")}
                disabled={saving || workoutValidationErrors.length > 0}
              >
                End Workout
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
        <div className="text-muted-foreground p-6 text-sm">
          Loading workout...
        </div>
      }
    >
      <WorkoutsLogPageContent />
    </Suspense>
  );
}
