import { ExerciseDefinition, WorkoutCombination } from "@/models/workout";

export const EXERCISE_VISUALIZATION_METRICS = [
  {
    key: "topWeight",
    label: "Top weight",
  },
  {
    key: "volume",
    label: "Volume",
  },
  {
    key: "reps",
    label: "Total reps",
  },
  {
    key: "sets",
    label: "Total sets",
  },
] as const;

export const WORKOUT_VISUALIZATION_METRICS = [
  {
    key: "volume",
    label: "Workout volume",
  },
  {
    key: "averageEffort",
    label: "Workout average effort",
  },
] as const;

export type ExerciseVisualizationMetricKey =
  (typeof EXERCISE_VISUALIZATION_METRICS)[number]["key"];

export type WorkoutVisualizationMetricKey =
  (typeof WORKOUT_VISUALIZATION_METRICS)[number]["key"];

export type WorkoutVisualizationMetricKeyUnion =
  ExerciseVisualizationMetricKey | WorkoutVisualizationMetricKey;

export type WorkoutVisualizationEntityType =
  "exercise" | "combination" | "workout";

const METRIC_KEYS = new Set<string>(
  EXERCISE_VISUALIZATION_METRICS.map((metric) => metric.key),
);

const WORKOUT_METRIC_KEYS = new Set<string>(
  WORKOUT_VISUALIZATION_METRICS.map((metric) => metric.key),
);

export function composeExerciseVisualizationKey(
  exerciseId: string,
  metric: ExerciseVisualizationMetricKey,
): string {
  return `exercise:${exerciseId}::${metric}`;
}

export function composeCombinationVisualizationKey(
  combinationId: string,
  metric: ExerciseVisualizationMetricKey,
): string {
  return `combination:${combinationId}::${metric}`;
}

export function composeWorkoutVisualizationKey(
  metric: WorkoutVisualizationMetricKey,
): string {
  return `workout::${metric}`;
}

export function parseExerciseVisualizationKey(key: string): {
  entityType: WorkoutVisualizationEntityType;
  entityId: string;
  metric: WorkoutVisualizationMetricKeyUnion;
} | null {
  const [rawEntity, metric] = key.split("::");

  if (!rawEntity || !metric) {
    return null;
  }

  if (rawEntity === "workout") {
    if (!WORKOUT_METRIC_KEYS.has(metric)) {
      return null;
    }

    return {
      entityType: "workout",
      entityId: "workout",
      metric: metric as WorkoutVisualizationMetricKey,
    };
  }

  if (!METRIC_KEYS.has(metric)) {
    return null;
  }

  if (rawEntity.startsWith("exercise:")) {
    const entityId = rawEntity.replace("exercise:", "").trim();

    if (!entityId) {
      return null;
    }

    return {
      entityType: "exercise",
      entityId,
      metric: metric as ExerciseVisualizationMetricKey,
    };
  }

  if (rawEntity.startsWith("combination:")) {
    const entityId = rawEntity.replace("combination:", "").trim();

    if (!entityId) {
      return null;
    }

    return {
      entityType: "combination",
      entityId,
      metric: metric as ExerciseVisualizationMetricKey,
    };
  }

  // Backward compatibility for persisted keys in the legacy shape: exerciseId::metric
  const legacyExerciseId = rawEntity.trim();

  if (!legacyExerciseId) {
    return null;
  }

  return {
    entityType: "exercise",
    entityId: legacyExerciseId,
    metric: metric as ExerciseVisualizationMetricKey,
  };
}

export function getExerciseVisualizationKeyOptions(
  exercises: ExerciseDefinition[],
  combinations: WorkoutCombination[],
): Array<{ value: string; label: string }> {
  const workoutOptions = WORKOUT_VISUALIZATION_METRICS.map((metric) => ({
    value: composeWorkoutVisualizationKey(metric.key),
    label: `Workout: ${metric.label}`,
  }));

  const exerciseOptions = exercises.flatMap((exercise) =>
    EXERCISE_VISUALIZATION_METRICS.map((metric) => ({
      value: composeExerciseVisualizationKey(exercise.id, metric.key),
      label: `Exercise: ${exercise.name} - ${metric.label}`,
    })),
  );

  const combinationOptions = combinations.flatMap((combination) =>
    EXERCISE_VISUALIZATION_METRICS.map((metric) => ({
      value: composeCombinationVisualizationKey(combination.id, metric.key),
      label: `Combination: ${combination.name} - ${metric.label}`,
    })),
  );

  return [...workoutOptions, ...exerciseOptions, ...combinationOptions];
}
