import { CategoryProviderData, VisualizationProvider } from "./provider-types";

export const categoryProvider: VisualizationProvider<CategoryProviderData> = {
  async getData({ visualization, goals, entries }) {
    const requestedKey = visualization.key.toLowerCase();
    const categoryNames = Array.from(
      new Set(goals.map((goal) => goal.category)),
    );
    const items = categoryNames.map((category) => {
      const categoryGoals = goals.filter((goal) => goal.category === category);
      const relevantEntries = entries
        .map((entry) => {
          const metrics = categoryGoals
            .map((goal) =>
              entry.breakdown?.find((item) => item.metricId === goal.id),
            )
            .filter(Boolean);

          if (!metrics.length) {
            return null;
          }

          return metrics.reduce(
            (sum, metric) => sum + (metric?.weightedScore ?? 0),
            0,
          );
        })
        .filter((value): value is number => value !== null);

      const total = relevantEntries.reduce((sum, value) => sum + value, 0);
      const average =
        relevantEntries.length === 0 ? 0 : total / relevantEntries.length;

      return {
        id: category,
        label: category,
        value: Number(average.toFixed(1)),
      };
    });
    const leaderboardMode =
      requestedKey === "all" ||
      requestedKey === "categories" ||
      requestedKey === "leaderboard";

    if (leaderboardMode) {
      return {
        id: "all-categories",
        label: "Categories",
        values: [],
        items,
      };
    }

    const categoryGoals = goals.filter(
      (goal) => goal.category.toLowerCase() === requestedKey,
    );

    const values = entries
      .map((entry) => {
        const metrics = categoryGoals
          .map((goal) =>
            entry.breakdown?.find((item) => item.metricId === goal.id),
          )
          .filter(Boolean);

        if (!metrics.length) {
          return null;
        }

        return {
          date: entry.date,
          value: metrics.reduce(
            (sum, metric) => sum + (metric?.weightedScore ?? 0),
            0,
          ),
          score: metrics.reduce((sum, metric) => sum + (metric?.score ?? 0), 0),
          weight: metrics.reduce(
            (sum, metric) => sum + (metric?.weight ?? 0),
            0,
          ),
          bonus: metrics.reduce((sum, metric) => sum + (metric?.bonus ?? 0), 0),
          xp: metrics.reduce((sum, metric) => sum + (metric?.xp ?? 0), 0),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      id: requestedKey,
      label: requestedKey,
      values,
      items,
    };
  },
};
