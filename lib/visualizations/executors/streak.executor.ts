import {
  GoalProviderData,
  MetricHistoryData,
  StatProviderData,
} from "../providers/provider-types";
import { VisualizationExecutor } from "./executor-types";

export const streakExecutor: VisualizationExecutor = {
  execute(visualization, data) {
    const providerData = data as
      GoalProviderData | MetricHistoryData | StatProviderData;
    const values = providerData.values;

    let current = 0;
    let longest = 0;
    let active = 0;

    values.forEach((item) => {
      if (isSuccess(item, providerData)) {
        active += 1;
        longest = Math.max(longest, active);
      } else {
        active = 0;
      }
    });

    for (let index = values.length - 1; index >= 0; index -= 1) {
      if (!isSuccess(values[index], providerData)) {
        break;
      }

      current += 1;
    }

    return {
      id: visualization.id,
      title: visualization.title,
      widget: visualization.widget,
      subtitle:
        longest > 0
          ? `Best streak: ${longest} day${longest === 1 ? "" : "s"}`
          : visualization.description,
      data: {
        value: current,
        unit: current === 1 ? "day" : "days",
      },
    };
  },
};

function isSuccess(
  item:
    StatProviderData["values"][number] | MetricHistoryData["values"][number],
  providerData: GoalProviderData | MetricHistoryData | StatProviderData,
) {
  if (typeof item.value === "number") {
    if ("target" in providerData && typeof providerData.target === "number") {
      return item.value >= providerData.target;
    }

    return item.value > 0;
  }

  if (typeof item.value === "boolean") {
    if ("target" in providerData && typeof providerData.target === "boolean") {
      return item.value === providerData.target;
    }

    return item.value;
  }

  if (typeof item.value === "string") {
    if ("weight" in item && item.weight > 0) {
      return item.score > 0;
    }

    return item.value.length > 0;
  }

  return false;
}
