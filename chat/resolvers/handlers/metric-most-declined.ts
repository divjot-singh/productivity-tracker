import type { DeterministicResolver, ResolverHelpers } from "../types";

export function createMetricMostDeclinedResolver(
  helpers: ResolverHelpers,
): DeterministicResolver {
  return (context) => {
    const deltas = helpers
      .buildMetricDelta(context.entries, context.goals)
      .sort((a, b) => a.delta - b.delta);
    const worst = deltas[0];

    if (!worst) {
      return {
        refusalReason:
          "Insufficient evidence to compute metric decline over the last 14 days.",
      };
    }

    return {
      answer: [
        "## Most Declined Metric (Last 14 Days)",
        "| Metric | Before | After | Delta |",
        "| --- | ---: | ---: | ---: |",
        `| ${worst.goal.label} | ${Math.round(worst.before * 100)}% | ${Math.round(worst.after * 100)}% | ${Math.round(worst.delta * 100)} pts |`,
      ].join("\n"),
      evidence: [
        {
          id: worst.goal.id,
          source: `users/${context.userId}/goals/${worst.goal.id}`,
          timestamp: helpers.formatYyyyMmDd(
            helpers.getAnchorDate(context.entries),
          ),
          snippet: `${worst.goal.label} completion moved from ${Math.round(worst.before * 100)}% to ${Math.round(worst.after * 100)}% over the last 14 days`,
        },
      ],
      confidence: "high",
    };
  };
}
