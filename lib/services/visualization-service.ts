import { DailyEntry } from "@/models/entry";
import { MetricDefinition } from "@/models/metric";
import {
  ExerciseDefinition,
  WorkoutCombination,
  WorkoutEntry,
} from "@/models/workout";
import {
  VisualizationDefinition,
  VisualizationResponse,
} from "@/models/visualization";

import { executorRegistry } from "../visualizations/executors/executor-registry";
import { providerRegistry } from "../visualizations/providers/provider-registry";
import { ProviderContext } from "../visualizations/providers/provider-types";

import {
  filterEntriesByPeriod,
  expandPeriodForComparison,
} from "../visualizations/utils";

export class VisualizationService {
  async generate(
    definitions: VisualizationDefinition[],
    goals: MetricDefinition[],
    entries: DailyEntry[],
    workouts: WorkoutEntry[],
    exercises: ExerciseDefinition[],
    combinations: WorkoutCombination[],
  ): Promise<VisualizationResponse[]> {
    const responses = await Promise.all(
      definitions
        .filter((definition) => definition.visible)
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map(async (definition) => {
          const provider = providerRegistry[definition.provider];
          const executor = executorRegistry[definition.executor];

          const requiredPeriod = expandPeriodForComparison(
            definition.period,
            definition.options?.comparison,
          );

          const filteredEntries = filterEntriesByPeriod(
            entries,
            requiredPeriod,
          );

          const context: ProviderContext = {
            visualization: definition,
            goals,
            entries: filteredEntries,
            workouts,
            exercises,
            combinations,
          };

          const data = await provider.getData(context);

          return executor.execute(definition, data);
        }),
    );

    return responses;
  }
}
