import { EXERCISE_CATEGORY_OPTIONS } from "@/lib/workouts/constants";
import {
  ExerciseDefinition,
  WorkoutCombination,
  WorkoutEntry,
  WorkoutExerciseEntry,
} from "@/models/workout";

export type WorkoutSubject =
  | {
      kind: "overall";
      label: string;
      exerciseIds: string[];
    }
  | {
      kind: "exercise";
      label: string;
      exerciseIds: string[];
      exercise: ExerciseDefinition;
    }
  | {
      kind: "combination";
      label: string;
      exerciseIds: string[];
      combination: WorkoutCombination;
    }
  | {
      kind: "category";
      label: string;
      exerciseIds: string[];
      category: string;
    };

export interface WorkoutSessionMetrics {
  date: string;
  topWeight: number;
  volume: number;
  totalReps: number;
  totalSets: number;
  averageEffort: number | null;
  workout: WorkoutEntry;
  entries: WorkoutExerciseEntry[];
}

const CATEGORY_ALIASES: Record<string, string[]> = {
  push: ["push"],
  pull: ["pull"],
  legs: ["legs", "leg"],
  chest: ["chest"],
  back: ["back"],
  shoulders: ["shoulders", "shoulder"],
  arms: ["arms", "arm"],
  biceps: ["biceps", "bicep"],
  triceps: ["triceps", "tricep"],
  quads: ["quads", "quad"],
  hamstrings: ["hamstrings", "hamstring"],
  glutes: ["glutes", "glute"],
  calves: ["calves", "calf"],
  core: ["core", "abs", "abdominals"],
  posterior_chain: ["posterior chain"],
  functional: ["functional"],
};

const EXERCISE_ALIASES: Record<string, string[]> = {
  deadlift: ["deadlift", "deadlifts"],
  db_bench_press: [
    "bench",
    "bench press",
    "dumbbell bench",
    "dumbbell bench press",
  ],
  incline_db_press: [
    "incline bench",
    "incline press",
    "incline dumbbell press",
  ],
  barbell_squat: ["squat", "squats", "barbell squat"],
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function aliasScore(message: string, alias: string): number {
  const normalizedAlias = normalizeText(alias);

  if (!normalizedAlias) {
    return 0;
  }

  const paddedMessage = ` ${message} `;
  const paddedAlias = ` ${normalizedAlias} `;

  if (!paddedMessage.includes(paddedAlias)) {
    return 0;
  }

  return normalizedAlias.split(" ").length * 10 + normalizedAlias.length;
}

function getExerciseAliases(exercise: ExerciseDefinition): string[] {
  const aliases = new Set<string>([
    exercise.name,
    exercise.id.replace(/_/g, " "),
    ...(EXERCISE_ALIASES[exercise.id] ?? []),
  ]);

  return [...aliases];
}

export function resolveExerciseFromMessage(
  message: string,
  exercises: ExerciseDefinition[],
): ExerciseDefinition | null {
  const normalizedMessage = normalizeText(message);
  let bestMatch: { exercise: ExerciseDefinition; score: number } | null = null;

  for (const exercise of exercises) {
    let score = 0;

    for (const alias of getExerciseAliases(exercise)) {
      score = Math.max(score, aliasScore(normalizedMessage, alias));
    }

    if (score === 0) {
      continue;
    }

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { exercise, score };
    }
  }

  return bestMatch?.exercise ?? null;
}

export function resolveCombinationFromMessage(
  message: string,
  combinations: WorkoutCombination[],
): WorkoutCombination | null {
  const normalizedMessage = normalizeText(message);
  let bestMatch: { combination: WorkoutCombination; score: number } | null =
    null;

  for (const combination of combinations) {
    const score = aliasScore(normalizedMessage, combination.name);

    if (score === 0) {
      continue;
    }

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { combination, score };
    }
  }

  return bestMatch?.combination ?? null;
}

export function resolveCategoryFromMessage(
  message: string,
  exercises: ExerciseDefinition[],
): { category: string; exerciseIds: string[] } | null {
  const normalizedMessage = normalizeText(message);
  let bestCategory: { category: string; score: number } | null = null;

  for (const category of EXERCISE_CATEGORY_OPTIONS) {
    const aliases = CATEGORY_ALIASES[category] ?? [toLabel(category)];
    let score = 0;

    for (const alias of aliases) {
      score = Math.max(score, aliasScore(normalizedMessage, alias));
    }

    if (score === 0) {
      continue;
    }

    if (!bestCategory || score > bestCategory.score) {
      bestCategory = { category, score };
    }
  }

  if (!bestCategory) {
    return null;
  }

  const exerciseIds = exercises
    .filter((exercise) =>
      exercise.categories.includes(
        bestCategory.category as ExerciseDefinition["categories"][number],
      ),
    )
    .map((exercise) => exercise.id);

  if (exerciseIds.length === 0) {
    return null;
  }

  return {
    category: bestCategory.category,
    exerciseIds,
  };
}

