import { MetricHistoryData, VisualizationProvider } from "./provider-types";

export const metricHistoryProvider: VisualizationProvider<MetricHistoryData> = {
  async getData({ visualization, goals, entries }) {
    const metricId = visualization.key;

    const goal = goals.find(
      (item) => item.label.toLowerCase() === visualization.key.toLowerCase(),
    );

    if (!goal) {
      throw new Error(`Goal '${metricId}' not found.`);
    }
    const history = entries
      .map((entry) => {
        const metric = entry.breakdown?.find(
          (item) => item.metricId === goal.id,
        );

        if (!metric) {
          return null;
        }

        return {
          date: entry.date,
          value: metric.value,
          score: metric.score,
          weight: metric.weight,
          bonus: metric.bonus,
          xp: metric.xp ?? metric.bonus ?? 0,
        };
      })
      .filter(
        (
          item,
        ): item is {
          date: string;
          value: number | boolean | string;
          score: number;
          weight: number;
          bonus: number;
          xp: number;
        } => item !== null,
      )
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
      unit: goal.unit,
      target: goal.target,
      values: history,
    };
  },
};
