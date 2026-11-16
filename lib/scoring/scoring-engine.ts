import {
  MetricDefinition,
  MetricValue,
  OptionScore,
  RangeScore,
  TimeRangeScore,
} from "@/models/metric";

import { MetricScoreResult, ScoreResult } from "./scoring-types";

function finalizeScore(
  rawScore: number,
  metric: MetricDefinition,
): Pick<MetricScoreResult, "score" | "weightedScore" | "bonus"> {
  let score = rawScore;
  if (metric.scoring.maxScore !== undefined) {
    score = Math.min(score, metric.scoring.maxScore);
  }
  if (metric.scoring.bonusRate !== undefined) {
    score = Math.min(score, metric.weight + metric.scoring.bonusRate);
  }

  const bonus = Math.max(score - metric.weight, 0);

  return {
    score,
    weightedScore: score,
    bonus,
  };
}

function calculateMetricScore(
  metric: MetricDefinition,
  value: MetricValue,
): MetricScoreResult {
  switch (metric.scoring.type) {
    case "goal": {
      if (
        typeof value !== "number" ||
        typeof metric.target !== "number" ||
        metric.target <= 0
      ) {
        break;
      }

      const rawScore = (value / metric.target) * metric.weight;

      return buildResult(metric, value, finalizeScore(rawScore, metric));
    }

    case "range": {
      const rawScore =
        calculateRangeMultiplier(value, metric.scoring.ranges) * metric.weight;

      return buildResult(metric, value, finalizeScore(rawScore, metric));
    }

    case "time-range": {
      const rawScore =
        calculateTimeMultiplier(value, metric.scoring.time) * metric.weight;

      return buildResult(metric, value, finalizeScore(rawScore, metric));
    }

    case "options": {
      const rawScore =
        calculateOptionMultiplier(value, metric.scoring.options) *
        metric.weight;

      return buildResult(metric, value, finalizeScore(rawScore, metric));
    }

    case "multiplier": {
      if (typeof value !== "number") {
        break;
      }

      const rawScore = value * (metric.scoring.multiplier ?? 1);

      return buildResult(metric, value, finalizeScore(rawScore, metric));
    }

    case "boolean": {
      const rawScore = value === metric.target ? metric.weight : 0;

      return buildResult(metric, value, finalizeScore(rawScore, metric));
    }
  }

  return buildResult(metric, value, {
    score: 0,
    weightedScore: 0,
    bonus: 0,
  });
}

function calculateRangeMultiplier(
  value: MetricValue,
  ranges?: RangeScore[],
): number {
  if (typeof value !== "number" || !ranges?.length) {
    return 0;
  }

  const match = ranges.find((range) => {
    const minOk = range.min === undefined || value >= range.min;
    const maxOk = range.max === undefined || value <= range.max;

    return minOk && maxOk;
  });

  return match?.multiplier ?? 0;
}

function calculateOptionMultiplier(
  value: MetricValue,
  options?: OptionScore[],
): number {
  if (!options?.length) {
    return 0;
  }

  return options.find((option) => option.value === value)?.multiplier ?? 0;
}

function calculateTimeMultiplier(
  value: MetricValue,
  ranges?: TimeRangeScore[],
): number {
  if (typeof value !== "string" || !ranges?.length) {
    return 0;
  }

  const current = convertTimeToMinutes(value);

  const match = ranges.find((range) => {
    const from = convertTimeToMinutes(range.from);
    const to = convertTimeToMinutes(range.to);

    if (from <= to) {
      return current >= from && current <= to;
    }

    return current >= from || current <= to;
  });

  return match?.multiplier ?? 0;
}

function convertTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

export function calculateScore(
  metrics: MetricDefinition[],
  values: Record<string, MetricValue>,
): ScoreResult {
  const results = metrics.map((metric) =>
    calculateMetricScore(metric, values[metric.id] ?? metric.defaultValue),
  );

  const totalScore = results.reduce((sum, metric) => sum + metric.score, 0);

  const totalBonus = results.reduce((sum, metric) => sum + metric.bonus, 0);

  const totalWeight = results.reduce((sum, metric) => sum + metric.weight, 0);

  return {
    totalScore: Math.round(totalScore),
    totalXP: Math.round(totalBonus),
    metrics: results,
    totalWeights: totalWeight,
  };
}

function buildResult(
  metric: MetricDefinition,
  value: MetricValue,
  score: Pick<MetricScoreResult, "score" | "weightedScore" | "bonus">,
): MetricScoreResult {
  return {
    metricId: metric.id,
    value,
    weight: metric.weight,
    ...score,
  };
}
