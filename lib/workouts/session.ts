import type {
  ExerciseDefinition,
  WorkoutCombination,
  WorkoutEntry,
  WorkoutExerciseEntry,
  WorkoutSetEntry,
} from "../../models/workout.ts";
import {
  estimateOneRepMax,
  summarizeSession,
  type ExerciseStats,
} from "./exercise-stats.ts";

export type Effort = 1 | 2 | 3 | 4 | 5;

export const EFFORT_GUIDE: { effort: Effort; label: string; hint: string }[] = [
  { effort: 1, label: "Very easy", hint: "5+ reps in reserve" },
  { effort: 2, label: "Easy", hint: "4-5 in reserve" },
  { effort: 3, label: "Moderate", hint: "3-4 in reserve" },
  { effort: 4, label: "Hard", hint: "1-2 in reserve" },
  { effort: 5, label: "Max", hint: "0-1 in reserve" },
];

// `done` and `key` exist only in the editor; saved workouts hold completed sets only.
export interface EditorSet extends WorkoutSetEntry {
  key: string;
  done: boolean;
}

export interface EditorExercise {
  key: string;
  exerciseId: string;
  sets: EditorSet[];
  notes?: string;
}

let sequence = 0;
const nextKey = () => `k${(sequence += 1)}`;

export function weightStep(unit?: string): number {
  if (unit === "kg") return 2.5;
  if (unit === "lb") return 5;

  return 1;
}

export function setVolume(set: Pick<WorkoutSetEntry, "weight" | "reps">) {
  return (set.weight ?? 0) * (set.reps ?? 0);
}

export function isWorkingDone(set: EditorSet) {
  return set.done && !set.isWarmup;
}

export function createEditorSet(
  partial: Partial<WorkoutSetEntry> = {},
): EditorSet {
  return {
    key: nextKey(),
    weight: null,
    reps: null,
    effort: 3,
    isWarmup: false,
    ...partial,
    done: false,
  };
}

export interface LastSession {
  date: string;
  sets: WorkoutSetEntry[];
}

// Most recent earlier workout that recorded this exercise.
export function lastSession(
  workouts: WorkoutEntry[],
  exerciseId: string,
  beforeDate: string,
): LastSession | null {
  let best: LastSession | null = null;

  for (const workout of workouts) {
    if (workout.date >= beforeDate) continue;
    if (best && workout.date <= best.date) continue;

    const entry = workout.exercises.find(
      (item) => item.exerciseId === exerciseId,
    );
    const sets = entry?.sets.filter((set) => set.reps !== null) ?? [];

    if (sets.length > 0) best = { date: workout.date, sets };
  }

  return best;
}

export function buildExercise(
  exerciseId: string,
  exercise: ExerciseDefinition | undefined,
  last: LastSession | null,
): EditorExercise {
  const sets = last
    ? last.sets.map((set) => createEditorSet(set))
    : [
        createEditorSet({
          weight: exercise?.currentWeight ?? null,
          reps: exercise?.progression.repRange?.min ?? null,
        }),
      ];

  return { key: nextKey(), exerciseId, sets };
}

export function fromWorkout(workout: WorkoutEntry): EditorExercise[] {
  return workout.exercises.map((entry) => ({
    key: nextKey(),
    exerciseId: entry.exerciseId,
    notes: entry.notes,
    sets: entry.sets.map((set) => ({ ...set, key: nextKey(), done: true })),
  }));
}

export function toWorkoutExercises(
  exercises: EditorExercise[],
): WorkoutExerciseEntry[] {
  return exercises.flatMap((exercise) => {
    const sets = exercise.sets
      .filter((set) => set.done)
      .map((set) => ({
        weight: set.weight,
        reps: set.reps,
        effort: set.effort,
        isWarmup: set.isWarmup,
      }));

    return sets.length > 0
      ? [{ exerciseId: exercise.exerciseId, sets, notes: exercise.notes }]
      : [];
  });
}

export interface Records {
  prWeight: number;
  best1RM: number;
  highestVolume: number;
}

// Records from every session except `date`, so editing a day never beats itself.
export function recordsExcluding(
  stats: ExerciseStats | undefined,
  date: string,
): Records {
  const records: Records = { prWeight: 0, best1RM: 0, highestVolume: 0 };

  for (const session of Object.values(stats?.history ?? {})) {
    if (session.date === date) continue;

    records.prWeight = Math.max(records.prWeight, session.topWeight);
    records.best1RM = Math.max(records.best1RM, session.estimated1RM);
    records.highestVolume = Math.max(records.highestVolume, session.volume);
  }

  return records;
}

export interface SetRecordFlags {
  weightPr: boolean;
  oneRmPr: boolean;
}

