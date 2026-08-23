import { DailyEntry } from "@/models/entry";
import { MetricDefinition } from "@/models/metric";
import {
  VisualizationDefinition,
  VisualizationResponse,
} from "@/models/visualization";

import { executorRegistry } from "./executors/executor-registry";
import { providerRegistry } from "./providers/provider-registry";

export function buildVisualization(
  visualization: VisualizationDefinition,
  goals: MetricDefinition[],
  entries: DailyEntry[],
): VisualizationResponse {
  const provider = providerRegistry[visualization.provider];

  if (!provider) {
    throw new Error(
      `Unknown visualization provider "${visualization.provider}"`,
    );
  }

  const executor = executorRegistry[visualization.executor];

  if (!executor) {
    throw new Error(
      `Unknown visualization executor "${visualization.executor}"`,
    );
  }

  const rawData = provider.getData({
    visualization,
    goals,
    entries,
    exercises: [],
    workouts: [],
  });

  return executor.execute(visualization, rawData);
}
