import { CategoryProviderData } from "../providers/provider-types";
import { VisualizationExecutor } from "./executor-types";

export const leaderboardExecutor: VisualizationExecutor = {
  execute(visualization, data) {
    const providerData = data as CategoryProviderData;
    const items = (providerData.items ?? [])
      .slice()
      .sort((left, right) => right.value - left.value)
      .slice(0, 5)
      .map((item) => ({
        label: item.label,
        value: Number(item.value.toFixed(1)),
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
