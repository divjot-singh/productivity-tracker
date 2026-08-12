import type { DeterministicResolver, ResolverHelpers } from "../types";

export function createMetricMostImprovedResolver(
  helpers: ResolverHelpers,
): DeterministicResolver {
  return (context) => {
    const deltas = helpers
      .buildMetricDelta(context.entries, context.goals)
      .sort((a, b) => b.delta - a.delta);
    const best = deltas[0];

    if (!best) {
      return {
        refusalReason:
          "Insufficient evidence to compute metric improvement over the last 14 days.",
      };
    }

    return {
      answer: [
        "## Most Improved Metric (Last 14 Days)",
        "| Metric | Before | After | Delta |",
        "| --- | ---: | ---: | ---: |",
        `| ${best.goal.label} | ${Math.round(best.before * 100)}% | ${Math.round(best.after * 100)}% | +${Math.round(best.delta * 100)} pts |`,
      ].join("\n"),
      evidence: [
        {
          id: best.goal.id,
          source: `users/${context.userId}/goals/${best.goal.id}`,
          timestamp: helpers.formatYyyyMmDd(
            helpers.getAnchorDate(context.entries),
          ),
          snippet: `${best.goal.label} completion moved from ${Math.round(best.before * 100)}% to ${Math.round(best.after * 100)}% over the last 14 days`,
        },
      ],
      confidence: "high",
    };
  };
}