export function resolveWorkoutSubject(
  message: string,
  exercises: ExerciseDefinition[],
  combinations: WorkoutCombination[],
): WorkoutSubject {
  const exercise = resolveExerciseFromMessage(message, exercises);

  if (exercise) {
    return {
      kind: "exercise",
      label: exercise.name,
      exerciseIds: [exercise.id],
      exercise,
    };
  }

  const combination = resolveCombinationFromMessage(message, combinations);

  if (combination) {
    return {
      kind: "combination",
      label: combination.name,
      exerciseIds: combination.exerciseIds,
      combination,
    };
  }

  const category = resolveCategoryFromMessage(message, exercises);

  if (category) {
    return {
      kind: "category",
      label: toLabel(category.category),
      exerciseIds: category.exerciseIds,
      category: category.category,
    };
  }

  return {
    kind: "overall",
    label: "Overall workouts",
    exerciseIds: exercises.map((exercise) => exercise.id),
  };
}

export function filterWorkoutsByDateRange(
  workouts: WorkoutEntry[],
  from: string,
  to: string,
): WorkoutEntry[] {
  return workouts
    .filter((workout) => workout.date >= from && workout.date <= to)
    .sort((left, right) => left.date.localeCompare(right.date));
}

function getRelevantEntries(
  workout: WorkoutEntry,
  subject: WorkoutSubject,
): WorkoutExerciseEntry[] {
  if (subject.kind === "overall") {
    return workout.exercises;
  }

  const exerciseIdSet = new Set(subject.exerciseIds);
  return workout.exercises.filter((entry) =>
    exerciseIdSet.has(entry.exerciseId),
  );
}

function getTopWeight(entries: WorkoutExerciseEntry[]): number {
  return entries.reduce(
    (maxWeight, entry) =>
      Math.max(
        maxWeight,
        entry.sets.reduce((setMax, setEntry) => {
          if (setEntry.weight === null) {
            return setMax;
          }

          return Math.max(setMax, setEntry.weight);
        }, 0),
      ),
    0,
  );
}

function getVolume(entries: WorkoutExerciseEntry[]): number {
  return entries.reduce(
    (exerciseSum, entry) =>
      exerciseSum +
      entry.sets.reduce((setSum, setEntry) => {
        if (setEntry.weight === null || setEntry.reps === null) {
          return setSum;
        }

        return setSum + setEntry.weight * setEntry.reps;
      }, 0),
    0,
  );
}

function getTotalReps(entries: WorkoutExerciseEntry[]): number {
  return entries.reduce(
    (exerciseSum, entry) =>
      exerciseSum +
      entry.sets.reduce((setSum, setEntry) => setSum + (setEntry.reps ?? 0), 0),
    0,
  );
}

function getAverageEffort(entries: WorkoutExerciseEntry[]): number | null {
  let effortCount = 0;

  const total = entries.reduce(
    (exerciseSum, entry) =>
      exerciseSum +
      entry.sets.reduce((setSum, setEntry) => {
        if (setEntry.effort === null) {
          return setSum;
        }

        effortCount += 1;
        return setSum + setEntry.effort;
      }, 0),
    0,
  );

  if (effortCount === 0) {
    return null;
  }

  return Number((total / effortCount).toFixed(1));
}

export function buildSessionMetrics(
  workouts: WorkoutEntry[],
  subject: WorkoutSubject,
): WorkoutSessionMetrics[] {
  return workouts
    .map((workout) => {
      const entries = getRelevantEntries(workout, subject);

      if (entries.length === 0) {
        return null;
      }

      return {
        date: workout.date,
        topWeight: getTopWeight(entries),
        volume: getVolume(entries),
        totalReps: getTotalReps(entries),
        totalSets: entries.reduce((sum, entry) => sum + entry.sets.length, 0),
        averageEffort: getAverageEffort(entries),
        workout,
        entries,
      };
    })
    .filter((item): item is WorkoutSessionMetrics => item !== null)
    .sort((left, right) => left.date.localeCompare(right.date));
}

export function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function buildWorkoutEvidence(
  uid: string,
  sessions: WorkoutSessionMetrics[],
  subject: WorkoutSubject,
  exercises: ExerciseDefinition[],
  combinations: WorkoutCombination[],
  limit = 8,
) {
  const exerciseMap = new Map(
    exercises.map((exercise) => [exercise.id, exercise]),
  );
  const combinationMap = new Map(
    combinations.map((combination) => [combination.id, combination]),
  );

  return [...sessions]
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, limit)
    .map((session) => {
      const exerciseNames = session.entries
        .map(
          (entry) =>
            exerciseMap.get(entry.exerciseId)?.name ?? entry.exerciseId,
        )
        .join(", ");
      const combinationNames = session.workout.combinationIds
        .map((id) => combinationMap.get(id)?.name ?? id)
        .join(", ");

      return {
        id: session.workout.id || session.workout.date,
        source: `users/${uid}/workouts/${session.workout.id || session.workout.date}`,
        timestamp: session.date,
        snippet: `${subject.label}: top weight ${session.topWeight} kg, volume ${Math.round(session.volume)}, sets ${session.totalSets}, reps ${session.totalReps}, avg effort ${session.averageEffort ?? "n/a"}${combinationNames ? `, combinations: ${combinationNames}` : ""}${exerciseNames ? `, exercises: ${exerciseNames}` : ""}`,
      };
    });
}

export function formatSessionTable(
  sessions: WorkoutSessionMetrics[],
  limit = 5,
): string[] {
  return [...sessions]
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, limit)
    .map(
      (session, index) =>
        `| ${index + 1} | ${session.date} | ${session.topWeight} | ${Math.round(session.volume)} | ${session.totalSets} | ${session.averageEffort ?? "n/a"} |`,
    );
}
