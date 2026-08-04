import { MetricDefinition, MetricValue } from "@/models/metric";
import { EntryFormValue } from "@/components/today/MetricInput";

export function normalizeEntryValues(
  metrics: MetricDefinition[],
  values: Record<string, EntryFormValue>,
): Record<string, MetricValue> {
  return metrics.reduce(
    (acc, metric) => {
      const value = values[metric.id];
      acc[metric.id] = value === "" ? getEmptyValue(metric) : value;
      return acc;
    },
    {} as Record<string, MetricValue>,
  );
}

export function getEmptyFormValues(
  metrics: MetricDefinition[],
): Record<string, EntryFormValue> {
  return metrics.reduce(
    (acc, metric) => {
      acc[metric.id] = getEmptyFormValue(metric);
      return acc;
    },
    {} as Record<string, EntryFormValue>,
  );
}

export function getEmptyFormValue(metric: MetricDefinition): EntryFormValue {
  if (metric.type === "boolean") {
    return metric.defaultValue as boolean;
  }

  if (metric.type === "time") {
    return metric.defaultValue as string;
  }

  return "";
}

function getEmptyValue(metric: MetricDefinition): MetricValue {
  if (metric.type === "boolean") {
    return metric.defaultValue as boolean;
  }

  if (metric.type === "time") {
    return metric.defaultValue as string;
  }

  return 0;
}

export function hasEntryValues(
  metrics: MetricDefinition[],
  values: Record<string, EntryFormValue>,
): boolean {
  return metrics.some((metric) => {
    const value = values[metric.id];
    const empty = getEmptyFormValue(metric);
    return value !== empty;
  });
}
