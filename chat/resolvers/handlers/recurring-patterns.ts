import type { MetricDefinition } from "@/models/metric";
import type { DeterministicResolver, ResolverHelpers } from "../types";

function createRecurringResolver(
  helpers: ResolverHelpers,
  mode: "high" | "low",
): DeterministicResolver {
  return (context) => {
    const window = helpers.getLastNDaysEntries(context.entries, 28).entries;
    if (window.length < 3) {
      return {
        refusalReason:
          "Insufficient evidence to identify recurring score patterns.",
      };
    }

    const sortedByScore = [...window].sort(
      (a, b) => (a.score ?? 0) - (b.score ?? 0),
    );
    const sampleSize = Math.max(3, Math.floor(sortedByScore.length / 3));
    const target =
      mode === "high"
        ? sortedByScore.slice(-sampleSize)
        : sortedByScore.slice(0, sampleSize);

    const metricCounts = new Map<string, number>();
    for (const entry of target) {
      for (const [metricId, value] of Object.entries(entry.values)) {
        if (typeof value === "boolean" && value) {
          metricCounts.set(metricId, (metricCounts.get(metricId) ?? 0) + 1);
        }
      }
    }

    const goalById = context.goals.reduce<Record<string, MetricDefinition>>(
      (acc, goal) => {
        acc[goal.id] = goal;
        return acc;
      },
      {},
    );

    const topPatterns = [...metricCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([metricId, count], index) => {
        const label = goalById[metricId]?.label ?? metricId;
        return `| ${index + 1} | ${label} | ${count}/${target.length} |`;
      });

    const rows =
      topPatterns.length > 0
        ? topPatterns
        : ["| 1 | No recurring boolean patterns detected | 0/0 |"];

    return {
      answer: [
        `## ${mode === "high" ? "Recurring Patterns on High-Score Days" : "Recurring Patterns on Low-Score Days"}`,
        "Last 28 days sample",
        "| Rank | Pattern | Frequency |",
        "| --- | --- | ---: |",
        ...rows,
      ].join("\n"),
      evidence: helpers.buildEntryEvidence(
        context.userId,
        [...target].reverse(),
      ),
      confidence: "high",
    };
  };
}

export function createRecurringHighPatternsResolver(
  helpers: ResolverHelpers,
): DeterministicResolver {
  return createRecurringResolver(helpers, "high");
}

export function createRecurringLowPatternsResolver(
  helpers: ResolverHelpers,
): DeterministicResolver {
  return createRecurringResolver(helpers, "low");
}
