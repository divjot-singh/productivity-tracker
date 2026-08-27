import { MetricHistoryData, VisualizationProvider } from "./provider-types";
import { normalizeVisualizationKey } from "../utils";

export const metricHistoryProvider: VisualizationProvider<MetricHistoryData> = {
  async getData({ visualization, goals, entries }) {
    const metricId = visualization.key;
    const normalizedKey = normalizeVisualizationKey(visualization.key);

    const goal = goals.find(
      (item) => normalizeVisualizationKey(item.label) === normalizedKey,
    );

    if (!goal) {
      throw new Error(`Goal '${metricId}' not found.`);
    }
    const history = entries
      .map((entry) => {
        const metric = entry.breakdown?.find(
          (item) => item.metricId === goal.id,
        );

        if (!metric) {
          return null;
        }

        return {
          date: entry.date,
          value: metric.value,
          score: metric.score,
          weight: metric.weight,
          bonus: metric.bonus,
          xp: metric.xp ?? metric.bonus ?? 0,
        };
      })
      .filter(
        (
          item,
        ): item is {
          date: string;
          value: number | boolean | string;
          score: number;
          weight: number;
          bonus: number;
          xp: number;
        } => item !== null,
      )
      .sort((a, b) => a.date.localeCompare(b.date));

    const values =
      visualization.aggregation === "weekly"
        ? aggregateWeeklyMetricHistory(history, goal.type)
        : history;

    const valueKind =
      visualization.aggregation === "weekly"
        ? "number"
        : goal.type === "time"
          ? "time"
          : goal.type === "boolean"
            ? "boolean"
            : "number";

    return {
      id: goal.id,
      label: goal.label,
      category: goal.category,
      valueKind,
      unit: goal.unit,
      target:
        visualization.aggregation === "weekly" && goal.type === "boolean"
          ? 5
          : goal.target,
      values,
    };
  },
};

function aggregateWeeklyMetricHistory(
  history: Array<{
    date: string;
    value: number | boolean | string;
    score: number;
    weight: number;
    bonus: number;
    xp: number;
  }>,
  goalType: "boolean" | "number" | "time",
) {
  const byWeek = new Map<
    string,
    {
      date: string;
      count: number;
      trueCount: number;
      numericSum: number;
      scoreSum: number;
      weightSum: number;
      bonusSum: number;
      xpSum: number;
    }
  >();

  for (const item of history) {
    const weekStart = getWeekStartIso(item.date);
    const current = byWeek.get(weekStart) ?? {
      date: weekStart,
      count: 0,
      trueCount: 0,
      numericSum: 0,
      scoreSum: 0,
      weightSum: 0,
      bonusSum: 0,
      xpSum: 0,
    };

    current.count += 1;
    current.scoreSum += item.score;
    current.weightSum += item.weight;
    current.bonusSum += item.bonus;
    current.xpSum += item.xp;

    if (goalType === "boolean") {
      if (item.value === true) {
        current.trueCount += 1;
      }
    } else {
      const numeric = toNumericValue(item.value, goalType);
      if (numeric !== null) {
        current.numericSum += numeric;
      }
    }

    byWeek.set(weekStart, current);
  }

  return [...byWeek.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((bucket) => ({
      date: bucket.date,
      value:
        goalType === "boolean"
          ? bucket.trueCount
          : bucket.count > 0
            ? Number((bucket.numericSum / bucket.count).toFixed(2))
            : 0,
      score: Number((bucket.scoreSum / Math.max(1, bucket.count)).toFixed(2)),
      weight: Number((bucket.weightSum / Math.max(1, bucket.count)).toFixed(2)),
      bonus: Number((bucket.bonusSum / Math.max(1, bucket.count)).toFixed(2)),
      xp: Number((bucket.xpSum / Math.max(1, bucket.count)).toFixed(2)),
    }));
}

function getWeekStartIso(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00Z`);
  const day = date.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  date.setUTCDate(date.getUTCDate() - diffToMonday);
  return date.toISOString().slice(0, 10);
}

function toNumericValue(
  value: number | boolean | string,
  goalType: "number" | "time",
) {
  if (typeof value === "number") {
    return value;
  }

  if (goalType === "time" && typeof value === "string") {
    const match = /^(\d{1,2}):(\d{2})$/.exec(value);
    if (match) {
      return Number(match[1]) * 60 + Number(match[2]);
    }
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}
