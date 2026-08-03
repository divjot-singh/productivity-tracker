import { StatProviderData } from "../providers/provider-types";
import { HeatmapData } from "../types";
import { VisualizationExecutor } from "./executor-types";

export const heatmapExecutor: VisualizationExecutor = {
  execute(visualization, data) {
    const providerData = data as StatProviderData;
    const values = providerData.values.map((item) => item.value);
    const maxValue = Math.max(1, ...values);
    const normalizedBounds = resolveNormalizationBounds(values);

    const heatmapData: HeatmapData = {
      cells: providerData.values.map((item) => ({
        date: item.date,
        label: formatDate(item.date),
        value: Number(item.value.toFixed(1)),
        intensity: Number(
          normalizeValue(
            item.value,
            normalizedBounds.min,
            normalizedBounds.max,
          ).toFixed(2),
        ),
      })),
      maxValue,
    };

    return {
      id: visualization.id,
      title: visualization.title,
      widget: visualization.widget,
      subtitle: visualization.description,
      data: heatmapData,
    };
  },
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function resolveNormalizationBounds(values: number[]) {
  if (values.length === 0) {
    return { min: 0, max: 1 };
  }

  const sorted = values.slice().sort((left, right) => left - right);
  const min = percentile(sorted, 0.1);
  const max = percentile(sorted, 0.9);

  if (max <= min) {
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1] || 1,
    };
  }

  return { min, max };
}

function percentile(sortedValues: number[], ratio: number) {
  if (sortedValues.length === 0) {
    return 0;
  }

  const safeRatio = Math.max(0, Math.min(1, ratio));
  const position = (sortedValues.length - 1) * safeRatio;
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);

  if (lowerIndex === upperIndex) {
    return sortedValues[lowerIndex];
  }

  const lower = sortedValues[lowerIndex];
  const upper = sortedValues[upperIndex];
  const weight = position - lowerIndex;
  return lower + (upper - lower) * weight;
}

function normalizeValue(value: number, min: number, max: number) {
  if (max <= min) {
    return 0.5;
  }

  const normalized = (value - min) / (max - min);
  return Math.max(0.08, Math.min(1, normalized));
}
