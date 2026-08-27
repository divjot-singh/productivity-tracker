import type { DeterministicResolver } from "../types";

type WeekBucket = {
  weekStart: string;
  weekEnd: string;
  totalLoggedDays: number;
  weightTrainingYesDays: number;
};

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

function formatYyyyMmDd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfWeekMonday(date: Date): Date {
  const day = date.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  return new Date(date.getTime() - diffToMonday * 24 * 60 * 60 * 1000);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function parseWeightTrainingValue(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return ["true", "yes", "1", "done"].includes(normalized);
  }
  return false;
}

function resolveWeightTrainingMetricIds(goalId: string): string[] {
  return [goalId, `metric-${goalId}`];
}

export const createWorkoutWeightTrainingCyclesResolver =
  (): DeterministicResolver => {
    return (context) => {
      const goal = context.goals.find((candidate) => {
        const label = candidate.label.toLowerCase();
        return (
          label.includes("weight") &&
          label.includes("training") &&
          typeof candidate.target === "boolean"
        );
      });

      if (!goal) {
        return {
          refusalReason:
            "I couldn't find a 'Weight training' goal definition to compute weekly cycles.",
        };
      }

      const metricIds = resolveWeightTrainingMetricIds(goal.id);
      const entriesInRange = context.entries
        .filter((entry) => entry.date >= context.dateFrom && entry.date <= context.dateTo)
        .sort((left, right) => left.date.localeCompare(right.date));

      if (entriesInRange.length === 0) {
        return {
          refusalReason:
            "No daily entries were found in the selected date range to compute weight-training cycles.",
        };
      }

      const dateTo = toDate(context.dateTo);
      const weekMap = new Map<string, WeekBucket>();

      for (const entry of entriesInRange) {
        const entryDate = toDate(entry.date);
        const weekStartDate = startOfWeekMonday(entryDate);
        const weekEndDate = addDays(weekStartDate, 6);

        // A cycle only applies to full Monday-Sunday windows ending within the query range.
        if (weekEndDate > dateTo) {
          continue;
        }

        const weekStart = formatYyyyMmDd(weekStartDate);
        const weekEnd = formatYyyyMmDd(weekEndDate);

        const existing = weekMap.get(weekStart) ?? {
          weekStart,
          weekEnd,
          totalLoggedDays: 0,
          weightTrainingYesDays: 0,
        };

        existing.totalLoggedDays += 1;

        const isYes = metricIds.some((metricId) =>
          parseWeightTrainingValue(entry.values[metricId]),
        );
        if (isYes) {
          existing.weightTrainingYesDays += 1;
        }

        weekMap.set(weekStart, existing);
      }

      const weeklyBuckets = [...weekMap.values()].sort((a, b) =>
        a.weekStart.localeCompare(b.weekStart),
      );

      const cycles = weeklyBuckets.filter(
        (bucket) => bucket.weightTrainingYesDays >= 5,
      ).length;

      const rows = weeklyBuckets.length
        ? weeklyBuckets.map(
            (bucket, index) =>
              `| ${index + 1} | ${bucket.weekStart} | ${bucket.weekEnd} | ${bucket.weightTrainingYesDays} | ${bucket.weightTrainingYesDays >= 5 ? "Yes" : "No"} |`,
          )
        : ["| 1 | n/a | n/a | 0 | No |"];

      const evidence = context.entries
        .filter((entry) => entry.date >= context.dateFrom && entry.date <= context.dateTo)
        .slice(0, 20)
        .map((entry) => ({
          id: entry.id || entry.date,
          source: `users/${context.userId}/entries/${entry.id || entry.date}`,
          timestamp: entry.date,
          snippet: `${goal.label}: ${String(
            metricIds
              .map((metricId) => entry.values[metricId])
              .find((value) => value !== undefined),
          )}`,
        }));

      return {
        answer: [
          "## Weight Training Cycles",
          `Using Monday-Sunday weeks and counting a cycle when **Weight training = yes on at least 5 days**, you have completed **${cycles}** cycle${cycles === 1 ? "" : "s"} between **${context.dateFrom}** and **${context.dateTo}**.`,
          "",
          "| # | Week Start (Mon) | Week End (Sun) | Yes Days | Cycle (>=5) |",
          "| --- | --- | --- | ---: | --- |",
          ...rows,
        ].join("\n"),
        evidence,
        confidence: "high",
      };
    };
  };
