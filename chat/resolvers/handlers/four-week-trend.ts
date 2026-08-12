import type { DeterministicResolver, ResolverHelpers } from "../types";

export function createFourWeekTrendResolver(
  helpers: ResolverHelpers,
): DeterministicResolver {
  return (context) => {
    const window = helpers.getLastNDaysEntries(context.entries, 28);
    const chunks: string[] = [];
    for (let i = 0; i < 4; i++) {
      const end = helpers.subtractDays(helpers.parseDate(window.to), i * 7);
      const start = helpers.subtractDays(end, 6);
      const from = helpers.formatYyyyMmDd(start);
      const to = helpers.formatYyyyMmDd(end);
      const group = helpers.filterEntriesByDateRange(context.entries, from, to);
      const avgScore = helpers.average(group.map((entry) => entry.score ?? 0));
      chunks.push(`| ${4 - i} | ${from} to ${to} | ${Math.round(avgScore)} |`);
    }

    return {
      answer: [
        "## Productivity Trend (Last 4 Weeks)",
        "| Week | Range | Avg Score |",
        "| --- | --- | ---: |",
        ...chunks.reverse(),
      ].join("\n"),
      evidence: helpers.buildEntryEvidence(
        context.userId,
        [...window.entries].reverse(),
      ),
      confidence: "high",
    };
  };
}
