/**
 * Phase 2 - Normalizers
 *
 * Goal:
 * Convert domain-specific raw objects into one shared retrieval format.
 * This allows a single scorer to rank entries, goals, and visualizations consistently.
 */

import { ChatDomains } from "@/models/chat/chat-request";
import { DailyEntry } from "@/models/entry";
import { MetricDefinition } from "@/models/metric";
import { getGoals } from "@/repositories/goals.server.repository";
import { Keywords } from "./keywords";
import { VisualizationDefinition } from "@/models/visualization";
import type {
  ExerciseDefinition,
  WorkoutCombination,
  WorkoutEntry,
} from "@/models/workout";
import { buildSessionMetrics } from "./workout-analytics";

export interface NormalizedDocument {
  id: string;
  domain: ChatDomains; // "entries" | "goals" | "visualizations"
  timestamp: string; // ISO string
  sourcePath: string; // e.g. users/{uid}/entries/{date}
  title: string;
  text: string; // main searchable text blob
  tags: string[];
  keywords: string[];
  structuredAttributes: Record<string, string | number | boolean | null>;
}

/**
 * Domain-specific mapping guidance:
 *
 * Entry -> NormalizedDocument
 * - id: entry.id or entry.date
 * - timestamp: entry.date (or updatedAt if needed)
 * - title: `Entry ${entry.date}`
 * - text: flattened values + score/xp summary
 * - tags: inferred from active metrics or categories
 * - sourcePath: users/{uid}/entries/{entry.id}
 *
 * Goal (MetricDefinition) -> NormalizedDocument
 * - id: goal.id
 * - timestamp: goal.updatedAt or fallback current ISO
 * - title: goal.label
 * - text: description + scoring explanation + target + unit
 * - tags: [goal.category, goal.type]
 * - sourcePath: users/{uid}/goals/{goal.id}
 *
 * VisualizationDefinition -> NormalizedDocument
 * - id: viz.id
 * - timestamp: fallback current ISO if no updatedAt field
 * - title: viz.title
 * - text: description + widget + provider + executor + key + aggregation
 * - tags: [viz.scope, viz.widget, viz.provider, viz.executor]
 * - sourcePath: users/{uid}/visualizations/{viz.id}
 *
 * Suggested functions:
 * - normalizeEntry(uid: string, entry: DailyEntry): NormalizedDocument
 * - normalizeGoal(uid: string, goal: MetricDefinition): NormalizedDocument
 * - normalizeVisualization(uid: string, viz: VisualizationDefinition): NormalizedDocument
 * - normalizeAll(uid: string, raw: { entries: DailyEntry[]; goals: MetricDefinition[]; visualizations: VisualizationDefinition[] }): NormalizedDocument[]
 *
 * Sample output item:
 * {
 *   id: "2026-08-09",
 *   domain: "entries",
 *   timestamp: "2026-08-09",
 *   sourcePath: "users/u_123/entries/2026-08-09",
 *   title: "Entry 2026-08-09",
 *   text: "score 78 xp 420 sleep 7.5 steps 9800 ...",
 *   tags: ["daily-entry"],
 *   keywords: ["score", "xp", "sleep", "steps"],
 *   structuredAttributes: { score: 78, xp: 420 }
 * }
 */

export class Normalizer {
  keywords = new Keywords();

  private calculateGoalCompletion(
    value: DailyEntry["values"][string],
    goal: MetricDefinition,
  ): number | null {
    if (typeof value === "boolean") {
      if (typeof goal.target === "boolean") {
        return value === goal.target ? 1 : 0;
      }
      return value ? 1 : 0;
    }

    if (typeof value === "number") {
      if (typeof goal.target === "number" && goal.target !== 0) {
        const ratio = value / goal.target;
        return Math.max(0, ratio);
      }
      return null;
    }

    if (typeof value === "string" && typeof goal.target === "string") {
      return value === goal.target ? 1 : 0;
    }

    return null;
  }

