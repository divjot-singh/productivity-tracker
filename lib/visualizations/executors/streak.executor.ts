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
    let activeStartIndex = -1;
    let bestStartIndex = -1;
    let bestEndIndex = -1;

    values.forEach((item, index) => {
      if (isSuccess(item, providerData)) {
        if (active === 0) {
          activeStartIndex = index;
        }

        active += 1;

        if (active > longest) {
          longest = active;
          bestStartIndex = activeStartIndex;
          bestEndIndex = index;
        }
      } else {
        active = 0;
        activeStartIndex = -1;
      }
    });

    let currentStartIndex = -1;
    let currentEndIndex = -1;

    for (let index = values.length - 1; index >= 0; index -= 1) {
      if (!isSuccess(values[index], providerData)) {
        break;
      }

      if (currentEndIndex === -1) {
        currentEndIndex = index;
      }

      currentStartIndex = index;
      current += 1;
    }

    const currentRange =
      currentStartIndex >= 0 && currentEndIndex >= 0
        ? formatDateRange(
            values[currentStartIndex]?.date,
            values[currentEndIndex]?.date,
          )
        : "-";

    const bestRange =
      bestStartIndex >= 0 && bestEndIndex >= 0
        ? formatDateRange(
            values[bestStartIndex]?.date,
            values[bestEndIndex]?.date,
          )
        : "-";

    const isCurrentBest =
      current > 0 && longest > 0 && currentRange === bestRange;

    return {
      id: visualization.id,
      title: visualization.title,
      widget: visualization.widget,
      subtitle:
        longest > 0
          ? `Best streak: ${longest} day${longest === 1 ? "" : "s"} (${bestRange})`
          : visualization.description,
      data: {
        value: current,
        unit: current === 1 ? "day" : "days",
        streak: {
          currentRange,
          bestRange,
          bestValue: longest,
          isCurrentBest,
        },
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

function formatDateRange(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) {
    return "-";
  }

  if (startDate === endDate) {
    return formatShortDate(startDate);
  }

  return `${formatShortDate(startDate)} - ${formatShortDate(endDate)}`;
}

function formatShortDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
