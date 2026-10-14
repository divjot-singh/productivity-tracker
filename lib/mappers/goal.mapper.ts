import type { GoalStatus, MetricDefinition } from "@/models/metric";

export const GOAL_SCHEMA_VERSION = 2;

// Legacy goals have no status; they are active by definition. Zero weight alone never means archived.
export function mapGoal(raw: Record<string, unknown>, id?: string): MetricDefinition {
  const goal = raw as unknown as MetricDefinition;

  const status: GoalStatus = goal.status === "archived" ? "archived" : "active";

  return {
    ...goal,
    id: id ?? goal.id,
    status,
    weight: Number(goal.weight) || 0,
  };
}

export function isActiveGoal(goal: Pick<MetricDefinition, "status">): boolean {
  return goal.status !== "archived";
}

// A goal counts for a given day unless it was archived before that day.
export function isGoalLiveOn(
  goal: Pick<MetricDefinition, "status" | "archivedAt">,
  date: string,
): boolean {
  if (goal.status !== "archived") return true;

  return !goal.archivedAt || date <= goal.archivedAt;
}

// Goals that scored on `date`; archived goals use their pre-archive weight for days they were still live.
export function resolveGoalsForDate(
  goals: MetricDefinition[],
  date: string,
): MetricDefinition[] {
  return goals.flatMap((goal) => {
    if (goal.status !== "archived") return [goal];

    if (!isGoalLiveOn(goal, date)) return [];

    return [{ ...goal, weight: goal.previousWeight ?? goal.weight }];
  });
}

export const LIFECYCLE_FIELDS = [
  "status",
  "archivedAt",
  "previousWeight",
  "schemaVersion",
] as const;