  private toTimestampString(value: unknown): string {
    const fallback = new Date().toISOString();

    if (!value) return fallback;
    if (typeof value === "string") return value;

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? fallback : value.toISOString();
    }

    if (typeof value === "number") {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
    }

    if (typeof value === "object") {
      const withToDate = value as { toDate?: () => Date };
      if (typeof withToDate.toDate === "function") {
        const date = withToDate.toDate();
        if (date instanceof Date && !Number.isNaN(date.getTime())) {
          return date.toISOString();
        }
      }

      const withSeconds = value as { seconds?: number };
      if (typeof withSeconds.seconds === "number") {
        const date = new Date(withSeconds.seconds * 1000);
        return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
      }
    }

    return fallback;
  }

  private tokenizeLabel(label: string): string[] {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean);
  }

  private getScoreBucket(score: number): "low" | "medium" | "high" {
    if (score < 40) return "low";
    if (score < 75) return "medium";
    return "high";
  }

  private getXpBucket(xp: number): "none" | "low" | "high" {
    if (xp === 0) return "none";
    if (xp < 50) return "low";
    return "high";
  }

  private buildGoalLookup(
    goals: MetricDefinition[],
  ): Record<string, MetricDefinition> {
    console.log(`[Normalizer] Building goal lookup with ${goals.length} goals`);
    if (goals.length === 0) {
      console.warn(
        "[Normalizer] WARNING: No goals fetched! This will cause metric IDs to show as raw IDs.",
      );
    }
    return goals.reduce<Record<string, MetricDefinition>>((acc, goal) => {
      acc[goal.id] = goal;
      return acc;
    }, {});
  }

  private resolveGoal(
    metricId: string,
    goalById: Record<string, MetricDefinition>,
  ): MetricDefinition | undefined {
    if (goalById[metricId]) {
      return goalById[metricId];
    }

    if (metricId.startsWith("metric-")) {
      const cleanId = metricId.slice("metric-".length);
      if (goalById[cleanId]) {
        return goalById[cleanId];
      }
    }

    const withPrefix = `metric-${metricId}`;
    if (goalById[withPrefix]) {
      return goalById[withPrefix];
    }

    console.warn(
      `[Normalizer] Goal not found for metric ID: ${metricId}. Available IDs: ${Object.keys(goalById).slice(0, 3).join(", ")}`,
    );
    return undefined;
  }

  private getVisualizationPeriodValue(viz: VisualizationDefinition): string {
    return viz.period.type === "days" ? String(viz.period.value) : "all";
  }

  private stringifyStreakRule(viz: VisualizationDefinition): string {
    const streakRule = viz.options?.streakRule;
    if (!streakRule) return "";

    const conditions = streakRule.conditions
      .map((condition) => {
        return `${condition.goalLabel} ${condition.comparator} ${String(condition.value)}`;
      })
      .join(" ; ");

    return `${streakRule.operator}: ${conditions}`;
  }

  async normalizeEntry(
    uid: string,
    entry: DailyEntry,
    preloadedGoalById?: Record<string, MetricDefinition>,
  ): Promise<NormalizedDocument> {
    const goalById =
      preloadedGoalById ?? this.buildGoalLookup(await getGoals(uid));
    const score = entry.score ?? 0;
    const xp = entry.xp ?? 0;

    const tags = new Set<string>([
      "entry",
      "daily-entry",
      "domain:entries",
      `score:${this.getScoreBucket(score)}`,
      `xp:${this.getXpBucket(xp)}`,
    ]);

    const keywords = new Set<string>([...this.keywords.entryKeywords]);

    for (const metricId of Object.keys(entry.values)) {
      const goal = this.resolveGoal(metricId, goalById);
      if (!goal) {
        keywords.add(`metric:${metricId}`);
        continue;
      }

      tags.add(`category:${goal.category}`);
      keywords.add(goal.id.toLowerCase());
      keywords.add(goal.category.toLowerCase());
      keywords.add(goal.type.toLowerCase());

      for (const token of this.tokenizeLabel(goal.label)) {
        keywords.add(token);
      }
    }

    return {
      id: entry.id || entry.date,
      domain: "entries",
      timestamp: entry.date,
      sourcePath: `users/${uid}/entries/${entry.id || entry.date}`,
      title: `Entry ${entry.date}`,
      text: this._flattenEntryValues(entry, goalById),
      tags: [...tags],
      keywords: [...keywords],
      structuredAttributes: {
        score,
        xp,
        date: entry.date,
      },
    };
  }

  async normalizeEntries(
    uid: string,
    entries: DailyEntry[],
  ): Promise<NormalizedDocument[]> {
    const goals = await getGoals(uid);
    const goalById = this.buildGoalLookup(goals);

    return Promise.all(
      entries.map((entry) => this.normalizeEntry(uid, entry, goalById)),
    );
  }

  async normalizeGoal(
    uid: string,
    goal: MetricDefinition,
  ): Promise<NormalizedDocument> {
    const tags = new Set<string>([
      "goal",
      "domain:goals",
      `category:${goal.category}`,
      `type:${goal.type}`,
    ]);

    const keywords = new Set<string>([
      ...this.keywords.goalKeywords,
      goal.id.toLowerCase(),
      goal.category.toLowerCase(),
      goal.type.toLowerCase(),
      ...this.tokenizeLabel(goal.label),
    ]);

    const goalText = [
      goal.label,
      goal.description ? `Description: ${goal.description}` : null,
      `Target: ${goal.target}${goal.unit ? " " + goal.unit : ""}`,
      `Weight: ${goal.weight}`,
      `Category: ${goal.category}`,
      `Type: ${goal.type}`,
      `Scoring: ${goal.scoring.type}`,
      goal.scoring.maxScore ? `Max Score: ${goal.scoring.maxScore}` : null,
      goal.scoring.bonusRate ? `Bonus Rate: ${goal.scoring.bonusRate}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    return {
      id: goal.id,
      domain: "goals",
      timestamp: this.toTimestampString(goal.updatedAt ?? goal.createdAt),
      sourcePath: `users/${uid}/goals/${goal.id}`,
      title: goal.label,
      text: goalText,
      tags: [...tags],
      keywords: [...keywords],
      structuredAttributes: {
        category: goal.category,
        type: goal.type,
        target: goal.target,
        unit: goal.unit ?? "",
        scoringType: goal.scoring.type,
        multiplier: goal.scoring.multiplier ?? "-",
        weight: goal.weight,
        maxScore: goal.scoring.maxScore ?? "-",
        bonusRate: goal.scoring.bonusRate ?? "-",
        options: goal.scoring.options?.join(", ") ?? "",
        ranges:
          goal.scoring.ranges?.map((r) => `${r.min}-${r.max}`).join(", ") ?? "",
        timeRanges:
          goal.scoring.time
            ?.map((t) => `${t.from}-${t.to} x ${t.multiplier ?? "-"}`)
            .join(", ") ?? "",
      },
    };
  }

  async normalizeVisualization(
    uid: string,
    viz: VisualizationDefinition,
  ): Promise<NormalizedDocument> {
    const periodValue = this.getVisualizationPeriodValue(viz);
    const streakRuleText = this.stringifyStreakRule(viz);

    const tags = new Set<string>([
      "visualization",
      "domain:visualizations",
      `scope:${viz.scope}`,
      `widget:${viz.widget}`,
      `provider:${viz.provider}`,
      `executor:${viz.executor}`,
    ]);

    const keywords = new Set<string>([
      ...this.keywords.visualizationKeywords,
      viz.id.toLowerCase(),
      viz.scope.toLowerCase(),
      viz.widget.toLowerCase(),
      viz.provider.toLowerCase(),
      viz.executor.toLowerCase(),
      ...this.tokenizeLabel(viz.title),
    ]);

    const vizText = [
      viz.title,
      viz.description ? `Description: ${viz.description}` : null,
      `Widget: ${viz.widget}`,
      `Provider: ${viz.provider}`,
      `Executor: ${viz.executor}`,
      `Key: ${viz.key}`,
      `Aggregation: ${viz.aggregation}`,
      `Period: ${viz.period.type} (${periodValue})`,
      `Visible: ${viz.visible}`,
      viz.options?.comparison ? `Comparison: ${viz.options.comparison}` : null,
      viz.options?.greenIfDeltaPositive !== undefined
        ? `Green if Delta Positive: ${viz.options.greenIfDeltaPositive}`
        : null,
      streakRuleText ? `Streak Rule: ${streakRuleText}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    return {
      id: viz.id,
      domain: "visualizations",
      timestamp: new Date().toISOString(),
      sourcePath: `users/${uid}/visualizations/${viz.id}`,
      title: viz.title,
      text: vizText,
      tags: [...tags],
      keywords: [...keywords],
      structuredAttributes: {
        scope: viz.scope,
        widget: viz.widget,
        provider: viz.provider,
        executor: viz.executor,
        key: viz.key,
        aggregation: viz.aggregation,
        comparison: viz.options?.comparison ?? "",
        greenIfDeltaPositive: viz.options?.greenIfDeltaPositive ?? "",
        streakRule: streakRuleText,
        periodType: viz.period.type,
        periodValue,
        visible: viz.visible,
      },
    };
  }

  normalizeWorkoutExercise(
    uid: string,
    exercise: ExerciseDefinition,
    workouts: WorkoutEntry[],
  ): NormalizedDocument {
    const subject = {
      kind: "exercise" as const,
      label: exercise.name,
      exerciseIds: [exercise.id],
      exercise,
    };
    const sessions = buildSessionMetrics(workouts, subject);
    const prSession =
      sessions.length > 0
        ? sessions.reduce((best, session) =>
            session.topWeight > best.topWeight ? session : best,
          )
        : null;

    const targetWeight =
      typeof exercise.targetWeight === "number" ? exercise.targetWeight : null;
    const completionPercent =
      prSession && targetWeight && targetWeight > 0
        ? Math.min(100, Math.round((prSession.topWeight / targetWeight) * 100))
        : null;

    const nameTokens = this.tokenizeLabel(exercise.name);

    const tags = new Set<string>([
      "workout",
      "domain:workouts",
      "workout-exercise",
      `exercise:${exercise.id}`,
    ]);

    const keywords = new Set<string>([
      ...this.keywords.workoutKeywords,
      exercise.id.toLowerCase(),
      ...nameTokens,
      "pr",
      "personal",
      "record",
      "best",
      "heaviest",
      "max",
      "target",
      "completion",
    ]);

    const text = [
      `${exercise.name} — personal record`,
      prSession
        ? `Top weight: ${prSession.topWeight} kg (on ${prSession.date})`
        : "No recorded weighted sessions yet.",
      prSession
        ? `PR session volume: ${Math.round(prSession.volume)}, reps: ${prSession.totalReps}, sets: ${prSession.totalSets}, avg effort: ${prSession.averageEffort ?? "n/a"}`
        : null,
      targetWeight !== null ? `Target weight: ${targetWeight} kg` : null,
      completionPercent !== null
        ? `Target completion: ${completionPercent}%`
        : null,
      `Sessions recorded: ${sessions.length}`,
    ]
      .filter(Boolean)
      .join("\n");

    return {
      id: `workout-exercise-${exercise.id}`,
      domain: "workouts",
      timestamp: prSession?.date ?? new Date().toISOString(),
      sourcePath: `users/${uid}/workouts/exercise/${exercise.id}`,
      title: `${exercise.name} PR`,
      text,
      tags: [...tags],
      keywords: [...keywords],
      structuredAttributes: {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        hasPerformed: sessions.length > 0,
        topWeight: prSession?.topWeight ?? 0,
        date: prSession?.date ?? "",
        volume: prSession ? Math.round(prSession.volume) : 0,
        totalReps: prSession?.totalReps ?? 0,
        totalSets: prSession?.totalSets ?? 0,
        averageEffort: prSession?.averageEffort ?? "n/a",
        targetWeight: targetWeight ?? "",
        completionPercent: completionPercent ?? "",
      },
    };
  }

  normalizeWorkoutCombination(
    uid: string,
    combination: WorkoutCombination,
    exerciseMap: Map<string, ExerciseDefinition>,
    workouts: WorkoutEntry[],
  ): NormalizedDocument {
    const sessions = workouts.filter((workout) =>
      workout.combinationIds.includes(combination.id),
    );
    const latest = sessions
      .map((workout) => workout.date)
      .sort((left, right) => right.localeCompare(left))[0];

    const exerciseNames = combination.exerciseIds
      .map((exerciseId) => exerciseMap.get(exerciseId)?.name ?? exerciseId)
      .join(", ");

    const tags = new Set<string>([
      "workout",
      "domain:workouts",
      "workout-combination",
      `combination:${combination.id}`,
    ]);

    const keywords = new Set<string>([
      ...this.keywords.workoutKeywords,
      combination.id.toLowerCase(),
      ...this.tokenizeLabel(combination.name),
      ...combination.exerciseIds.flatMap((exerciseId) =>
        this.tokenizeLabel(exerciseMap.get(exerciseId)?.name ?? exerciseId),
      ),
      "combination",
      "routine",
      "program",
    ]);

    const text = [
      `${combination.name} — workout combination`,
      combination.description
        ? `Description: ${combination.description}`
        : null,
      `Exercises: ${exerciseNames}`,
      `Sessions recorded: ${sessions.length}`,
      latest ? `Last performed: ${latest}` : "Not performed yet.",
    ]
      .filter(Boolean)
      .join("\n");

    return {
      id: `workout-combination-${combination.id}`,
      domain: "workouts",
      timestamp: latest ?? new Date().toISOString(),
      sourcePath: `users/${uid}/combinations/${combination.id}`,
      title: combination.name,
      text,
      tags: [...tags],
      keywords: [...keywords],
      structuredAttributes: {
        combinationId: combination.id,
        combinationName: combination.name,
        hasPerformed: sessions.length > 0,
        exerciseCount: combination.exerciseIds.length,
        sessionsRecorded: sessions.length,
        latestDate: latest ?? "",
      },
    };
  }

  normalizeWorkoutSession(
    uid: string,
    workout: WorkoutEntry,
    exerciseMap: Map<string, ExerciseDefinition>,
    combinationMap: Map<string, WorkoutCombination>,
  ): NormalizedDocument {
    const [metrics] = buildSessionMetrics([workout], {
      kind: "overall",
      label: "Workout",
      exerciseIds: [],
    });

    const exerciseNames = workout.exercises
      .map(
        (entry) => exerciseMap.get(entry.exerciseId)?.name ?? entry.exerciseId,
      )
      .filter(Boolean);
    const combinationNames = workout.combinationIds
      .map((id) => combinationMap.get(id)?.name ?? id)
      .filter(Boolean);

    const nameKeywords = exerciseNames.flatMap((name) =>
      this.tokenizeLabel(name),
    );

    const tags = new Set<string>([
      "workout",
      "domain:workouts",
      "workout-session",
    ]);

    const keywords = new Set<string>([
      ...this.keywords.workoutKeywords,
      ...nameKeywords,
      ...combinationNames.flatMap((name) => this.tokenizeLabel(name)),
    ]);

    const text = [
      `Workout on ${workout.date}`,
      metrics
        ? `Top weight: ${metrics.topWeight} kg, volume: ${Math.round(metrics.volume)}, sets: ${metrics.totalSets}, reps: ${metrics.totalReps}, avg effort: ${metrics.averageEffort ?? "n/a"}`
        : null,
      combinationNames.length > 0
        ? `Combinations: ${combinationNames.join(", ")}`
        : null,
      exerciseNames.length > 0
        ? `Exercises: ${exerciseNames.join(", ")}`
        : null,
      workout.notes ? `Notes: ${workout.notes}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    return {
      id: `workout-session-${workout.id || workout.date}`,
      domain: "workouts",
      timestamp: workout.date,
      sourcePath: `users/${uid}/workouts/${workout.id || workout.date}`,
      title: `Workout ${workout.date}`,
      text,
      tags: [...tags],
      keywords: [...keywords],
      structuredAttributes: {
        date: workout.date,
        topWeight: metrics?.topWeight ?? 0,
        volume: metrics ? Math.round(metrics.volume) : 0,
        totalReps: metrics?.totalReps ?? 0,
        totalSets: metrics?.totalSets ?? 0,
        averageEffort: metrics?.averageEffort ?? "n/a",
      },
    };
  }

  async normalizeAll(
    uid: string,
    raw: {
      entries: DailyEntry[];
      goals: MetricDefinition[];
      visualizations: VisualizationDefinition[];
      workouts: WorkoutEntry[];
      exercises: ExerciseDefinition[];
      combinations: WorkoutCombination[];
    },
  ): Promise<NormalizedDocument[]> {
    const goals = raw.goals;
    const goalById = this.buildGoalLookup(goals);

    const normalizedEntries = await Promise.all(
      raw.entries.map((entry) => this.normalizeEntry(uid, entry, goalById)),
    );

    const normalizedGoals = await Promise.all(
      goals.map((goal) => this.normalizeGoal(uid, goal)),
    );

    const normalizedVisualizations = await Promise.all(
      raw.visualizations.map((viz) => this.normalizeVisualization(uid, viz)),
    );

    const normalizedWorkoutExercises = raw.exercises.map((exercise) =>
      this.normalizeWorkoutExercise(uid, exercise, raw.workouts),
    );

    const exerciseMap = new Map(
      raw.exercises.map((exercise) => [exercise.id, exercise]),
    );
    const combinationMap = new Map(
      raw.combinations.map((combination) => [combination.id, combination]),
    );
    const normalizedWorkoutSessions = raw.workouts.map((workout) =>
      this.normalizeWorkoutSession(uid, workout, exerciseMap, combinationMap),
    );
    const normalizedWorkoutCombinations = raw.combinations.map((combination) =>
      this.normalizeWorkoutCombination(
        uid,
        combination,
        exerciseMap,
        raw.workouts,
      ),
    );

    return [
      ...normalizedEntries,
      ...normalizedGoals,
      ...normalizedVisualizations,
      ...normalizedWorkoutExercises,
      ...normalizedWorkoutCombinations,
      ...normalizedWorkoutSessions,
    ];
  }

  private _flattenEntryValues(
    entry: DailyEntry,
    goalById: Record<string, MetricDefinition>,
  ): string {
    const parts: string[] = [
      `**${entry.date}** - Score: ${entry.score ?? 0}, XP: ${entry.xp ?? 0}`,
    ];

    const goals: string[] = [];
    for (const [metricId, value] of Object.entries(entry.values)) {
      const goal = this.resolveGoal(metricId, goalById);
      const key = goal ? goal.label : `metric-${metricId}`;
      const score =
        entry.breakdown?.find((b) => b.metricId === metricId)?.score ?? 0;
      const bonus =
        entry.breakdown?.find((b) => b.metricId === metricId)?.bonus ?? 0;

      if (!goal) {
        goals.push(`- ${key}: ${String(value)}`);
        continue;
      }

      const completion = this.calculateGoalCompletion(value, goal);
      const completionPercent =
        completion === null ? "n/a" : `${Math.round(completion * 100)}%`;
      const unit = goal.unit ? ` ${goal.unit}` : "";

      goals.push(
        `- ${key}: ${String(value)}${unit} (target: ${String(goal.target)}, completion: ${completionPercent}, score: ${score}, bonus: ${bonus} weight ${goal.weight})`,
      );
    }

    if (goals.length > 0) {
      parts.push("Goals:");
      parts.push(...goals);
    }

    return parts.join("\n");
  }
}
