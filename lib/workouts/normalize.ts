import {
  EFFORT_OPTIONS,
  EXERCISE_CATEGORY_OPTIONS,
  EXERCISE_MEASUREMENT_MODE_OPTIONS,
  EXERCISE_MUSCLE_GROUP_OPTIONS,
  EXERCISE_PROGRESSION_STRATEGY_OPTIONS,
  EXERCISE_TYPE_OPTIONS,
  EXERCISE_WEIGHT_TRACKING_MODE_OPTIONS,
  EXERCISE_WEIGHT_UNIT_OPTIONS,
  normalizeEquipmentValue,
} from "@/lib/workouts/constants";
import {
  ExerciseDefinition,
  ExerciseProgression,
  ExerciseTrackingConfig,
  WorkoutEntry,
  WorkoutExerciseEntry,
  WorkoutSetEntry,
  ExerciseWeightTracking,
  WorkoutCombination,
} from "@/models/workout";

export function createWorkoutId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function normalizeStringArray(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  const result = values
    .map((value) => String(value).trim())
    .filter((value) => value.length > 0);

  return Array.from(new Set(result));
}

function normalizeEnumArray<T extends string>(
  values: unknown,
  allowed: readonly T[],
): T[] {
  const allowedSet = new Set<string>(allowed);

  return normalizeStringArray(values).filter((value): value is T =>
    allowedSet.has(value),
  );
}

function normalizeOptionalEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();

  return (allowed as readonly string[]).includes(normalized)
    ? (normalized as T)
    : undefined;
}

export function normalizeTracking(
  value: Partial<ExerciseTrackingConfig> | undefined,
): ExerciseTrackingConfig {
  return {
    weight: Boolean(value?.weight ?? true),
    reps: Boolean(value?.reps ?? true),
    effort: Boolean(value?.effort ?? true),
    duration: typeof value?.duration === "boolean" ? value.duration : undefined,
    distance: typeof value?.distance === "boolean" ? value.distance : undefined,
  };
}

export function normalizeWeightTracking(
  value: Partial<ExerciseWeightTracking> | undefined,
): ExerciseWeightTracking {
  return {
    unit:
      normalizeOptionalEnum(value?.unit, EXERCISE_WEIGHT_UNIT_OPTIONS) ?? "kg",
    mode:
      normalizeOptionalEnum(
        value?.mode,
        EXERCISE_WEIGHT_TRACKING_MODE_OPTIONS,
      ) ?? "total",
  };
}

export function normalizeProgression(
  value: Partial<ExerciseProgression> | undefined,
): ExerciseProgression {
  const repRange = value?.repRange;

  const hasValidRepRange =
    repRange != null &&
    Number.isFinite(repRange.min) &&
    Number.isFinite(repRange.max) &&
    Number(repRange.min) > 0 &&
    Number(repRange.max) >= Number(repRange.min);

  return {
    repRange: hasValidRepRange
      ? {
          min: Number(repRange?.min),
          max: Number(repRange?.max),
        }
      : null,
    strategy:
      normalizeOptionalEnum(
        value?.strategy,
        EXERCISE_PROGRESSION_STRATEGY_OPTIONS,
      ) ?? "ascending_weight",
  };
}

export function normalizeExercisePayload(
  value: Partial<ExerciseDefinition>,
  fallbackId?: string,
): ExerciseDefinition {
  const name = value.name?.trim() || "";
  const idSource = value.id?.trim() || fallbackId || name;
  const id = createWorkoutId(idSource);

  const equipments = Array.from(
    new Set(
      [
        ...normalizeStringArray(value.equipments),
        typeof value.equipment === "string" ? value.equipment : "",
      ]
        .map((entry) => normalizeEquipmentValue(entry))
        .filter((entry) => entry.length > 0),
    ),
  );

  return {
    id,
    name,
    categories: normalizeEnumArray(value.categories, EXERCISE_CATEGORY_OPTIONS),
    muscleGroups: normalizeEnumArray(
      value.muscleGroups,
      EXERCISE_MUSCLE_GROUP_OPTIONS,
    ),
    equipment: equipments[0],
    equipments,
    measurementMode:
      normalizeOptionalEnum(
        value.measurementMode,
        EXERCISE_MEASUREMENT_MODE_OPTIONS,
      ) ?? "external_load",
    type: normalizeOptionalEnum(value.type, EXERCISE_TYPE_OPTIONS),
    description: value.description?.trim() || undefined,
    notes: normalizeStringArray(value.notes),
    tracking: normalizeTracking(value.tracking),
    weightTracking: normalizeWeightTracking(value.weightTracking),
    progression: normalizeProgression(value.progression),
    currentWeight:
      value.currentWeight === null || value.currentWeight === undefined
        ? null
        : Number(value.currentWeight),
    targetWeight:
      value.targetWeight === null || value.targetWeight === undefined
        ? null
        : Number(value.targetWeight),
    active: value.active ?? true,
  };
}

