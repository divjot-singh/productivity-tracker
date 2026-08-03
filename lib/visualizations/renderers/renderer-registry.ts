import { VisualizationWidget } from "@/models/visualization";

import { VisualizationRenderer } from "./renderer-types";
import StatCardRenderer from "./stat-card.renderer";
import ProgressBarRenderer from "./progress-bar.renderer";
import ProgressRingRenderer from "./progress-ring.renderer";
import InsightCardRenderer from "./insight-card.renderer";
import LineChartRenderer from "./line-chart.renderer";
import AreaChart from "./area-chart.renderer";
import BarChart from "./bar-chart.renderer";
import HeatmapRenderer from "./heatmap.renderer";
import RadarChart from "./radar-chart.renderer";
import LeaderboardRenderer from "./leaderboard.renderer";
import TimelineRenderer from "./timeline.renderer";

export const rendererRegistry: Partial<
  Record<VisualizationWidget, VisualizationRenderer>
> = {
  "stat-card": StatCardRenderer as VisualizationRenderer,
  "progress-bar": ProgressBarRenderer as VisualizationRenderer,
  "line-chart": LineChartRenderer as VisualizationRenderer,
  "area-chart": AreaChart as VisualizationRenderer,
  "bar-chart": BarChart as VisualizationRenderer,
  heatmap: HeatmapRenderer as VisualizationRenderer,
  "radar-chart": RadarChart as VisualizationRenderer,
  "progress-ring": ProgressRingRenderer as VisualizationRenderer,
  leaderboard: LeaderboardRenderer as VisualizationRenderer,
  timeline: TimelineRenderer as VisualizationRenderer,
  "insight-card": InsightCardRenderer as VisualizationRenderer,
};
