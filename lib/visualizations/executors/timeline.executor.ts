import {
  GoalProviderData,
  MetricHistoryData,
  StatProviderData,
} from "../providers/provider-types";
import { TimelineData } from "../types";
import { VisualizationExecutor } from "./executor-types";
import {
  formatClockTime,
  formatDurationMinutes,
  normalizeSleepDayMinutes,
  parseClockTime,
} from "../time-utils";

export const timelineExecutor: VisualizationExecutor = {
  execute(visualization, data) {
    const providerData = data as
      StatProviderData | MetricHistoryData | GoalProviderData;
    const valueKind =
      "valueKind" in providerData ? providerData.valueKind : undefined;

    const rows = providerData.values
      .map((item) => ({
        date: item.date,
        rawValue: normalizeValue(item.value, valueKind),
      }))
      .sort((left, right) => left.date.localeCompare(right.date));

    const items = rows.map((row, index) => {
      const previous = index === 0 ? row.rawValue : rows[index - 1].rawValue;
      const delta = Number((row.rawValue - previous).toFixed(1));

      let direction = "neutral";

      if (delta > 0) {
        direction = visualization.options?.greenIfDeltaPositive ? "up" : "down";
      } else if (delta < 0) {
        direction = visualization.options?.greenIfDeltaPositive ? "down" : "up";
      }

      return {
        date: row.date,
        label: formatDate(row.date),
        value: Number(row.rawValue.toFixed(1)),
        valueLabel:
          valueKind === "time" ? formatClockTime(row.rawValue * 60) : undefined,
        delta,
        deltaLabel:
          valueKind === "time" ? formatDurationMinutes(delta * 60) : undefined,
        direction: direction as "up" | "down" | "neutral",
      };
    });

    const timelineData: TimelineData = {
      unit: "unit" in providerData ? providerData.unit : undefined,
      label: "label" in providerData ? providerData.label : undefined,
      valueKind:
        valueKind === "time"
          ? "time-of-day"
          : valueKind === "boolean"
            ? "boolean"
            : "number",
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

function normalizeValue(
  value: number | boolean | string,
  kind?: "number" | "boolean" | "time",
) {
  if (kind === "time" && typeof value === "string") {
    const normalized = normalizeSleepDayMinutes(value);

    if (normalized !== null) {
      return normalized / 60;
    }
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(value);

  if (timeMatch) {
    const minutes = parseClockTime(value);

    if (minutes !== null) {
      return Number((minutes / 60).toFixed(1));
    }
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
