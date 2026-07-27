import {
  MetricDefinition,
  MetricValue,
  LookupScore,
  RangeScore,
  TimeRangeScore,
} from "@/models/metric";

import { ScoreResult, MetricScoreResult } from "./scoring-types";

function calculateLookupScore(
  value: MetricValue,
  values?: LookupScore[],
): number {
  if (!values) {
    return 0;
  }

  const matched = values.find((item) => item.value === value);

  if (matched) {
    return matched.score;
  }

  const fallback = values.find((item) => item.value === "after");

  return fallback?.score ?? 0;
}

function calculateRangeScore(
  value: MetricValue,
  values?: RangeScore[],
): number {
  console.log(value, values);
  if (typeof value !== "number" || !values) {
    return 0;
  }

  const matched = values.find((item) => {
    const minCheck = item.min === undefined || value >= item.min;

    const maxCheck = item.max === undefined || value <= item.max;

    return minCheck && maxCheck;
  });

  return matched?.score ?? 0;
}

function calculateTargetScore(value: MetricValue, target: MetricValue): number {
  if (typeof value !== "number" || typeof target !== "number") {
    return 0;
  }

  if (target === 0) {
    return 0;
  }

  const percentage = value / target;

  return Math.min(percentage * 10, 10);
}

function calculateBooleanScore(value: MetricValue): number {
  return value === true ? 10 : 0;
}

function calculateMetricScore(
  metric: MetricDefinition,
  value: MetricValue,
): MetricScoreResult {
  let score = 0;

  switch (metric.scoring.type) {
    case "lookup":
      score = calculateLookupScore(
        value,
        metric.scoring.values as LookupScore[],
      );

      break;

    case "range":
      score = calculateRangeScore(value, metric.scoring.ranges as RangeScore[]);

      break;

    case "boolean":
      score = calculateBooleanScore(value);

      break;

    case "target":
      score = calculateTargetScore(value, metric.target);

      break;
    case "time-range":
      score = calculateTimeRangeScore(value, metric.scoring.time);

    default:
      score = 0;
  }

  const weightedScore = (score / 10) * metric.weight;

  const bonus = calculateBonus(metric, value);

  return {
    metricId: metric.id,

    value,

    score,

    weight: metric.weight,

    weightedScore,

    bonus,

    xp: Math.round(weightedScore + bonus),
  };
}

function calculateBonus(metric: MetricDefinition, value: MetricValue): number {
  if (typeof value !== "number" || typeof metric.target !== "number") {
    return 0;
  }

  const extra = Math.max(value - metric.target, 0);

  return extra * metric.bonusRate;
}

export function calculateScore(
  metrics: MetricDefinition[],
  values: Record<string, MetricValue>,
): ScoreResult {
  const results = metrics.map((metric) =>
    calculateMetricScore(metric, values[metric.id] ?? metric.defaultValue),
  );
  console.log(results);
  const totalWeight = metrics.reduce((sum, metric) => sum + metric.weight, 0);

  const weightedTotal = results.reduce(
    (sum, item) => sum + item.weightedScore,
    0,
  );

  const totalScore =
    totalWeight === 0 ? 0 : Math.round((weightedTotal / totalWeight) * 100);

  const totalXP = results.reduce((sum, item) => sum + item.xp, 0);

  return {
    totalScore,

    totalXP,

    metrics: results,
  };
}

function convertTimeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

function calculateTimeRangeScore(
  value: MetricValue,
  ranges?: TimeRangeScore[],
) {
  if (typeof value !== "string" || !ranges) {
    return 0;
  }

  const current = convertTimeToMinutes(value);

  const matched = ranges.find((range) => {
    const from = convertTimeToMinutes(range.from);
    const to = convertTimeToMinutes(range.to);

    // normal range
    if (from <= to) {
      return current >= from && current <= to;
    }

    // crosses midnight
    return current >= from || current <= to;
  });

  return matched?.score ?? 0;
}
