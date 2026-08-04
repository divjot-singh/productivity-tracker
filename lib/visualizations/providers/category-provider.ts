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

          const score = metrics.reduce(
            (sum, metric) => sum + (metric?.weightedScore ?? 0),
            0,
          );

          const weight = metrics.reduce(
            (sum, metric) => sum + (metric?.weight ?? 0),
            0,
          );

          return {
            score,
            weight,
          };
        })
        .filter(
          (
            value,
          ): value is {
            score: number;
            weight: number;
          } => value !== null,
        );

      const totalScore = relevantEntries.reduce(
        (sum, value) => sum + value.score,
        0,
      );

      const totalWeight = relevantEntries.reduce(
        (sum, value) => sum + value.weight,
        0,
      );

      const percentage =
        totalWeight === 0 ? 0 : (totalScore / totalWeight) * 100;

      return {
        id: category,
        label: category,
        value: Number(percentage.toFixed(1)),
        score: Number(totalScore.toFixed(1)),
        weight: Number(totalWeight.toFixed(1)),
        percentage: Number(percentage.toFixed(1)),
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

        const score = metrics.reduce(
          (sum, metric) => sum + (metric?.weightedScore ?? 0),
          0,
        );

        const weight = metrics.reduce(
          (sum, metric) => sum + (metric?.weight ?? 0),
          0,
        );

        const percentage = weight === 0 ? 0 : (score / weight) * 100;

        return {
          date: entry.date,
          value: Number(percentage.toFixed(1)),
          score: Number(score.toFixed(1)),
          weight: Number(weight.toFixed(1)),
          percentage: Number(percentage.toFixed(1)),
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
