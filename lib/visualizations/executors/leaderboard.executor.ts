import {
  CategoryProviderData,
  ExerciseHistoryData,
} from "../providers/provider-types";
import { VisualizationExecutor } from "./executor-types";

export const leaderboardExecutor: VisualizationExecutor = {
  execute(visualization, data) {
    const providerData = data as CategoryProviderData | ExerciseHistoryData;

    const items =
      "metric" in providerData
        ? providerData.values
            .slice()
            .sort((left, right) => right.value - left.value)
            .slice(0, 5)
            .map((value) => ({
              label: new Date(value.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              }),
              value: Number(value.value.toFixed(1)),
              unit: providerData.unit,
            }))
        : (providerData.items ?? [])
            .slice()
            .sort((left, right) => right.value - left.value)
            .slice(0, 5)
            .map((item) => ({
              label: item.label,
              value: Number(item.value.toFixed(1)),
              score:
                item.score !== undefined
                  ? Number(item.score.toFixed(1))
                  : undefined,
              weight:
                item.weight !== undefined
                  ? Number(item.weight.toFixed(1))
                  : undefined,
              percentage:
                item.percentage !== undefined
                  ? Number(item.percentage.toFixed(1))
                  : undefined,
              unit: item.unit,
            }));

    return {
      id: visualization.id,
      title: visualization.title,
      widget: visualization.widget,
      subtitle: visualization.description,
      data: {
        items,
      },
    };
  },
};
