import type { DeterministicResolver, ResolverHelpers } from "../types";

export function createHighestProductivityDayResolver(
  helpers: ResolverHelpers,
): DeterministicResolver {
  return (context) => {
    const week = helpers.getLastNDaysEntries(context.entries, 7);
    if (week.entries.length === 0) {
      return { refusalReason: "No entries found for the current week." };
    }

    const best = [...week.entries].sort(
      (a, b) => (b.score ?? 0) - (a.score ?? 0),
    )[0];

    return {
      answer: [
        "## Highest Productivity Day (This Week)",
        `Period: **${week.from} to ${week.to}**`,
        "| Date | Score |",
        "| --- | ---: |",
        `| ${best.date} | ${best.score ?? 0} |`,
      ].join("\n"),
      evidence: helpers.buildEntryEvidence(context.userId, [best]),
      confidence: "high",
    };
  };
}
