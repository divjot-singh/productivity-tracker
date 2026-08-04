import {
  CategoryProviderData,
  MetricHistoryData,
  StatProviderData,
} from "../providers/provider-types";
import { TrendChartData } from "../types";
import { VisualizationExecutor } from "./executor-types";
import { normalizeSleepDayMinutes, parseClockTime } from "../time-utils";

export const trendExecutor: VisualizationExecutor = {
  execute(visualization, data) {
    const providerData = data as
      StatProviderData | MetricHistoryData | CategoryProviderData;

    if (
      visualization.widget === "radar-chart" &&
      "items" in providerData &&
      providerData.items?.length
    ) {
      const radarValues = providerData.items.map((item) => item.value);

      return {
        id: visualization.id,
        title: visualization.title,
        widget: visualization.widget,
        subtitle: visualization.description,
        data: {
          labels: providerData.items.map((item) => toTitleCase(item.label)),
          rawLabels: providerData.items.map((item) => item.label),
          valueKind: "score",
          domain: {
            min: 0,
            max: roundedMax(radarValues),
          },
          datasets: [
            {
              label: visualization.title,
              data: radarValues,
            },
          ],
        } satisfies TrendChartData,
      };
    }

    const valueKind =
      "valueKind" in providerData ? providerData.valueKind : undefined;

    const normalizedValues = providerData.values.map((item) =>
      normalizeValue(item.value, valueKind),
    );
    const chartData: TrendChartData = {
      labels: providerData.values.map((item) => formatDate(item.date)),
      rawLabels: providerData.values.map((item) => item.date),
      unit: "unit" in providerData ? providerData.unit : undefined,
      valueKind: inferValueKind(providerData),
      domain: buildDomain(normalizedValues, visualization.widget),
      datasets: [
        {
          label: visualization.title,
          data: normalizedValues,
        },
      ],
    };

    return {
      id: visualization.id,
      title: visualization.title,
      widget: visualization.widget,
      subtitle: visualization.description,
      data: chartData,
    };
  },
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function normalizeValue(
  value: number | boolean | string,
  kind?: "number" | "boolean" | "time",
) {
  if (kind === "time" && typeof value === "string") {
    const normalized = normalizeSleepDayMinutes(value);

    if (normalized !== null) {
      return Number((normalized / 60).toFixed(1));
    }
  }

  if (typeof value === "number") {
    return Number(value.toFixed(1));
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

function inferValueKind(
  providerData: StatProviderData | MetricHistoryData | CategoryProviderData,
): TrendChartData["valueKind"] {
  if ("valueKind" in providerData && providerData.valueKind === "time") {
    return "time-of-day";
  }

  if ("valueKind" in providerData && providerData.valueKind === "boolean") {
    return "boolean";
  }

  if (providerData.values.length === 0) {
    return "number";
  }

  const sampleValue = providerData.values[0].value;

  if (typeof sampleValue === "boolean") {
    return "boolean";
  }

  if (typeof sampleValue === "string") {
    const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(sampleValue);

    if (timeMatch) {
      return "score";
    }
  }

  if (!("unit" in providerData) || !providerData.unit) {
    return "score";
  }

  return "number";
}

function buildDomain(values: number[], widget: string) {
  if (values.length === 0) {
    return {
      min: 0,
      max: 1,
    };
  }

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  if (widget === "bar-chart") {
    return {
      min: 0,
      max: roundedMax(values),
    };
  }

  const padding = Math.max(1, (maxValue - minValue) * 0.15);

  return {
    min: Math.max(0, Math.floor(minValue - padding)),
    max: Math.ceil(maxValue + padding),
  };
}

function roundedMax(values: number[]) {
  const maxValue = Math.max(1, ...values);

  if (maxValue <= 10) {
    return Math.ceil(maxValue);
  }

  if (maxValue <= 100) {
    return Math.ceil(maxValue / 5) * 5;
  }

  return Math.ceil(maxValue / 10) * 10;
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}
