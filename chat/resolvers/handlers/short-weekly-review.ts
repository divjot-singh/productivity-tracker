import type { DeterministicResolver, ResolverHelpers } from "../types";

export function createShortWeeklyReviewResolver(
  helpers: ResolverHelpers,
): DeterministicResolver {
  return (context) => {
    const currentWeek = helpers.getLastNDaysEntries(context.entries, 7);
    if (currentWeek.entries.length === 0) {
      return { refusalReason: "No entries found for the current week." };
    }

    const avg = helpers.average(
      currentWeek.entries.map((entry) => entry.score ?? 0),
    );
    const best = [...currentWeek.entries].sort(
      (a, b) => (b.score ?? 0) - (a.score ?? 0),
    )[0];
    const worst = [...currentWeek.entries].sort(
      (a, b) => (a.score ?? 0) - (b.score ?? 0),
    )[0];

    return {
      answer: [
        "## Short Weekly Review",
        `Period: **${currentWeek.from} to ${currentWeek.to}**`,
        "| Metric | Value |",
        "| --- | --- |",
        `| Entries Logged | ${currentWeek.entries.length} |`,
        `| Average Score | ${Math.round(avg)} |`,
        `| Best Day | ${best.date} (${best.score ?? 0}) |`,
        `| Lowest Day | ${worst.date} (${worst.score ?? 0}) |`,
      ].join("\n"),
      evidence: helpers.buildEntryEvidence(
        context.userId,
        [...currentWeek.entries].reverse(),
      ),
      confidence: "high",
    };
  };
}
