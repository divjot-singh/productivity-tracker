import type { DeterministicResolver, ResolverHelpers } from "../types";

export function createCurrentGoalStatusResolver(
  helpers: ResolverHelpers,
): DeterministicResolver {
  return (context) => {
    const week = helpers.getLastNDaysEntries(context.entries, 7);
    if (week.entries.length === 0) {
      return { refusalReason: "No entries found for the current week." };
    }

    const statusRows = context.goals.map((goal, index) => {
      const completions = week.entries
        .map((entry) => helpers.computeEntryGoalCompletion(entry, goal))
        .filter((v): v is number => v !== null);
      const avg = helpers.average(completions);
      const pct = Math.round(avg * 100);
      const latest = week.entries[week.entries.length - 1];
      const latestCompletion = helpers.computeEntryGoalCompletion(latest, goal);
      const latestPct =
        latestCompletion === null
          ? "n/a"
          : `${Math.round(latestCompletion * 100)}%`;

      return `| ${index + 1} | ${goal.label} | ${pct}% | ${latestPct} |`;
    });

    return {
      answer: [
        "## Current Goal Status",
        `Period: **${week.from} to ${week.to}**`,
        "| # | Goal | Avg Completion (Week) | Latest Day Completion |",
        "| --- | --- | ---: | ---: |",
        ...statusRows,
      ].join("\n"),
      evidence: helpers.buildEntryEvidence(
        context.userId,
        [...week.entries].reverse(),
      ),
      confidence: "high",
    };
  };
}
