import type { MetricDefinition } from "@/models/metric";
import type { DeterministicResolver, ResolverHelpers } from "../types";

export function createFrequentThemesTagsResolver(
  helpers: ResolverHelpers,
): DeterministicResolver {
  return (context) => {
    const window = helpers.getLastNDaysEntries(context.entries, 28).entries;
    if (window.length === 0) {
      return { refusalReason: "No entries found in the last 28 days." };
    }

    const counts = new Map<string, number>();
    const goalById = context.goals.reduce<Record<string, MetricDefinition>>(
      (acc, goal) => {
        acc[goal.id] = goal;
        return acc;
      },
      {},
    );

    for (const entry of window) {
      for (const [metricId, value] of Object.entries(entry.values)) {
        if (typeof value === "boolean" && value) {
          counts.set(metricId, (counts.get(metricId) ?? 0) + 1);
        }
      }
    }

    const themes = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([metricId, count], index) => {
        const label = goalById[metricId]?.label ?? metricId;
        return `| ${index + 1} | ${label} | ${count} |`;
      });

    const bodyRows =
      themes.length > 0
        ? themes
        : ["| 1 | No recurring boolean themes detected | 0 |"];

    return {
      answer: [
        "## Frequent Themes (Last 28 Days)",
        "| Rank | Theme | Active Days |",
        "| --- | --- | ---: |",
        ...bodyRows,
      ].join("\n"),
      evidence: helpers.buildEntryEvidence(
        context.userId,
        [...window].reverse(),
      ),
      confidence: "high",
    };
  };
}
