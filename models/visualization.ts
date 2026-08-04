export type VisualizationScope = "global" | "goal" | "category";

export type VisualizationPeriod =
  | {
      type: "days";
      value: number;
    }
  | {
      type: "all";
    };
export type VisualizationProviderType =
  "entry" | "metric" | "goal" | "category";
export type VisualizationExecutorType =
  | "trend"
  | "progress"
  | "stat"
  | "streak"
  | "leaderboard"
  | "heatmap"
  | "timeline"
  | "insight";

export type StatEntryKey = "score" | "xp";

export type VisualizationComparison = "previous-day" | "previous-period";

export interface VisualizationOptions {
  comparison?: VisualizationComparison;
  greenIfDeltaPositive?: boolean;
}

export type VisualizationAggregation =
  | "latest"
  | "sum"
  | "average"
  | "count"
  | "daily"
  | "weekly"
  | "monthly"
  | "rolling-average"
  | "streak";

export type VisualizationWidget =
  | "stat-card"
  | "progress-bar"
  | "progress-ring"
  | "line-chart"
  | "bar-chart"
  | "area-chart"
  | "heatmap"
  | "leaderboard"
  | "timeline"
  | "radar-chart"
  | "insight-card";

export interface VisualizationDefinition {
  id: string;

  title: string;

  description?: string;

  widget: VisualizationWidget;

  scope: VisualizationScope;

  provider: VisualizationProviderType;

  executor: VisualizationExecutorType;

  key: string;

  period: VisualizationPeriod;

  aggregation: VisualizationAggregation;

  displayOrder: number;

  visible: boolean;

  options?: VisualizationOptions;
}

export interface VisualizationResponse<T = unknown> {
  id: string;

  title: string;

  widget: VisualizationWidget;

  subtitle?: string;

  data: T;
}
