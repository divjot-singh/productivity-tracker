import type { WorkoutSetEntry } from "@/models/workout";

export interface SessionSummary {
  date: string;
  topWeight: number;
  topWeightReps: number;
  volume: number;
  totalReps: number;
  totalSets: number;
  estimated1RM: number;
}

export interface StatRecord {
  value: number;
  date: string;
}

export interface ExerciseStats {
  exerciseId: string;
  history: Record<string, SessionSummary>;
  prWeight: StatRecord | null;
  best1RM: StatRecord | null;
  highestVolume: StatRecord | null;
  lastPerformed: string | null;
  totalSessions: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function estimateOneRepMax(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;

  return round1(reps === 1 ? weight : weight * (1 + reps / 30));
}

// Warm-up sets never count toward PRs or volume records.
export function summarizeSession(
  date: string,
  sets: WorkoutSetEntry[],
): SessionSummary | null {
  const working = sets.filter(
    (set) => !set.isWarmup && (set.reps !== null || set.weight !== null),
  );

  if (working.length === 0) return null;

  let topWeight = 0;
  let topWeightReps = 0;
  let volume = 0;
  let totalReps = 0;
  let estimated1RM = 0;

  for (const set of working) {
    const weight = set.weight ?? 0;
    const reps = set.reps ?? 0;

    totalReps += reps;
    volume += weight * reps;
    estimated1RM = Math.max(estimated1RM, estimateOneRepMax(weight, reps));

    if (weight > topWeight || (weight === topWeight && reps > topWeightReps)) {
      topWeight = weight;
      topWeightReps = reps;
    }
  }

  return {
    date,
    topWeight,
    topWeightReps,
    volume: round1(volume),
    totalReps,
    totalSets: working.length,
    estimated1RM,
  };
}

function bestOf(
  sessions: SessionSummary[],
  pick: (session: SessionSummary) => number,
): StatRecord | null {
  let best: StatRecord | null = null;

  // Sessions are date-ascending, so the first session to reach a value keeps the record.
  for (const session of sessions) {
    const value = pick(session);

    if (value > 0 && (best === null || value > best.value)) {
      best = { value, date: session.date };
    }
  }

  return best;
}

export function computeStats(
  exerciseId: string,
  history: Record<string, SessionSummary>,
): ExerciseStats {
  const sessions = Object.values(history).sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  return {
    exerciseId,
    history,
    prWeight: bestOf(sessions, (s) => s.topWeight),
    best1RM: bestOf(sessions, (s) => s.estimated1RM),
    highestVolume: bestOf(sessions, (s) => s.volume),
    lastPerformed: sessions.length ? sessions[sessions.length - 1].date : null,
    totalSessions: sessions.length,
  };
}

// Replaces (or removes, when summary is null) one day's session and recomputes the records.
export function applySession(
  exerciseId: string,
  history: Record<string, SessionSummary> | undefined,
  date: string,
  summary: SessionSummary | null,
): ExerciseStats {
  const next = { ...(history ?? {}) };

  if (summary) {
    next[date] = summary;
  } else {
    delete next[date];
  }

  return computeStats(exerciseId, next);
}

export interface WorkoutLike {
  date: string;
  exercises: { exerciseId: string; sets: WorkoutSetEntry[] }[];
}

export function buildHistories(
  workouts: WorkoutLike[],
): Map<string, Record<string, SessionSummary>> {
  const histories = new Map<string, Record<string, SessionSummary>>();

  for (const workout of workouts) {
    for (const entry of workout.exercises) {
      const summary = summarizeSession(workout.date, entry.sets);

      if (!summary) continue;

      const history = histories.get(entry.exerciseId) ?? {};

      // The same exercise listed twice in one workout is merged by keeping the later block.
      history[workout.date] = summary;
      histories.set(entry.exerciseId, history);
    }
  }

  return histories;
}