export function normalizeCombinationPayload(
  value: Partial<WorkoutCombination>,
  fallbackId?: string,
): WorkoutCombination {
  const name = value.name?.trim() || "";
  const idSource = value.id?.trim() || fallbackId || name;

  return {
    id: createWorkoutId(idSource),
    name,
    description: value.description?.trim() || undefined,
    coachingNotes: value.coachingNotes?.trim() || undefined,
    warmupGuidance: value.warmupGuidance?.trim() || undefined,
    exerciseIds: normalizeStringArray(value.exerciseIds),
    active: value.active ?? true,
  };
}

export function validateExercise(exercise: ExerciseDefinition): string[] {
  const errors: string[] = [];

  if (exercise.id.length === 0) {
    errors.push("Exercise id is required.");
  }

  if (exercise.name.length === 0) {
    errors.push("Exercise name is required.");
  }

  if (exercise.categories.length === 0) {
    errors.push("At least one category is required.");
  }

  return errors;
}

export function validateCombination(combination: WorkoutCombination): string[] {
  const errors: string[] = [];

  if (combination.id.length === 0) {
    errors.push("Combination id is required.");
  }

  if (combination.name.length === 0) {
    errors.push("Combination name is required.");
  }

  return errors;
}

export function normalizeWorkoutSet(
  value?: Partial<WorkoutSetEntry>,
): WorkoutSetEntry {
  const weight =
    value?.weight === null || value?.weight === undefined
      ? null
      : Number(value.weight);
  const reps =
    value?.reps === null || value?.reps === undefined
      ? null
      : Number(value.reps);
  const effort =
    value?.effort == null || !EFFORT_OPTIONS.includes(value.effort)
      ? null
      : value.effort;

  return {
    weight: Number.isFinite(weight) ? weight : null,
    reps: Number.isFinite(reps) ? reps : null,
    effort,
    isWarmup: Boolean(value?.isWarmup ?? false),
  };
}

export function normalizeWorkoutExercise(
  value: Partial<WorkoutExerciseEntry>,
): WorkoutExerciseEntry {
  return {
    exerciseId: String(value.exerciseId ?? "").trim(),
    sets: Array.isArray(value.sets)
      ? value.sets.map((setEntry) => normalizeWorkoutSet(setEntry))
      : [],
    notes:
      typeof value.notes === "string"
        ? value.notes.trim() || undefined
        : undefined,
  };
}

export function normalizeWorkoutPayload(
  value: Partial<WorkoutEntry>,
  fallbackId?: string,
): WorkoutEntry {
  const date = String(value.date ?? fallbackId ?? "").trim();

  return {
    id: fallbackId ?? date,
    date,
    combinationIds: normalizeStringArray(value.combinationIds),
    exercises: Array.isArray(value.exercises)
      ? value.exercises.map((exercise) => normalizeWorkoutExercise(exercise))
      : [],
    notes:
      typeof value.notes === "string"
        ? value.notes.trim() || undefined
        : undefined,
  };
}

export function validateWorkout(workout: WorkoutEntry): string[] {
  const errors: string[] = [];

  if (workout.date.length === 0) {
    errors.push("Workout date is required.");
  }

  if (workout.exercises.length === 0) {
    errors.push("Add at least one exercise to the workout.");
  }

  for (const exercise of workout.exercises) {
    if (exercise.exerciseId.length === 0) {
      errors.push("Workout exercises must reference an exercise.");
      break;
    }

    if (exercise.sets.length === 0) {
      errors.push("Each workout exercise needs at least one set.");
      break;
    }

    const hasInvalidSet = exercise.sets.some(
      (setEntry) =>
        (setEntry.weight !== null && setEntry.weight < 0) ||
        (setEntry.reps !== null && setEntry.reps <= 0) ||
        setEntry.effort === null,
    );

    if (hasInvalidSet) {
      errors.push(
        "Each set must have non-negative weight, positive reps, and effort.",
      );
      break;
    }
  }

  return errors;
}
