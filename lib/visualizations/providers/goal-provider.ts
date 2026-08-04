import { GoalProviderData, VisualizationProvider } from "./provider-types";

export const goalProvider: VisualizationProvider<GoalProviderData> = {
  async getData({ visualization, goals, entries }) {
    const goal = goals.find(
      (item) => item.label.toLowerCase() === visualization.key.toLowerCase(),
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
