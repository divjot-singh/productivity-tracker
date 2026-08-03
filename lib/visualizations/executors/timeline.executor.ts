import {
  GoalProviderData,
  MetricHistoryData,
  StatProviderData,
} from "../providers/provider-types";
import { TimelineData } from "../types";
import { VisualizationExecutor } from "./executor-types";

export const timelineExecutor: VisualizationExecutor = {
  execute(visualization, data) {
    const providerData = data as
      StatProviderData | MetricHistoryData | GoalProviderData;

    const rows = providerData.values
      .map((item) => ({
        date: item.date,
        rawValue: normalizeValue(item.value),
      }))
      .sort((left, right) => left.date.localeCompare(right.date));

    const items = rows.map((row, index) => {
      const previous = index === 0 ? row.rawValue : rows[index - 1].rawValue;
      const delta = Number((row.rawValue - previous).toFixed(1));

      return {
        date: row.date,
        label: formatDate(row.date),
        value: Number(row.rawValue.toFixed(1)),
        delta,
        direction: delta > 0 ? "up" : delta < 0 ? "down" : "neutral",
      };
    });

    const timelineData: TimelineData = {
      unit: "unit" in providerData ? providerData.unit : undefined,
      label: "label" in providerData ? providerData.label : undefined,
      items,
    };

    return {
      id: visualization.id,
      title: visualization.title,
      widget: visualization.widget,
      subtitle: visualization.description,
      data: timelineData,
    };
  },
};

function normalizeValue(value: number | boolean | string) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(value);

  if (timeMatch) {
    const hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);

    return Number((hours + minutes / 60).toFixed(1));
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
