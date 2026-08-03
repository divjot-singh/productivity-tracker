import {
  GoalProviderData,
  MetricHistoryData,
} from "../providers/provider-types";
import { ProgressBarData, ProgressRingData } from "../types";
import { VisualizationExecutor } from "./executor-types";

export const progressExecutor: VisualizationExecutor = {
  execute(visualization, data) {
    const providerData = data as GoalProviderData | MetricHistoryData;
    const latestValue = providerData.values.at(-1);
    const numericTarget = normalizeNumericValue(providerData.target);
    const rawValue = latestValue ? normalizeNumericValue(latestValue.value) : 0;

    const value = Number(rawValue.toFixed(1));
    const target = numericTarget > 0 ? Number(numericTarget.toFixed(1)) : 100;
    const percentage =
      target > 0
        ? Math.max(
            0,
            Math.min(100, Number(((value / target) * 100).toFixed(1))),
          )
        : 0;

    const responseData: ProgressBarData | ProgressRingData = {
      value,
      target,
      percentage,
      unit: providerData.unit,
      label:
        typeof providerData.target === "number"
          ? `${providerData.label} target`
          : "Daily completion",
    };

    return {
      id: visualization.id,
      title: visualization.title,
      widget: visualization.widget,
      subtitle: visualization.description,
      data: responseData,
    };
  },
};

function normalizeNumericValue(value: number | boolean | string | undefined) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "boolean") {
    return value ? 100 : 0;
  }

  if (typeof value === "string") {
    const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(value);

    if (timeMatch) {
      return Number(timeMatch[1]) * 60 + Number(timeMatch[2]);
    }

    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  return 0;
}
