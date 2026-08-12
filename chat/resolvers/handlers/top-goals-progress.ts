import type { MetricDefinition } from "@/models/metric";
import type { DeterministicResolver, ResolverHelpers } from "../types";

function parseTopN(message: string, fallback = 3): number {
  const match = message.toLowerCase().match(/\btop\s+(\d+)\b/);
  if (!match) return fallback;

  const parsed = Number(match[1]);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;

  return Math.min(parsed, 10);
}

export function createTopGoalsProgressResolver(
  helpers: ResolverHelpers,
): DeterministicResolver {
  return (context) => {
    const message = context.message.toLowerCase();
    const wantsWeekComparison =
      /\bthis\s+week\b/.test(message) &&
      /\b(last|previous)\s+week\b/.test(message);
    const requestedTopN = parseTopN(context.message, 3);
    const rankGoals = (entries: typeof context.entries) =>
      context.goals
        .map((goal) => {
          const completionValues = entries
            .map((entry) => helpers.computeEntryGoalCompletion(entry, goal))
            .filter((value): value is number => value !== null);

          if (completionValues.length === 0) {
            return null;
          }

          const averageCompletion =
            completionValues.reduce((sum, value) => sum + value, 0) /
            completionValues.length;

          return {
            goal,
            averageCompletion,
            samples: completionValues.length,
          };
        })
        .filter(
          (
            item,
          ): item is {
            goal: MetricDefinition;
            averageCompletion: number;
            samples: number;
          } => item !== null,
        )
        .sort((a, b) => b.averageCompletion - a.averageCompletion)
        .slice(0, requestedTopN);

    if (wantsWeekComparison) {
      const currentWeek = helpers.getLastNDaysEntries(context.entries, 7);
      const previousWeekTo = helpers.formatYyyyMmDd(
        helpers.subtractDays(helpers.parseDate(currentWeek.from), 1),
      );
      const previousWeekFrom = helpers.formatYyyyMmDd(
        helpers.subtractDays(helpers.parseDate(previousWeekTo), 6),
      );
      const previousWeekEntries = helpers.filterEntriesByDateRange(
        context.entries,
        previousWeekFrom,
        previousWeekTo,
      );

      const currentRankedGoals = rankGoals(currentWeek.entries);
      const previousRankedGoals = rankGoals(previousWeekEntries);

      if (currentRankedGoals.length === 0 && previousRankedGoals.length === 0) {
        return {
          refusalReason:
            "Insufficient evidence to calculate top goals for this week and last week.",
        };
      }

      const buildTable = (
        title: string,
        from: string,
        to: string,
        goals: Array<{
          goal: MetricDefinition;
          averageCompletion: number;
          samples: number;
        }>,
      ) => {
        if (goals.length === 0) {
          return `### ${title} (${from} to ${to})\nNo goal completion data for this period.`;
        }

        const rows = goals
          .map((item, index) => {
            const percent = Math.round(item.averageCompletion * 100);
            return `| ${index + 1} | ${item.goal.label} | ${percent}% | ${item.samples} |`;
          })
          .join("\n");

        return [
          `### ${title} (${from} to ${to})`,
          "| Rank | Goal | Avg Completion | Entries |",
          "| --- | --- | ---: | ---: |",
          rows,
        ].join("\n");
      };

      return {
        answer: [
          `## Top ${requestedTopN} Goals by Completion`,
          buildTable(
            "This Week",
            currentWeek.from,
            currentWeek.to,
            currentRankedGoals,
          ),
          buildTable(
            "Last Week",
            previousWeekFrom,
            previousWeekTo,
            previousRankedGoals,
          ),
        ].join("\n\n"),
        evidence: [...currentRankedGoals, ...previousRankedGoals].map(
          (item) => ({
            id: item.goal.id,
            source: `users/${context.userId}/goals/${item.goal.id}`,
            timestamp: context.dateTo,
            snippet: `${item.goal.label} completion ${Math.round(item.averageCompletion * 100)}% based on ${item.samples} entries`,
          }),
        ),
        confidence: "high",
      };
    }

    const rankedGoals = rankGoals(context.entries);

    if (rankedGoals.length === 0) {
      return {
        refusalReason:
          "Insufficient evidence to calculate top goals by completion progress for the selected period.",
      };
    }

    const summaryRows = rankedGoals
      .map((item, index) => {
        const percent = Math.round(item.averageCompletion * 100);
        return `| ${index + 1} | ${item.goal.label} | ${percent}% | ${item.samples} |`;
      })
      .join("\n");

    return {
      answer: [
        `## Top ${rankedGoals.length} Goals by Completion`,
        `${context.dateFrom} to ${context.dateTo}`,
        "| Rank | Goal | Avg Completion | Entries |",
        "| --- | --- | ---: | ---: |",
        summaryRows,
      ].join("\n\n"),
      evidence: rankedGoals.map((item) => ({
        id: item.goal.id,
        source: `users/${context.userId}/goals/${item.goal.id}`,
        timestamp: context.dateTo,
        snippet: `${item.goal.label} completion ${Math.round(item.averageCompletion * 100)}% based on ${item.samples} entries`,
      })),
      confidence: "high",
    };
  };
}
