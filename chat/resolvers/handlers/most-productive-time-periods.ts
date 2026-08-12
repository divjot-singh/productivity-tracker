import type { DeterministicResolver, ResolverHelpers } from "../types";

export function createMostProductiveTimePeriodsResolver(
  helpers: ResolverHelpers,
): DeterministicResolver {
  return (context) => {
    const window = helpers.getLastNDaysEntries(context.entries, 28).entries;
    if (window.length < 3) {
      return {
        refusalReason:
          "Insufficient evidence to identify productive time periods.",
      };
    }

    const byWeekday = new Map<string, { total: number; count: number }>();
    for (const entry of window) {
      const weekday = new Date(
        `${entry.date}T00:00:00.000Z`,
      ).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
      const current = byWeekday.get(weekday) ?? { total: 0, count: 0 };
      current.total += entry.score ?? 0;
      current.count += 1;
      byWeekday.set(weekday, current);
    }

    const ranked = [...byWeekday.entries()]
      .map(([day, stats]) => ({
        day,
        avg: stats.total / stats.count,
        count: stats.count,
      }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 3)
      .map(
        (item, index) =>
          `| ${index + 1} | ${item.day} | ${Math.round(item.avg)} | ${item.count} |`,
      );

    return {
      answer: [
        "## Most Productive Time Periods (Last 28 Days)",
        "| Rank | Weekday | Avg Score | Entries |",
        "| --- | --- | ---: | ---: |",
        ...ranked,
      ].join("\n"),
      evidence: helpers.buildEntryEvidence(
        context.userId,
        [...window].reverse(),
      ),
      confidence: "high",
    };
  };
}
