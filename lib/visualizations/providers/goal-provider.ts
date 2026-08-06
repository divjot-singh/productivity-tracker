import { GoalProviderData, VisualizationProvider } from "./provider-types";
import { normalizeVisualizationKey } from "../utils";

export const goalProvider: VisualizationProvider<GoalProviderData> = {
  async getData({ visualization, goals, entries }) {
    const streakRule = visualization.options?.streakRule;

    if (visualization.executor === "streak" && streakRule) {
      const goalMap = new Map(
        goals.map((goal) => [normalizeVisualizationKey(goal.label), goal]),
      );

      const ruleGoals = streakRule.conditions.map((condition) => {
        const goal = goalMap.get(
          normalizeVisualizationKey(condition.goalLabel),
        );

        if (!goal) {
          throw new Error(
            `Goal '${condition.goalLabel}' not found for streak rule.`,
          );
        }

        return {
          condition,
          goal,
        };
      });

      const history = entries
        .map((entry) => {
          const conditionMatches = ruleGoals.map(({ goal, condition }) => {
            const value = entry.values[goal.id];
            return matchesCondition(
              value,
              condition.comparator,
              condition.value,
            );
          });

          const isSuccess =
            streakRule.operator === "and"
              ? conditionMatches.every(Boolean)
              : conditionMatches.some(Boolean);

          return {
            date: entry.date,
            value: isSuccess,
            score: isSuccess ? 1 : 0,
            weight: 1,
            bonus: 0,
            xp: 0,
          };
        })
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        id: `streak-rule:${visualization.id}`,
        label: visualization.title,
        category: "composite",
        valueKind: "boolean",
        target: true,
        values: history,
      };
    }

    const normalizedKey = normalizeVisualizationKey(visualization.key);

    const goal = goals.find(
      (item) => normalizeVisualizationKey(item.label) === normalizedKey,
    );

    if (!goal) {
      throw new Error(`Goal '${visualization.key}' not found.`);
    }

    const history = entries
      .map((entry) => {
        const breakdown = entry.breakdown?.find(
          (metric) => metric.metricId === goal.id,
        );

        return {
          date: entry.date,
          value: entry.values[goal.id] ?? 0,
          score: breakdown?.score,
          weight: breakdown?.weight,
          bonus: breakdown?.bonus,
          xp: breakdown?.xp,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      id: goal.id,
      label: goal.label,
      category: goal.category,
      valueKind:
        goal.type === "time"
          ? "time"
          : goal.type === "boolean"
            ? "boolean"
            : "number",
      target: goal.target,
      unit: goal.unit,
      values: history.map((item) => ({
        date: item.date,
        value: item.value,
        score: item.score ?? 0,
        weight: item.weight ?? 0,
        bonus: item.bonus ?? 0,
        xp: item.xp ?? 0,
      })),
    };
  },
};

function matchesCondition(
  currentValue: unknown,
  comparator: "eq" | "gt" | "gte" | "lt" | "lte",
  expectedValue: number | boolean | string,
): boolean {
  if (comparator === "eq") {
    return currentValue === expectedValue;
  }

  if (typeof currentValue !== "number" || typeof expectedValue !== "number") {
    return false;
  }

  switch (comparator) {
    case "gt":
      return currentValue > expectedValue;
    case "gte":
      return currentValue >= expectedValue;
    case "lt":
      return currentValue < expectedValue;
    case "lte":
      return currentValue <= expectedValue;
    default:
      return false;
  }
}
