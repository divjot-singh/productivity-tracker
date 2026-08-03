import { VisualizationExecutorType } from "@/models/visualization";

import { VisualizationExecutor } from "./executor-types";
import { heatmapExecutor } from "./heatmap.executor";
import { insightExecutor } from "./insight.executor";
import { leaderboardExecutor } from "./leaderboard.executor";
import { progressExecutor } from "./progress.executor";
import { statExecutor } from "./stat.executor";
import { streakExecutor } from "./streak.executor";
import { timelineExecutor } from "./timeline.executor";
import { trendExecutor } from "./trend.executor";

export const executorRegistry: Record<
  VisualizationExecutorType,
  VisualizationExecutor
> = {
  stat: statExecutor,
  trend: trendExecutor,
  progress: progressExecutor,
  streak: streakExecutor,
  leaderboard: leaderboardExecutor,
  heatmap: heatmapExecutor,
  timeline: timelineExecutor,
  insight: insightExecutor,
};
