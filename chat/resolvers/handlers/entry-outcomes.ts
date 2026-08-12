import type { MetricDefinition } from "@/models/metric";
import type { DailyEntry } from "@/models/entry";
import type { DeterministicResolver, ResolverHelpers } from "../types";

export function createEntryOutcomesResolver(
  helpers: ResolverHelpers,
): DeterministicResolver {
  return (context) => {
    const goalById = context.goals.reduce<Record<string, MetricDefinition>>(
      (acc, goal) => {
        acc[goal.id] = goal;
        return acc;
      },
      {},
    );

    const formatEntryDetail = (entry: DailyEntry): string => {
      const metricDetails = Object.entries(entry.values)
        .slice(0, 8)
        .map(([metricId, value]) => {
          const goal = goalById[metricId];
          const label = goal?.label ?? metricId;
          const target = goal?.target;
          const completion = goal
            ? helpers.computeEntryGoalCompletion(entry, goal)
            : null;

          const completionText =
            completion === null
              ? ""
              : `, completion ${Math.round(completion * 100)}%`;

          const targetText =
            target === undefined ? "" : `, target ${String(target)}`;

          return `${label}: ${String(value)}${targetText}${completionText}`;
        })
        .join("; ");

      const score = entry.score ?? 0;
      const xp = entry.xp ?? 0;

      return `score ${score}, xp ${xp}${metricDetails ? `, details: ${metricDetails}` : ""}`;
    };

    if (context.entries.length === 0) {
      return {
        refusalReason:
          "No entries found for the requested period, so I cannot summarize outcomes.",
      };
    }

    const sortedEntries = [...context.entries].sort((a, b) =>
      b.date.localeCompare(a.date),
    );
    const summaryRows = sortedEntries.slice(0, 10).map((entry, index) => {
      return `| ${index + 1} | ${entry.date} | ${entry.score ?? 0} | ${entry.xp ?? 0} | ${formatEntryDetail(entry)} |`;
    });

    return {
      answer: [
        "## Entry Outcomes",
        `Found **${sortedEntries.length}** entr${sortedEntries.length === 1 ? "y" : "ies"} for the selected period.`,
        "| # | Date | Score | XP | Details |",
        "| --- | --- | ---: | ---: | --- |",
        ...summaryRows,
      ].join("\n"),
      evidence: sortedEntries.slice(0, 10).map((entry) => ({
        id: entry.id || entry.date,
        source: `users/${context.userId}/entries/${entry.id || entry.date}`,
        timestamp: entry.date,
        snippet: formatEntryDetail(entry),
      })),
      confidence: "high",
    };
  };
}
