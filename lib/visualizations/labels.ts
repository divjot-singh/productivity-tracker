import type {
  VisualizationProviderType,
  VisualizationScope,
} from "@/models/visualization";

// Plain names for the model's internal scope/provider values.
const SCOPE_LABELS: Record<VisualizationScope, string> = {
  global: "Overall",
  goal: "Goals & exercises",
  category: "Categories",
};

const PROVIDER_LABELS: Record<VisualizationProviderType, string> = {
  entry: "Daily score",
  metric: "Goal value",
  goal: "Goal rules",
  category: "Category score",
  exercise: "Exercise stats",
};

export const scopeLabel = (scope: VisualizationScope) =>
  SCOPE_LABELS[scope] ?? scope;

export const providerLabel = (provider: VisualizationProviderType) =>
  PROVIDER_LABELS[provider] ?? provider;