// First-ever sessions (no prior record) are not flagged; warm-ups never count.
export function detectSetRecords(
  set: Pick<WorkoutSetEntry, "weight" | "reps" | "isWarmup">,
  records: Records,
  earlierSets: Pick<WorkoutSetEntry, "weight" | "reps">[] = [],
): SetRecordFlags {
  const none = { weightPr: false, oneRmPr: false };

  if (set.isWarmup || !set.weight || !set.reps) return none;
  if (records.prWeight <= 0) return none;

  const sessionWeight = Math.max(0, ...earlierSets.map((s) => s.weight ?? 0));
  const sessionOneRm = Math.max(
    0,
    ...earlierSets.map((s) => estimateOneRepMax(s.weight ?? 0, s.reps ?? 0)),
  );

  return {
    weightPr: set.weight > Math.max(records.prWeight, sessionWeight),
    oneRmPr:
      estimateOneRepMax(set.weight, set.reps) >
      Math.max(records.best1RM, sessionOneRm),
  };
}

export interface SessionRecord {
  exerciseId: string;
  kind: "weight" | "1rm" | "volume";
  value: number;
}

export function sessionRecords(
  exercises: EditorExercise[],
  stats: Map<string, ExerciseStats>,
  date: string,
): SessionRecord[] {
  const found: SessionRecord[] = [];

  for (const exercise of exercises) {
    const summary = summarizeSession(
      date,
      exercise.sets.filter((set) => set.done),
    );
    const records = recordsExcluding(stats.get(exercise.exerciseId), date);

    if (!summary || records.prWeight <= 0) continue;

    if (summary.topWeight > records.prWeight) {
      found.push({
        exerciseId: exercise.exerciseId,
        kind: "weight",
        value: summary.topWeight,
      });
    }

    if (summary.estimated1RM > records.best1RM) {
      found.push({
        exerciseId: exercise.exerciseId,
        kind: "1rm",
        value: summary.estimated1RM,
      });
    }

    if (summary.volume > records.highestVolume) {
      found.push({
        exerciseId: exercise.exerciseId,
        kind: "volume",
        value: summary.volume,
      });
    }
  }

  return found;
}

export function sessionVolume(exercises: EditorExercise[]): number {
  return exercises.reduce(
    (total, exercise) =>
      total +
      exercise.sets
        .filter(isWorkingDone)
        .reduce((sum, set) => sum + setVolume(set), 0),
    0,
  );
}

export function workoutVolume(workout: WorkoutEntry): number {
  return workout.exercises.reduce(
    (total, exercise) =>
      total +
      exercise.sets
        .filter((set) => !set.isWarmup)
        .reduce((sum, set) => sum + setVolume(set), 0),
    0,
  );
}

export function diffCombination(
  combinationIds: string[],
  currentIds: string[],
) {
  const added = currentIds.filter((id) => !combinationIds.includes(id));
  const removed = combinationIds.filter((id) => !currentIds.includes(id));
  const kept = currentIds.filter((id) => combinationIds.includes(id));
  const keptOriginalOrder = combinationIds.filter((id) => kept.includes(id));
  const reordered = kept.some((id, index) => id !== keptOriginalOrder[index]);

  return {
    added,
    removed,
    reordered,
    changed: added.length + removed.length > 0 || reordered,
  };
}

export interface CombinationSuggestions {
  sessions: number;
  add: { exerciseId: string; count: number }[];
  remove: { exerciseId: string; count: number }[];
}

// Suggests changes from what is usually done: added when in >= addMin of the last `window`
// sessions, removed (never optional ones) when in <= removeMax of them.
export function suggestCombinationChanges(
  combination: WorkoutCombination,
  workouts: WorkoutEntry[],
  options: {
    window?: number;
    addMin?: number;
    removeMax?: number;
    minSessions?: number;
  } = {},
): CombinationSuggestions {
  const { window = 5, addMin = 3, removeMax = 1, minSessions = 4 } = options;

  const sessions = workouts
    .filter((workout) => workout.combinationIds.includes(combination.id))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, window);

  const counts = new Map<string, number>();

  for (const workout of sessions) {
    for (const id of new Set(workout.exercises.map((e) => e.exerciseId))) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }

  const optional = new Set(combination.optionalExercises ?? []);

  const add =
    sessions.length >= addMin
      ? [...counts]
          .filter(
            ([id, count]) =>
              !combination.exerciseIds.includes(id) && count >= addMin,
          )
          .map(([exerciseId, count]) => ({ exerciseId, count }))
      : [];

  const remove =
    sessions.length >= minSessions
      ? combination.exerciseIds
          .filter(
            (id) => !optional.has(id) && (counts.get(id) ?? 0) <= removeMax,
          )
          .map((exerciseId) => ({
            exerciseId,
            count: counts.get(exerciseId) ?? 0,
          }))
      : [];

  return { sessions: sessions.length, add, remove };
}

export function formatDuration(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(minutes / 60);

  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

export function formatSetLine(
  sets: Pick<WorkoutSetEntry, "weight" | "reps" | "isWarmup">[],
) {
  return sets
    .filter((set) => !set.isWarmup)
    .map((set) =>
      set.weight ? `${set.weight}x${set.reps ?? "-"}` : `${set.reps ?? "-"}`,
    )
    .join(", ");
}
