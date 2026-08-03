import {
  VisualizationDefinition,
  VisualizationResponse,
} from "@/models/visualization";
import {
  StatCardData,
  ProgressBarData,
  ProgressRingData,
  TrendChartData,
  LeaderboardData,
  HeatmapData,
  TimelineData,
  InsightCardData,
  ComparisonData,
} from "../types";

export type VisualizationData =
  | StatCardData
  | ProgressBarData
  | ProgressRingData
  | TrendChartData
  | LeaderboardData
  | HeatmapData
  | TimelineData
  | InsightCardData
  | ComparisonData;

export interface VisualizationExecutor<
  TInput = unknown,
  TOutput = VisualizationData,
> {
  execute(
    visualization: VisualizationDefinition,
    data: TInput,
  ): VisualizationResponse<TOutput>;
}
