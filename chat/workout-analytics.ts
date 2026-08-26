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

// Curated gym slang / abbreviations mapped to canonical name phrases.
// These are matched against exercise NAMES (not ids), so they are robust to
// per-user exercise ids (Firestore stores UUIDs, different for every user).
const SLANG_SYNONYMS: Record<string, string> = {
  dl: "deadlift",
  rdl: "romanian deadlift",
  sldl: "romanian deadlift",
  squad: "squat",
  ohp: "overhead press",
  bp: "bench press",
};

// Words that name a specific variant of a lift. If the user says one of these
// and a competing exercise for the same mention has it in its name, the
// non-variant matches are dropped (e.g. "incline bench" -> Incline ... Press).
const VARIANT_QUALIFIERS = new Set([
  "incline",
  "inclined",
  "decline",
  "declined",
  "romanian",
  "bulgarian",
  "sumo",
  "front",
  "hack",
  "seated",
  "standing",
  "close",
  "wide",
  "reverse",
  "overhead",
  "deficit",
  "paused",
  "single",
  "unilateral",
  "split",
  "hammer",
  "preacher",
  "goblet",
  "assisted",
]);

// Words that force the plain / base version of a lift.
const BASE_LIFT_QUALIFIERS = new Set([
  "conventional",
  "standard",
  "regular",
  "normal",
  "plain",
]);

// Structural words that should never count as a matchable exercise-name token
// (e.g. "Clean and Press" must not match the connector "and").
const NAME_STOPWORDS = new Set([
  "and",
  "the",
  "a",
  "an",
  "of",
  "or",
  "with",
  "to",
  "for",
]);

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

function singularizeToken(token: string): string {
  if (token.length > 3 && token.endsWith("s") && !token.endsWith("ss")) {
    return token.slice(0, -1);
  }
  return token;
}

function tokenizeName(value: string): string[] {
  return normalizeText(value)
    .split(" ")
    .filter(Boolean)
    .map(singularizeToken)
    .filter((token) => !NAME_STOPWORDS.has(token));
}

function tokenizeMessage(message: string): string[] {
  const tokens = normalizeText(message).split(" ").filter(Boolean);
  const expanded: string[] = [];

  for (const token of tokens) {
    const synonym = SLANG_SYNONYMS[token];
    if (synonym) {
      for (const part of synonym.split(" ")) {
        expanded.push(singularizeToken(part));
      }
    } else {
      expanded.push(singularizeToken(token));
    }
  }

  return expanded;
}

function levenshtein(a: string, b: string): number {
  const dist: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );

  for (let i = 0; i <= a.length; i += 1) dist[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) dist[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dist[i][j] = Math.min(
        dist[i - 1][j] + 1,
        dist[i][j - 1] + 1,
        dist[i - 1][j - 1] + cost,
      );
    }
  }

  return dist[a.length][b.length];
}

// Two tokens match if equal, or (for longer tokens) within one edit — this is
// the "moderate / light typo" tolerance (e.g. "inclined"~"incline").
function tokensMatch(nameToken: string, messageToken: string): boolean {
  if (nameToken === messageToken) return true;
  if (nameToken.length < 6 || messageToken.length < 6) return false;
  if (Math.abs(nameToken.length - messageToken.length) > 1) return false;
  return levenshtein(nameToken, messageToken) <= 1;
}

interface ExerciseNameMatch {
  exercise: ExerciseDefinition;
  score: number;
  coveredIndices: Set<number>;
  nameTokens: string[];
}

export function resolveExercisesFromMessage(
  message: string,
  exercises: ExerciseDefinition[],
): ExerciseDefinition[] {
  const messageTokens = tokenizeMessage(message);
  if (messageTokens.length === 0) {
    return [];
  }

  const hasBaseQualifier = messageTokens.some((token) =>
    BASE_LIFT_QUALIFIERS.has(token),
  );

  const matches: ExerciseNameMatch[] = [];

  for (const exercise of exercises) {
    const nameTokens = tokenizeName(exercise.name);
    if (nameTokens.length === 0) {
      continue;
    }

    let matched = 0;
    const coveredIndices = new Set<number>();

    for (const nameToken of nameTokens) {
      for (let i = 0; i < messageTokens.length; i += 1) {
        if (coveredIndices.has(i)) {
          continue;
        }
        if (tokensMatch(nameToken, messageTokens[i])) {
          matched += 1;
          coveredIndices.add(i);
          break;
        }
      }
    }

    if (matched === 0) {
      continue;
    }

    const unsaid = nameTokens.length - matched;
    const fullPhrasePresent = ` ${messageTokens.join(" ")} `.includes(
      ` ${nameTokens.join(" ")} `,
    );
    const isVariant = nameTokens.some((token) => VARIANT_QUALIFIERS.has(token));
    const score =
      matched * 100 -
      unsaid * 40 +
      (fullPhrasePresent ? 500 : 0) -
      (hasBaseQualifier && isVariant ? 300 : 0);

    matches.push({ exercise, score, coveredIndices, nameTokens });
  }

  if (matches.length === 0) {
    return [];
  }

  // Qualifier gating: if the user named a variant (e.g. "incline", "romanian")
  // and a competing match sharing the same mention has that word in its name,
  // drop the matches that lack it so the specific variant wins.
  const messageQualifiers = messageTokens.filter((token) =>
    VARIANT_QUALIFIERS.has(token),
  );

  const gated = matches.filter((match) => {
    for (const qualifier of messageQualifiers) {
      const selfHasQualifier = match.nameTokens.some((token) =>
        tokensMatch(token, qualifier),
      );
      if (selfHasQualifier) {
        continue;
      }
      const overlappedQualified = matches.some(
        (other) =>
          other !== match &&
          other.nameTokens.some((token) => tokensMatch(token, qualifier)) &&
          [...other.coveredIndices].some((otherIndex) =>
            [...match.coveredIndices].some(
              (index) => Math.abs(otherIndex - index) <= 1,
            ),
          ),
      );
      if (overlappedQualified) {
        return false;
      }
    }
    return true;
  });

  // Closest match wins per mention: greedily keep the highest-scoring match and
  // skip any weaker match that overlaps message tokens already claimed. This
  // yields one exercise per mentioned concept (Deadlift, not Romanian Deadlift).
  const ordered = [...gated].sort((left, right) => right.score - left.score);
  const kept: ExerciseNameMatch[] = [];
  const claimedIndices = new Set<number>();

  for (const match of ordered) {
    const overlaps = [...match.coveredIndices].some((index) =>
      claimedIndices.has(index),
    );
    if (overlaps) {
      continue;
    }
    kept.push(match);
    for (const index of match.coveredIndices) {
      claimedIndices.add(index);
    }
  }

  return kept.map((match) => match.exercise);
}

export function resolveExerciseFromMessage(
  message: string,
  exercises: ExerciseDefinition[],
): ExerciseDefinition | null {
  return resolveExercisesFromMessage(message, exercises)[0] ?? null;
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

  // Exercise ids are canonical (Firestore doc ids). Match entries by exact id,
  // with a normalized-equality fallback for legacy id formatting differences.
  const exerciseIdSet = new Set(subject.exerciseIds);
  const normalizedIdSet = new Set(
    subject.exerciseIds.map((exerciseId) => normalizeText(exerciseId)),
  );

  return workout.exercises.filter((entry) => {
    if (exerciseIdSet.has(entry.exerciseId)) {
      return true;
    }

    const entryKey = normalizeText(entry.exerciseId);
    return entryKey.length > 0 && normalizedIdSet.has(entryKey);
  });
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
