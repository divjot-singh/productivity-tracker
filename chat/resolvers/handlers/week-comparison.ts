import type { DeterministicResolver, ResolverHelpers } from "../types";

export function createWeekComparisonResolver(
  helpers: ResolverHelpers,
): DeterministicResolver {
  return (context) => {
    const currentWeek = helpers.getLastNDaysEntries(context.entries, 7);
    const previousWeekTo = helpers.formatYyyyMmDd(
      helpers.subtractDays(helpers.parseDate(currentWeek.from), 1),
    );
    const previousWeekFrom = helpers.formatYyyyMmDd(
      helpers.subtractDays(helpers.parseDate(previousWeekTo), 6),
    );
    const previousWeekEntries = helpers.filterEntriesByDateRange(
      context.entries,
      previousWeekFrom,
      previousWeekTo,
    );

    const currentAvg = helpers.average(
      currentWeek.entries.map((entry) => entry.score ?? 0),
    );
    const previousAvg = helpers.average(
      previousWeekEntries.map((entry) => entry.score ?? 0),
    );
    const diff = Math.round(currentAvg - previousAvg);
    const diffDisplay = `${diff >= 0 ? "+" : ""}${diff}`;

    return {
      answer: [
        "## This Week vs Last Week",
        "| Period | Date Range | Avg Score | Entries |",
        "| --- | --- | ---: | ---: |",
        `| This Week | ${currentWeek.from} to ${currentWeek.to} | ${Math.round(currentAvg)} | ${currentWeek.entries.length} |`,
        `| Last Week | ${previousWeekFrom} to ${previousWeekTo} | ${Math.round(previousAvg)} | ${previousWeekEntries.length} |`,
        "",
        `**Change:** ${diffDisplay} points`,
      ].join("\n"),
      evidence: helpers.buildEntryEvidence(
        context.userId,
        [...currentWeek.entries, ...previousWeekEntries].sort((a, b) =>
          b.date.localeCompare(a.date),
        ),
      ),
      confidence: "high",
    };
  };
}
