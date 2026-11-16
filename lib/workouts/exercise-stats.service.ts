import type { WorkoutEntry } from "@/models/workout";
import {
  deleteExerciseStats,
  getExerciseStats,
  saveExerciseStats,
} from "@/repositories/exercise-stats.server.repository";
import { getWorkouts } from "@/repositories/workouts.server.repository";

import {
  applySession,
  buildHistories,
  summarizeSession,
} from "./exercise-stats";

function exerciseIdsOf(workout: WorkoutEntry | null): string[] {
  return workout ? workout.exercises.map((entry) => entry.exerciseId) : [];
}

export interface NewPr {
  exerciseId: string;
  weight: number;
}

// Updates only the exercises touched by a save/delete; falls back to a full rebuild when a stats doc is missing.
// Returns weight PRs beaten by this save (a first-ever session is not a PR).
export async function syncExerciseStats(
  uid: string,
  date: string,
  previous: WorkoutEntry | null,
  next: WorkoutEntry | null,
): Promise<NewPr[]> {
  const affected = [
    ...new Set([...exerciseIdsOf(previous), ...exerciseIdsOf(next)]),
  ];
  const newPrs: NewPr[] = [];

  if (affected.length === 0) return newPrs;

  let allWorkouts: WorkoutEntry[] | null = null;

  for (const exerciseId of affected) {
    const nextEntry = next?.exercises.find(
      (entry) => entry.exerciseId === exerciseId,
    );
    const summary = nextEntry ? summarizeSession(date, nextEntry.sets) : null;
    const existing = await getExerciseStats(uid, exerciseId);

    let stats;

    if (existing) {
      stats = applySession(exerciseId, existing.history, date, summary);
    } else {
      allWorkouts ??= await getWorkouts(uid);

      const others = allWorkouts.filter((workout) => workout.date !== date);
      const history = buildHistories(others).get(exerciseId) ?? {};

      stats = applySession(exerciseId, history, date, summary);
    }

    if (stats.totalSessions === 0) {
      await deleteExerciseStats(uid, exerciseId);
    } else {
      await saveExerciseStats(uid, stats);
    }

    const before = existing?.prWeight?.value ?? 0;

    if (
      existing &&
      stats.prWeight?.date === date &&
      stats.prWeight.value > before
    ) {
      newPrs.push({ exerciseId, weight: stats.prWeight.value });
    }
  }

  return newPrs;
}
