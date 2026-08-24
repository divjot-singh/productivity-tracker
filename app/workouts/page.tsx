"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ChartNoAxesCombined,
  Check,
  ChevronRight,
  Info,
  Plus,
  Save,
  Trash,
  Trash2,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

import DateSelector from "@/components/today/DateSelector";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { apiRequest } from "@/lib/api/client";
import {
  formatExerciseEquipmentLabel,
  titleCaseWorkoutValue,
} from "@/lib/workouts/constants";
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

function hasRecordedSet(setEntry: WorkoutSetEntry) {
  return setEntry.weight !== null && setEntry.reps !== null;
}

function WorkoutsLogPageContent() {
  const { user } = useRequireAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedDate, setSelectedDate] = useState(getTodayDateString);
  const [workout, setWorkout] = useState<WorkoutEntry>(
    createEmptyWorkout(getTodayDateString()),
  );
  const [combinations, setCombinations] = useState<WorkoutCombination[]>([]);
  const [exercises, setExercises] = useState<ExerciseDefinition[]>([]);
  const [manualExerciseId, setManualExerciseId] = useState("");
  const [exerciseQuery, setExerciseQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasSavedWorkout, setHasSavedWorkout] = useState(false);
  const [workoutDates, setWorkoutDates] = useState<Set<string>>(new Set());
  const [allWorkouts, setAllWorkouts] = useState<WorkoutEntry[]>([]);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [isSummarySheetOpen, setIsSummarySheetOpen] = useState(false);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [isAddExerciseSheetOpen, setIsAddExerciseSheetOpen] = useState(false);
  const [isEffortGuideOpen, setIsEffortGuideOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [exerciseToRemoveIndex, setExerciseToRemoveIndex] = useState<
    number | null
  >(null);
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

  const searchableManualExercises = useMemo(() => {
    const normalizedQuery = exerciseQuery.trim().toLowerCase();

    if (normalizedQuery.length === 0) {
      return availableManualExercises;
    }

    return availableManualExercises.filter((exercise) => {
      const haystack = [
        exercise.name,
        exercise.description,
        exercise.equipment,
        exercise.type,
        ...(exercise.categories ?? []),
        ...(exercise.muscleGroups ?? []),
        ...(exercise.notes ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [availableManualExercises, exerciseQuery]);

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

  async function addManualExercise(exerciseId = manualExerciseId) {
    if (!exerciseId) {
      return false;
    }

    const saved = await handleSave("Workout saved");

    if (!saved) {
      return false;
    }

    const insertIndex = Math.min(
      activeExerciseIndex + 1,
      workout.exercises.length,
    );

    setWorkout((prev) => ({
      ...prev,
      exercises: [
        ...prev.exercises.slice(0, insertIndex),
        createExerciseEntry(exerciseId),
        ...prev.exercises.slice(insertIndex),
      ],
    }));
    setActiveExerciseIndex(insertIndex);
    setManualExerciseId("");
    return true;
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
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= workout.exercises.length) {
      return;
    }

    setWorkout((prev) => {
      const nextExercises = [...prev.exercises];
      const [item] = nextExercises.splice(index, 1);
      nextExercises.splice(nextIndex, 0, item);

      return {
        ...prev,
        exercises: nextExercises,
      };
    });

    // Keep the moved exercise in view by following it to its new index.
    setActiveExerciseIndex(nextIndex);
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
      return false;
    }

    try {
      if (workoutValidationErrors.length > 0) {
        toast.error(workoutValidationErrors[0]);
        return false;
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
      return true;
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save workout",
      );
      return false;
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

  async function handleSaveAndAddSet() {
    if (!activeExerciseEntry) {
      return;
    }

    await handleSave("Set added and workout saved");
    addSet(activeExerciseIndex);
  }

  async function handleSaveAndNext() {
    await handleSave(
      `${activeExercise?.name ?? "Exercise"} saved. Moved to next exercise.`,
    );

    setActiveExerciseIndex((current) =>
      Math.min(workout.exercises.length - 1, current + 1),
    );
  }

  const recordedExerciseCount = workout.exercises.filter((exercise) =>
    exercise.sets.some(hasRecordedSet),
  ).length;
  const recordedSetCount = workout.exercises.reduce(
    (sum, exercise) => sum + exercise.sets.filter(hasRecordedSet).length,
    0,
  );
  const totalWarmupSets = workout.exercises.reduce(
    (sum, exercise) =>
      sum + exercise.sets.filter((setEntry) => setEntry.isWarmup).length,
    0,
  );
  const selectedCombinationId = workout.combinationIds[0] ?? "";
  const hasSelectedCombination = selectedCombinationId.length > 0;
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
  const activeSetCount = activeExerciseEntry?.sets.length ?? 0;
  const activeRecordedSetCount = activeExerciseEntry
    ? activeExerciseEntry.sets.filter(hasRecordedSet).length
    : 0;
  const activeWarmupSetCount = activeExerciseEntry
    ? activeExerciseEntry.sets.filter((setEntry) => setEntry.isWarmup).length
    : 0;

  const activeExerciseRepRange = activeExercise?.progression.repRange;
  const effortGuide = [
    { effort: 1 as const, label: "Very easy", rir: "5+ RIR" },
    { effort: 2 as const, label: "Easy", rir: "4–5 RIR" },
    { effort: 3 as const, label: "Moderate", rir: "3–4 RIR" },
    { effort: 4 as const, label: "Hard", rir: "1–2 RIR" },
    { effort: 5 as const, label: "Max", rir: "0–1 RIR" },
  ];
  const summaryCards = [
    { label: "Recorded exercises", value: recordedExerciseCount },
    { label: "Recorded sets", value: recordedSetCount },
    { label: "Warm-up sets", value: totalWarmupSets },
    { label: "Status", value: hasSavedWorkout ? "Loaded" : "New" },
  ];

  return (
    <div className="flex h-[calc(100dvh-11rem)] min-h-0 flex-col overflow-hidden">
      {loading ? (
        <div className="text-muted-foreground p-6 text-sm">
          Loading workout...
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-4">
            <section className="bg-card rounded-2xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-left">
                  <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    Workout log
                  </p>
                  <h1 className="text-lg font-semibold tracking-tight">
                    {selectedDate}
                  </h1>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => setIsNotesDialogOpen(true)}
                  >
                    <Save className="h-4 w-4" />
                  </Button>

                  {hasSavedWorkout ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      onClick={() => setIsDeleteDialogOpen(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </div>

              {/* Exercise progress */}
              <div className="bg-background/60 mt-4 rounded-xl border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                      Workout progress
                    </p>

                    <p className="mt-0.5 text-sm font-semibold">
                      {recordedExerciseCount} of {workout.exercises.length}{" "}
                      exercises
                    </p>
                  </div>

                  <span className="text-muted-foreground text-xs">
                    {recordedSetCount} sets
                  </span>
                </div>

                {/* Exercise progress */}
                <div className="mt-3 flex items-center gap-1.5">
                  {workout.exercises.map((exercise, index) => {
                    const isCompleted = exercise.sets.some(hasRecordedSet);

                    return (
                      <div
                        key={`${exercise.exerciseId}-${index}`}
                        className={cn(
                          "h-2 flex-1 rounded-full transition-colors",
                          isCompleted ? "bg-primary" : "bg-muted",
                        )}
                      />
                    );
                  })}
                </div>

                <div className="text-muted-foreground mt-3 flex items-center justify-between text-[11px]">
                  <span>{recordedSetCount} sets completed</span>

                  <span>
                    {totalWarmupSets} warm-up{totalWarmupSets === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              {/* Date navigation + insights */}
              <div className="mt-4 flex flex-col items-center justify-center gap-3">
                <div className="min-w-0 flex-1">
                  <Label className="text-muted-foreground mb-2 block text-xs">
                    Workout date
                  </Label>

                  <DateSelector
                    selectedDate={selectedDate}
                    hasEntry={hasSavedWorkout}
                    entryDates={workoutDates}
                    onChange={setSelectedDate}
                    subContent={
                      <Link
                        href={`/workouts/${selectedDate}`}
                        aria-label="View date insights"
                        title="View date insights"
                        className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border transition-colors"
                      >
                        <ChartNoAxesCombined className="h-4 w-4" />
                      </Link>
                    }
                  />
                </div>
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
                  <details className="mt-2 rounded-xl border p-3">
                    <summary className="cursor-pointer text-xs font-semibold">
                      Combination notes
                    </summary>

                    <div className="mt-3 space-y-2">
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
                          <p className="text-xs font-semibold">
                            Coaching notes
                          </p>
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
                  </details>
                ) : null}
              </div>
            </section>

            {!hasSelectedCombination ? (
              <section className="bg-card text-muted-foreground rounded-2xl border p-8 text-center text-sm">
                Select a workout combination to unlock the logging flow.
              </section>
            ) : (
              <section className="space-y-4">
                {workout.exercises.length > 0 ? (
                  <div className="bg-background sticky top-0 z-20 space-y-2 pb-2">
                    <div className="bg-card rounded-2xl border p-3">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold">Workout flow</p>
                          <p className="text-muted-foreground text-xs">
                            {selectedCombination?.name ??
                              "Combination selected"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={() => setIsNotesDialogOpen(true)}
                            disabled={
                              saving || workoutValidationErrors.length > 0
                            }
                          >
                            <Save className="h-4 w-4" />
                          </Button>

                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={() => setIsAddExerciseSheetOpen(true)}
                            disabled={!hasSelectedCombination}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>

                          {hasSavedWorkout ? (
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              onClick={() => setIsDeleteDialogOpen(true)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      </div>

                      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
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
                          Prev
                        </Button>

                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {workout.exercises.map(
                            (exerciseEntry, exerciseIndex) => (
                              <Button
                                key={`${exerciseEntry.exerciseId}-${exerciseIndex}`}
                                type="button"
                                variant={
                                  exerciseIndex === activeExerciseIndex
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  setActiveExerciseIndex(exerciseIndex)
                                }
                              >
                                {exerciseIndex + 1}
                              </Button>
                            ),
                          )}
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={
                            activeExerciseIndex >= workout.exercises.length - 1
                          }
                          onClick={() =>
                            setActiveExerciseIndex((current) =>
                              Math.min(
                                workout.exercises.length - 1,
                                current + 1,
                              ),
                            )
                          }
                        >
                          Next
                        </Button>
                      </div>
                    </div>

                    {activeExerciseEntry ? (
                      <div className="bg-card rounded-2xl border p-3">
                        <div className="mb-3 space-y-3">
                          {/* Exercise header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h2 className="font-semibold">
                                {activeExercise?.name ??
                                  activeExerciseEntry.exerciseId}
                              </h2>

                              <p className="text-muted-foreground text-xs">
                                {activeExercise?.equipment
                                  ? formatExerciseEquipmentLabel(
                                      activeExercise.equipment,
                                    )
                                  : "No equipment"}{" "}
                                · {activeWeightUnit}
                                {activeExerciseRepRange
                                  ? ` · Reps ${activeExerciseRepRange.min}-${activeExerciseRepRange.max}`
                                  : ""}
                              </p>
                            </div>

                            {/* Exercise actions */}
                            <div className="flex shrink-0 gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-9 w-9"
                                disabled={activeExerciseIndex <= 0}
                                onClick={() =>
                                  moveExercise(activeExerciseIndex, -1)
                                }
                                aria-label="Move exercise up"
                              >
                                <ArrowUp className="h-4 w-4" />
                              </Button>

                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-9 w-9"
                                disabled={
                                  activeExerciseIndex >=
                                  workout.exercises.length - 1
                                }
                                onClick={() =>
                                  moveExercise(activeExerciseIndex, 1)
                                }
                                aria-label="Move exercise down"
                              >
                                <ArrowDown className="h-4 w-4" />
                              </Button>

                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() =>
                                  setExerciseToRemoveIndex(activeExerciseIndex)
                                }
                                aria-label="Remove exercise"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Exercise progress */}
                          <div className="space-y-2">
                            <div className="flex items-end justify-between gap-3">
                              <div>
                                <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                                  Sets
                                </p>
                                <p className="text-sm font-semibold">
                                  {activeRecordedSetCount}/{activeSetCount}
                                </p>
                              </div>

                              <div className="text-right">
                                <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                                  Warm-up
                                </p>
                                <p className="text-sm font-semibold">
                                  {activeWarmupSetCount}
                                </p>
                              </div>
                            </div>

                            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                              <div
                                className="bg-primary h-full rounded-full transition-all"
                                style={{
                                  width: `${
                                    activeSetCount > 0
                                      ? Math.min(
                                          100,
                                          Math.round(
                                            (activeRecordedSetCount /
                                              activeSetCount) *
                                              100,
                                          ),
                                        )
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                          </div>

                          {/* Exercise details */}
                          {Boolean(activeExercise?.description) ||
                          Boolean(activeExerciseNotes) ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground h-auto px-0 text-xs"
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

                        {activeProgressPercent !== null ? (
                          <div className="rounded-xl border p-3">
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <p className="text-xs font-medium">
                                Target Progress
                              </p>
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
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {workout.exercises.length === 0 ? (
                  <div className="bg-card text-muted-foreground rounded-2xl border p-8 text-center text-sm">
                    Selected combination has no exercises. Add one below.
                  </div>
                ) : activeExerciseEntry ? (
                  <div className="bg-card rounded-2xl border p-4">
                    {activePreviousSnapshot ? (
                      <div className="mb-4 rounded-xl border p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">
                              Last workout
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {new Date(
                                `${activePreviousSnapshot.date}T00:00:00`,
                              ).toLocaleDateString("en-GB", {
                                weekday: "short",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                          </div>

                          <span className="text-muted-foreground text-[11px] font-medium uppercase">
                            Previous
                          </span>
                        </div>

                        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                          {activePreviousSnapshot.sets.map(
                            (setEntry, setIndex) => (
                              <div
                                key={`${activePreviousSnapshot.date}-${setIndex}`}
                                className="bg-muted/30 min-w-22.5 rounded-lg border px-3 py-2 text-center"
                              >
                                <p className="text-muted-foreground text-[10px] font-medium uppercase">
                                  Set {setIndex + 1}
                                </p>

                                <p className="mt-1 text-sm font-semibold whitespace-nowrap">
                                  {setEntry.weight} {activeWeightUnit}
                                </p>

                                <p className="text-muted-foreground text-xs">
                                  × {setEntry.reps} reps
                                </p>
                              </div>
                            ),
                          )}
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t pt-2">
                          <span className="text-muted-foreground text-xs">
                            Total volume
                          </span>

                          <span className="text-xs font-semibold">
                            {activePreviousSnapshot.sets
                              .reduce(
                                (sum, setEntry) => sum + setEntry.volume,
                                0,
                              )
                              .toLocaleString()}{" "}
                            {activeWeightUnit}
                          </span>
                        </div>
                      </div>
                    ) : null}

                    <div className="space-y-3">
                      {activeExerciseEntry.sets.map((setEntry, setIndex) => {
                        const selectedEffort = effortGuide.find(
                          (item) => item.effort === setEntry.effort,
                        );

                        return (
                          <div
                            key={setIndex}
                            className="space-y-4 rounded-xl border p-3"
                          >
                            {/* Set header */}
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold">
                                Set {setIndex + 1}
                              </p>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-destructive h-8 px-2"
                                onClick={() =>
                                  removeSet(activeExerciseIndex, setIndex)
                                }
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Weight + Reps */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label className="text-muted-foreground text-xs">
                                  Weight
                                </Label>

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
                              </div>

                              <div className="space-y-1.5">
                                <Label className="text-muted-foreground text-xs">
                                  Reps
                                </Label>

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
                              </div>
                            </div>

                            {/* Effort */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <Label className="text-muted-foreground text-xs">
                                    Effort
                                  </Label>

                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground h-6 w-6"
                                    onClick={() => setIsEffortGuideOpen(true)}
                                    aria-label="Explain effort and RIR"
                                  >
                                    <Info className="h-3.5 w-3.5" />
                                  </Button>
                                </div>

                                {selectedEffort ? (
                                  <div className="text-right">
                                    <p className="text-sm font-semibold">
                                      {selectedEffort.rir}
                                    </p>
                                    <p className="text-muted-foreground text-[11px]">
                                      {selectedEffort.label}
                                    </p>
                                  </div>
                                ) : null}
                              </div>

                              <div className="px-2">
                                <Slider
                                  min={1}
                                  max={5}
                                  step={1}
                                  value={[setEntry.effort ?? 0]}
                                  onValueChange={(value) => {
                                    const effort = Array.isArray(value)
                                      ? value[0]
                                      : value;

                                    updateSet(activeExerciseIndex, setIndex, {
                                      effort: effort as 1 | 2 | 3 | 4 | 5,
                                    });
                                  }}
                                />

                                <div className="text-muted-foreground mt-2 flex justify-between text-[10px]">
                                  <span>Very easy</span>
                                  <span>Max</span>
                                </div>
                              </div>
                            </div>

                            {/* Warm-up */}
                            <Button
                              type="button"
                              variant={
                                setEntry.isWarmup ? "secondary" : "outline"
                              }
                              size="sm"
                              className="w-full"
                              onClick={() =>
                                updateSet(activeExerciseIndex, setIndex, {
                                  isWarmup: !setEntry.isWarmup,
                                })
                              }
                            >
                              {setEntry.isWarmup
                                ? "🔥 Warm-up set"
                                : "Mark as warm-up"}
                            </Button>

                            {/* Validation */}
                            {getSetErrors(setEntry).length > 0 ? (
                              <div className="text-muted-foreground space-y-1 text-xs">
                                {getSetErrors(setEntry).map((error) => (
                                  <p key={error}>{error}</p>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </section>
            )}
          </div>

          <div className="bg-background shrink-0 border-t pt-3 pb-[calc(env(safe-area-inset-bottom))] lg:pb-1">
            {workoutValidationErrors.length > 0 && hasSelectedCombination ? (
              <p className="text-muted-foreground mb-2 text-center text-xs">
                Fix the highlighted fields before saving.
              </p>
            ) : null}

            <div className="flex gap-2">
              <Button
                className="h-11 flex-1"
                onClick={handleSaveAndAddSet}
                disabled={
                  !hasSelectedCombination ||
                  !activeExerciseEntry ||
                  saving ||
                  workoutValidationErrors.length > 0
                }
              >
                <Check className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save & Add Set"}
              </Button>

              <Button
                className="h-11 px-5"
                variant="secondary"
                onClick={handleSaveAndNext}
                disabled={
                  !hasSelectedCombination ||
                  !activeExerciseEntry ||
                  saving ||
                  workoutValidationErrors.length > 0 ||
                  activeExerciseIndex >= workout.exercises.length - 1
                }
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>

          <Sheet open={isSummarySheetOpen} onOpenChange={setIsSummarySheetOpen}>
            <SheetContent side="bottom" className="rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>Workout summary</SheetTitle>
                <SheetDescription>
                  Status and loaded workout details
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-3 px-4 pb-6 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  {summaryCards.map((item) => (
                    <div key={item.label} className="rounded-xl border p-3">
                      <p className="text-muted-foreground text-[11px] tracking-wide uppercase">
                        {item.label}
                      </p>
                      <p className="text-sm font-semibold">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="text-muted-foreground rounded-xl border p-3 text-xs">
                  {hasSavedWorkout
                    ? "Existing workout loaded for this date."
                    : "New workout draft for this date."}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Dialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete workout?</DialogTitle>
                <DialogDescription>
                  This will permanently remove the workout for {selectedDate}.
                </DialogDescription>
              </DialogHeader>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>

                <Button
                  variant="destructive"
                  onClick={async () => {
                    await handleDeleteWorkout();
                    setIsDeleteDialogOpen(false);
                  }}
                >
                  Delete workout
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={exerciseToRemoveIndex !== null}
            onOpenChange={(open) => {
              if (!open) {
                setExerciseToRemoveIndex(null);
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remove exercise?</DialogTitle>
                <DialogDescription>
                  {exerciseToRemoveIndex !== null
                    ? `Remove ${exerciseMap.get(workout.exercises[exerciseToRemoveIndex]?.exerciseId ?? "")?.name ?? "this exercise"} from this workout?`
                    : "Remove this exercise from the workout?"}
                </DialogDescription>
              </DialogHeader>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setExerciseToRemoveIndex(null)}
                >
                  Cancel
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => {
                    if (exerciseToRemoveIndex !== null) {
                      removeExercise(exerciseToRemoveIndex);
                    }

                    setExerciseToRemoveIndex(null);
                  }}
                >
                  Remove exercise
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Sheet open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
            <SheetContent side="bottom" className="rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>Workout notes</SheetTitle>
                <SheetDescription>
                  Optional notes for this workout
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-3 px-4 pb-6">
                <Textarea
                  value={workout.notes ?? ""}
                  onChange={(e) =>
                    setWorkout((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Optional workout notes"
                  className="min-h-32"
                />

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={async () => {
                      await handleSave("Workout saved");
                      setIsNotesDialogOpen(false);
                    }}
                    disabled={
                      saving ||
                      workoutValidationErrors.length > 0 ||
                      !hasSelectedCombination
                    }
                  >
                    {saving ? "Saving..." : "Save Workout"}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setIsNotesDialogOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Sheet
            open={isAddExerciseSheetOpen}
            onOpenChange={setIsAddExerciseSheetOpen}
          >
            <SheetContent side="bottom" className="rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>Add exercise</SheetTitle>
                <SheetDescription>
                  Search the catalog and add an exercise to this workout
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-3 px-4 pb-6">
                <Input
                  value={exerciseQuery}
                  onChange={(event) => setExerciseQuery(event.target.value)}
                  placeholder="Search exercises"
                />

                <div className="max-h-80 space-y-2 overflow-auto rounded-xl border p-3">
                  {searchableManualExercises.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No exercises match your search.
                    </p>
                  ) : (
                    searchableManualExercises.map((exercise) => (
                      <button
                        key={exercise.id}
                        type="button"
                        onClick={async () => {
                          setManualExerciseId(exercise.id);
                          const added = await addManualExercise(exercise.id);

                          if (added !== false) {
                            setIsAddExerciseSheetOpen(false);
                          }
                        }}
                        className="hover:bg-accent flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2 text-left"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {exercise.name}
                          </p>
                          <p className="text-muted-foreground truncate text-xs">
                            {[
                              exercise.equipment
                                ? formatExerciseEquipmentLabel(
                                    exercise.equipment,
                                  )
                                : undefined,
                              ...exercise.categories.map((category) =>
                                titleCaseWorkoutValue(category),
                              ),
                            ]
                              .filter(Boolean)
                              .join(" • ") || "No categories"}
                          </p>
                        </div>

                        <Plus className="text-muted-foreground h-4 w-4 shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>

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
          <Sheet open={isEffortGuideOpen} onOpenChange={setIsEffortGuideOpen}>
            <SheetContent side="bottom" className="rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>Effort & RIR</SheetTitle>
                <SheetDescription>
                  RIR means reps in reserve — roughly how many good reps you
                  could have done before reaching failure.
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-2 px-4 pb-6">
                {effortGuide.map((item) => (
                  <div
                    key={item.effort}
                    className="flex items-center justify-between rounded-xl border p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">{item.rir}</p>
                      <p className="text-muted-foreground text-xs">
                        {item.label}
                      </p>
                    </div>

                    <span className="bg-muted rounded-lg px-2.5 py-1 text-xs font-semibold">
                      {item.effort}/5
                    </span>
                  </div>
                ))}
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
