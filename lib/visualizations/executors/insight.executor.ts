import {
  GoalProviderData,
  MetricHistoryData,
  StatProviderData,
} from "../providers/provider-types";
import { InsightCardData } from "../types";
import { VisualizationExecutor } from "./executor-types";

export const insightExecutor: VisualizationExecutor = {
  execute(visualization, data) {
    const providerData = data as
      StatProviderData | MetricHistoryData | GoalProviderData;

    const values = providerData.values.map((item) =>
      normalizeValue(item.value),
    );
    const latest = values.at(-1) ?? 0;
    const average =
      values.length === 0
        ? 0
        : values.reduce((sum, value) => sum + value, 0) / values.length;

    const midpoint = Math.floor(values.length / 2);
    const previous = values.slice(0, midpoint);
    const current = values.slice(midpoint);
    const previousAvg =
      previous.length === 0
        ? average
        : previous.reduce((sum, value) => sum + value, 0) / previous.length;
    const currentAvg =
      current.length === 0
        ? average
        : current.reduce((sum, value) => sum + value, 0) / current.length;

    const delta = Number((currentAvg - previousAvg).toFixed(1));

    const tone: InsightCardData["tone"] =
      delta > 0.15 ? "positive" : delta < -0.15 ? "negative" : "neutral";

    const unit = "unit" in providerData ? providerData.unit : undefined;
    const label =
      "label" in providerData ? providerData.label : visualization.title;

    const insightData: InsightCardData = {
      tone,
      headline: buildHeadline(tone, label ?? ""),
      message: buildMessage(tone, delta, unit),
      stats: [
        {
          label: "Latest",
          value: formatValue(latest, unit),
        },
        {
          label: "Average",
          value: formatValue(average, unit),
        },
        {
          label: "Trend",
          value: `${delta > 0 ? "+" : ""}${delta.toFixed(1)}`,
        },
      ],
    };

    return {
      id: visualization.id,
      title: visualization.title,
      widget: visualization.widget,
      subtitle: visualization.description,
      data: insightData,
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

function buildHeadline(tone: InsightCardData["tone"], label: string) {
  if (tone === "positive") {
    return `${label} is trending up`;
  }

  if (tone === "negative") {
    return `${label} needs attention`;
  }

  return `${label} is holding steady`;
}

function buildMessage(
  tone: InsightCardData["tone"],
  delta: number,
  unit?: string,
) {
  const magnitude = Math.abs(delta).toFixed(1);

  if (tone === "positive") {
    return `Recent performance improved by ${magnitude}${unit ? ` ${unit}` : ""} compared to the previous period.`;
  }

  if (tone === "negative") {
    return `Recent performance dropped by ${magnitude}${unit ? ` ${unit}` : ""} compared to the previous period.`;
  }

  return "Recent performance is stable versus the previous period.";
}

function formatValue(value: number, unit?: string) {
  const base = value >= 100 ? value.toFixed(0) : value.toFixed(1);

  return unit ? `${base} ${unit}` : base;
}
