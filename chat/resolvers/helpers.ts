import type { DailyEntry } from "@/models/entry";
import type { MetricDefinition } from "@/models/metric";
import type { DateRange, ResolverHelpers } from "./types";

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

function formatYyyyMmDd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function subtractDays(date: Date, days: number): Date {
  return new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
}

function getAnchorDate(entries: DailyEntry[]): Date {
  if (entries.length === 0) {
    return new Date();
  }

  const max = entries
    .map((entry) => parseDate(entry.date).getTime())
    .reduce((a, b) => (a > b ? a : b), 0);
  return new Date(max);
}

function filterEntriesByDateRange(
  entries: DailyEntry[],
  from: string,
  to: string,
): DailyEntry[] {
  return entries
    .filter((entry) => entry.date >= from && entry.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getLastNDaysEntries(entries: DailyEntry[], days: number): DateRange {
  const anchor = getAnchorDate(entries);
  const to = formatYyyyMmDd(anchor);
  const from = formatYyyyMmDd(subtractDays(anchor, days - 1));
  return {
    from,
    to,
    entries: filterEntriesByDateRange(entries, from, to),
  };
}

function buildEntryEvidence(uid: string, entries: DailyEntry[], limit = 10) {
  return entries.slice(0, limit).map((entry) => ({
    id: entry.id || entry.date,
    source: `users/${uid}/entries/${entry.id || entry.date}`,
    timestamp: entry.date,
    snippet: `score ${entry.score ?? 0}, xp ${entry.xp ?? 0}`,
  }));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function computeEntryGoalCompletion(
  entry: DailyEntry,
  goal: MetricDefinition,
): number | null {
  const breakdownItem = entry.breakdown?.find(
    (item) => item.metricId === goal.id,
  );
  if (breakdownItem && breakdownItem.weight > 0) {
    const ratio = breakdownItem.score / breakdownItem.weight;
    return Math.max(0, Math.min(1, ratio));
  }

  const value = entry.values[goal.id];
  if (value === undefined) return null;

  if (typeof value === "boolean") {
    if (typeof goal.target === "boolean") {
      return value === goal.target ? 1 : 0;
    }
    return value ? 1 : 0;
  }

  if (typeof value === "number") {
    if (typeof goal.target === "number" && goal.target !== 0) {
      const ratio = value / goal.target;
      return Math.max(0, Math.min(1, ratio));
    }
    return null;
  }

  if (typeof value === "string" && typeof goal.target === "string") {
    return value === goal.target ? 1 : 0;
  }

  return null;
}

function buildMetricDelta(entries: DailyEntry[], goals: MetricDefinition[]) {
  const window = getLastNDaysEntries(entries, 14).entries;
  const first = window.slice(0, 7);
  const second = window.slice(7);

  return goals
    .map((goal) => {
      const firstVals = first
        .map((entry) => computeEntryGoalCompletion(entry, goal))
        .filter((v): v is number => v !== null);
      const secondVals = second
        .map((entry) => computeEntryGoalCompletion(entry, goal))
        .filter((v): v is number => v !== null);

      if (firstVals.length === 0 || secondVals.length === 0) {
        return null;
      }

      const before = average(firstVals);
      const after = average(secondVals);

      return {
        goal,
        before,
        after,
        delta: after - before,
      };
    })
    .filter(
      (
        item,
      ): item is {
        goal: MetricDefinition;
        before: number;
        after: number;
        delta: number;
      } => item !== null,
    );
}

export function createResolverHelpers(): ResolverHelpers {
  return {
    computeEntryGoalCompletion,
    getLastNDaysEntries,
    parseDate,
    subtractDays,
    formatYyyyMmDd,
    filterEntriesByDateRange,
    average,
    buildMetricDelta,
    buildEntryEvidence,
    getAnchorDate,
  };
}
