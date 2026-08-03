import { VisualizationProviderType } from "@/models/visualization";
import { VisualizationProvider } from "./provider-types";
import { entryProvider } from "./entry-provider";
import { metricHistoryProvider } from "./metric-history-provider";
import { categoryProvider } from "./category-provider";
import { goalProvider } from "./goal-provider";

export const providerRegistry: Record<
  VisualizationProviderType,
  VisualizationProvider<unknown>
> = {
  entry: entryProvider,
  metric: metricHistoryProvider,
  goal: goalProvider,
  category: categoryProvider,
};
