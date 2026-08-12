import type { DeterministicResolver, ResolverHelpers } from "../types";

export function createFamilyHealthGoalsEnabledResolver(
  helpers: ResolverHelpers,
): DeterministicResolver {
  return (context) => {
    const filtered = context.goals.filter(
      (goal) => goal.category === "family" || goal.category === "health",
    );

    if (filtered.length === 0) {
      return {
        refusalReason:
          "No family or health goals are currently enabled for this user.",
      };
    }

    const rows = filtered.map(
      (goal, index) =>
        `| ${index + 1} | ${goal.label} | ${goal.category} | ${String(goal.target)} |`,
    );

    return {
      answer: [
        "## Family and Health Goals",
        "Currently enabled goals:",
        "| # | Goal | Category | Target |",
        "| --- | --- | --- | --- |",
        ...rows,
      ].join("\n"),
      evidence: filtered.slice(0, 10).map((goal) => ({
        id: goal.id,
        source: `users/${context.userId}/goals/${goal.id}`,
        timestamp: helpers.formatYyyyMmDd(
          helpers.getAnchorDate(context.entries),
        ),
        snippet: `${goal.label} category ${goal.category}, target ${String(goal.target)}`,
      })),
      confidence: "high",
    };
  };
}
