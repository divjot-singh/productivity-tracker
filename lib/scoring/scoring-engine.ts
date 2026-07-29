import {
  MetricDefinition,
  MetricValue,
  OptionScore,
  RangeScore,
  TimeRangeScore,
} from "@/models/metric";

import { MetricScoreResult, ScoreResult } from "./scoring-types";

function calculateMetricScore(
  metric: MetricDefinition,
  value: MetricValue,
): MetricScoreResult {
  let weightedScore = 0;
  let bonus = 0;

  switch (metric.scoring.type) {
    case "goal": {
      if (
        typeof metric.target !== "number" ||
        typeof value !== "number" ||
        metric.target <= 0
      ) {
        break;
      }

      const progress = Math.min(value / metric.target, 1);

      weightedScore = progress * metric.weight;

      bonus = value > metric.target ? (metric.scoring.bonusRate ?? 0) : 0;

      weightedScore += bonus;

      break;
    }

    case "range": {
      const score = calculateRangeScore(value, metric.scoring.ranges);

      weightedScore = (score / 10) * metric.weight;

      break;
    }

    case "time-range": {
      const score = calculateTimeRangeScore(value, metric.scoring.time);

      weightedScore = score;

      break;
    }

    case "options": {
      weightedScore = calculateOptionScore(value, metric.scoring.options);

      bonus = weightedScore > metric.weight ? weightedScore - metric.weight : 0;
      break;
    }

    case "multiplier": {
      if (typeof value !== "number") {
        break;
      }

      const maxScore = metric.scoring.maxScore;
      const score = value * (metric.scoring.multiplier ?? 1);
      if (!!maxScore) {
        weightedScore = Math.min(score, maxScore);
      } else {
        weightedScore = score;
      }
      if (metric.scoring.bonusRate) {
        bonus =
          weightedScore > metric.weight
            ? (metric.weight += metric.scoring.bonusRate)
            : 0;
      } else {
        bonus =
          weightedScore > metric.weight ? weightedScore - metric.weight : 0;
      }

      break;
    }

    case "boolean": {
      weightedScore = value === metric.target ? metric.weight : 0;

      break;
    }
  }

  return {
    metricId: metric.id,
    value,
    score: weightedScore,
    weight: metric.weight,
    weightedScore,
    bonus,
  };
}

function calculateRangeScore(
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

  return match?.score ?? 0;
}

function calculateOptionScore(
  value: MetricValue,
  options?: OptionScore[],
): number {
  if (!options?.length) {
    return 0;
  }

  return options.find((option) => option.value === value)?.score ?? 0;
}

function calculateTimeRangeScore(
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

  return match?.score ?? 0;
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

  const totalWeight = metrics.reduce((sum, metric) => sum + metric.weight, 0);

  const weightedTotal = results.reduce(
    (sum, metric) => sum + metric.weightedScore,
    0,
  );

  console.log(weightedTotal, "weightedTotal");
  console.log(
    results.map((r) => {
      return {
        score: r.score,
        bonus: r.bonus,
        weight: metrics.find((m) => m.id == r.metricId)?.weight,
        label: metrics.find((m) => m.id == r.metricId)?.label,
      };
    }),
    "results",
  );

  return {
    totalScore: totalWeight === 0 ? 0 : Math.round(weightedTotal),

    totalXP: totalWeight,

    metrics: results,
    totalHeight: totalWeight,
  };
}
