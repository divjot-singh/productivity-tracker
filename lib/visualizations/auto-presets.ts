import type { MetricDefinition } from "@/models/metric";
import type { VisualizationDefinition } from "@/models/visualization";

const MAX_GOAL_WIDGETS = 10;

type Draft = Omit<VisualizationDefinition, "visible" | "displayOrder">;

function finish(drafts: Draft[]): VisualizationDefinition[] {
  return drafts.map((draft, index) => ({
    ...draft,
    displayOrder: (index + 1) * 10,
    visible: true,
  }));
}

function scoreWidgets(
  suffix: "score" | "percent",
  key: "score" | "scorePercent",
  name: string,
): Draft[] {
  return [
    {
      id: `auto-${suffix}-latest-${suffix}`,
      title: `${name} today`,
      widget: "stat-card",
      scope: "global",
      provider: "entry",
      executor: "stat",
      key,
      period: { type: "days", value: 7 },
      aggregation: "latest",
      options: { comparison: "previous-day" },
    },
    {
      id: `auto-${suffix}-average-${suffix}`,
      title: `${name} (7 day average)`,
      widget: "stat-card",
      scope: "global",
      provider: "entry",
      executor: "stat",
      key,
      period: { type: "days", value: 7 },
      aggregation: "average",
      options: { comparison: "previous-period" },
    },
    {
      id: `auto-${suffix}-trend-${suffix}`,
      title: `${name} trend`,
      description: "Last 30 days",
      widget: "line-chart",
      scope: "global",
      provider: "entry",
      executor: "trend",
      key,
      period: { type: "days", value: 30 },
      aggregation: "daily",
    },
  ];
}

function goalWidget(goal: MetricDefinition): Draft | null {
  const base = {
    scope: "goal" as const,
    key: goal.label,
    id: `auto-goal-${goal.id}`,
  };

  if (goal.type === "boolean") {
    return {
      ...base,
      title: `${goal.label} streak`,
      description: "Current and best streak",
      widget: "stat-card",
      provider: "goal",
      executor: "streak",
      period: { type: "days", value: 90 },
      aggregation: "streak",
    };
  }

  if (goal.type === "time") {
    return {
      ...base,
      title: goal.label,
      description: "Recent pattern and shifts",
      widget: "timeline",
      provider: "metric",
      executor: "timeline",
      period: { type: "days", value: 21 },
      aggregation: "daily",
      options: { greenIfDeltaPositive: false },
    };
  }

  if (goal.scoring.type === "options") {
    return null;
  }

  return {
    ...base,
    title: `${goal.label} trend`,
    description: "Last 30 days",
    widget: goal.scoring.type === "goal" ? "bar-chart" : "line-chart",
    provider: "metric",
    executor: "trend",
    period: { type: "days", value: 30 },
    aggregation: "daily",
  };
}

// Builds a dashboard from whatever goals the user has; widget choice follows each goal's type and scoring.
export function buildAutoVisualizations(
  goals: MetricDefinition[],
): VisualizationDefinition[] {
  const active = goals.filter((goal) => goal.status !== "archived");

  const drafts: Draft[] = [
    ...scoreWidgets("score", "score", "Life score"),
    ...scoreWidgets("percent", "scorePercent", "Score %"),
    {
      id: "auto-consistency-heatmap",
      title: "Consistency",
      description: "Daily score % over the last 12 weeks",
      widget: "heatmap",
      scope: "global",
      provider: "entry",
      executor: "heatmap",
      key: "scorePercent",
      period: { type: "days", value: 84 },
      aggregation: "daily",
    },
  ];

  const categories = new Set(active.map((goal) => goal.category));

  if (categories.size >= 2) {
    drafts.push(
      {
        id: "auto-category-radar",
        title: "Category balance",
        description: "Average score by category, last 30 days",
        widget: "radar-chart",
        scope: "category",
        provider: "category",
        executor: "trend",
        key: "all",
        period: { type: "days", value: 30 },
        aggregation: "average",
      },
      {
        id: "auto-category-leaderboard",
        title: "Category ranking",
        description: "Average score by category, last 30 days",
        widget: "leaderboard",
        scope: "category",
        provider: "category",
        executor: "leaderboard",
        key: "all",
        period: { type: "days", value: 30 },
        aggregation: "average",
      },
    );
  }

  // Zero-weight goals are trackers (e.g. body weight); they always get a chart, then the heaviest scored goals fill the rest.
  const trackers = active.filter((goal) => goal.weight === 0);
  const scored = active
    .filter((goal) => goal.weight > 0)
    .sort((a, b) => b.weight - a.weight);

  const goalDrafts = [...trackers, ...scored]
    .map(goalWidget)
    .filter((draft): draft is Draft => draft !== null)
    .slice(0, MAX_GOAL_WIDGETS);

  return finish([...drafts, ...goalDrafts]);
}

export type ScoreView = "score" | "percent" | "both";

// Score widgets carry their variant in the id so the page can show score, percent, or both.
export function matchesScoreView(id: string, view: ScoreView): boolean {
  if (view === "both") return true;

  if (id.endsWith("-score")) return view === "score";

  if (id.endsWith("-percent")) return view === "percent";

  return true;
}
