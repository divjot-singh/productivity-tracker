import type { DeterministicResolver, ResolverHelpers } from "../types";

export function createWeekVsLastWeekEntriesResolver(
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

    return {
      answer: [
        "## Weekly Entry Count Comparison",
        "| Period | Date Range | Entries Logged |",
        "| --- | --- | ---: |",
        `| This Week | ${currentWeek.from} to ${currentWeek.to} | ${currentWeek.entries.length} |`,
        `| Last Week | ${previousWeekFrom} to ${previousWeekTo} | ${previousWeekEntries.length} |`,
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
