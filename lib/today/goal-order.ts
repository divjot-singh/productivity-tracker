import type { MetricDefinition, MetricValue } from "../../models/metric";

const MORNING_LABELS = [
  ["wake time"],
  ["sleep", "sleep hours"],
  ["weight", "body weight", "weight tracker"],
];
const ONGOING_LABELS = [
  "oral hygeine",
  "oral hygiene",
  "water intake",
  "supplement intake",
  "protein intake",
  "steps",
  "cardio",
  "work progress",
];

export function isMorningGoal(goal: MetricDefinition): boolean {
  return MORNING_LABELS.some((labels) =>
    labels.includes(goal.label.trim().toLowerCase()),
  );
}

export function getAnsweredGoalIds(
  goals: MetricDefinition[],
  values: Record<string, MetricValue>,
  answeredGoalIds: readonly string[] = [],
): Set<string> {
  const answered = new Set(answeredGoalIds);

  for (const goal of goals) {
    const value = values[goal.id];
    const empty = goal.type === "number" ? 0 : goal.defaultValue;
    if (value !== undefined && value !== "" && value !== empty) {
      answered.add(goal.id);
    }
  }

  return answered;
}

export function orderTodayGoals(
  goals: MetricDefinition[],
  answeredGoalIds: ReadonlySet<string>,
): MetricDefinition[] {
  return goals.toSorted((first, second) => {
    const firstOrder = goalOrder(first, answeredGoalIds);
    const secondOrder = goalOrder(second, answeredGoalIds);
    return (
      firstOrder[0] - secondOrder[0] ||
      firstOrder[1] - secondOrder[1] ||
      first.displayOrder - second.displayOrder
    );
  });
}

function goalOrder(
  goal: MetricDefinition,
  answeredGoalIds: ReadonlySet<string>,
): [number, number] {
  const label = goal.label.trim().toLowerCase();
  const morningIndex = MORNING_LABELS.findIndex((labels) =>
    labels.includes(label),
  );
  const isMorning = morningIndex >= 0;
  const isBoolean = goal.type === "boolean";

  if ((isMorning || isBoolean) && answeredGoalIds.has(goal.id))
    return [4, isMorning ? morningIndex : MORNING_LABELS.length];
  if (isMorning) return [0, morningIndex];
  if (isBoolean) return [1, 0];
  if (label === "bed time" || label === "bedtime") return [3, 0];

  const ongoingIndex = ONGOING_LABELS.indexOf(label);
  return [2, ongoingIndex < 0 ? ONGOING_LABELS.length : ongoingIndex];
}
