import {
  VisualizationAggregation,
  VisualizationDefinition,
  VisualizationExecutorType,
  VisualizationOptions,
  VisualizationPeriod,
  VisualizationProviderType,
  VisualizationScope,
  VisualizationWidget,
} from "@/models/visualization";

export interface AllowedCombination {
  widgets: VisualizationWidget[];
  keys: string[] | "*";
  aggregations: VisualizationAggregation[];
  options: {
    comparison?: boolean;
    greenIfDeltaPositive?: boolean;
  };
}

export const VISUALIZATION_COMBINATIONS: Partial<
  Record<
    VisualizationProviderType,
    Partial<Record<VisualizationExecutorType, AllowedCombination>>
  >
> = {
  entry: {
    stat: {
      widgets: ["stat-card"],
      keys: ["score", "xp"],
      aggregations: ["latest", "sum", "average", "count"],
      options: { comparison: true },
    },
    trend: {
      widgets: ["line-chart", "bar-chart", "area-chart"],
      keys: ["score", "xp"],
      aggregations: ["daily"],
      options: {},
    },
    heatmap: {
      widgets: ["heatmap"],
      keys: ["score", "xp"],
      aggregations: ["daily"],
      options: {},
    },
    timeline: {
      widgets: ["timeline"],
      keys: ["score", "xp"],
      aggregations: ["daily"],
      options: { greenIfDeltaPositive: true },
    },
  },
  metric: {
    stat: {
      widgets: ["stat-card"],
      keys: "*",
      aggregations: ["latest", "sum", "average", "count"],
      options: { comparison: true },
    },
    trend: {
      widgets: ["line-chart", "bar-chart", "area-chart"],
      keys: "*",
      aggregations: ["daily"],
      options: {},
    },
    streak: {
      widgets: ["stat-card"],
      keys: "*",
      aggregations: ["streak"],
      options: {},
    },
    timeline: {
      widgets: ["timeline"],
      keys: "*",
      aggregations: ["daily"],
      options: { greenIfDeltaPositive: true },
    },
    insight: {
      widgets: ["insight-card"],
      keys: "*",
      aggregations: ["average"],
      options: {},
    },
    progress: {
      widgets: ["progress-bar", "progress-ring"],
      keys: "*",
      aggregations: ["latest"],
      options: {},
    },
  },
  goal: {
    streak: {
      widgets: ["stat-card"],
      keys: "*",
      aggregations: ["streak"],
      options: {},
    },
    progress: {
      widgets: ["progress-bar", "progress-ring"],
      keys: "*",
      aggregations: ["latest"],
      options: {},
    },
  },
  category: {
    trend: {
      widgets: ["radar-chart"],
      keys: ["all"],
      aggregations: ["average"],
      options: {},
    },
    leaderboard: {
      widgets: ["leaderboard"],
      keys: ["all"],
      aggregations: ["average"],
      options: {},
    },
  },
};

export interface ValidationContext {
  goalLabels?: string[];
}

const PROVIDER_SCOPE_MAP: Record<
  VisualizationProviderType,
  VisualizationScope[]
> = {
  entry: ["global"],
  metric: ["goal"],
  goal: ["goal"],
  category: ["category"],
};

const COMPARISON_VALUES: VisualizationOptions["comparison"][] = [
  "previous-day",
  "previous-period",
];

export function getProviderScopes(
  provider: VisualizationProviderType,
): VisualizationScope[] {
  return PROVIDER_SCOPE_MAP[provider] ?? [];
}

export function normalizeVisualizationOptions(
  options: VisualizationOptions | undefined,
  allowed: AllowedCombination["options"],
): VisualizationOptions | undefined {
  const normalized: VisualizationOptions = {};

  if (allowed.comparison) {
    normalized.comparison =
      options?.comparison && COMPARISON_VALUES.includes(options.comparison)
        ? options.comparison
        : "previous-day";
  }

  if (allowed.greenIfDeltaPositive) {
    normalized.greenIfDeltaPositive =
      typeof options?.greenIfDeltaPositive === "boolean"
        ? options.greenIfDeltaPositive
        : false;
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

export function validateVisualizationDefinition(
  definition: VisualizationDefinition,
  context?: ValidationContext,
): string[] {
  const errors: string[] = [];

  if (!definition.id?.trim()) errors.push("id is required");
  if (!definition.title?.trim()) errors.push("title is required");
  if (!definition.widget) errors.push("widget is required");
  if (!definition.scope) errors.push("scope is required");
  if (!definition.provider) errors.push("provider is required");
  if (!definition.executor) errors.push("executor is required");
  if (!definition.key?.trim()) errors.push("key is required");

  if (
    typeof definition.displayOrder !== "number" ||
    !Number.isFinite(definition.displayOrder) ||
    definition.displayOrder <= 0
  ) {
    errors.push("displayOrder must be a positive number");
  }

  if (typeof definition.visible !== "boolean") {
    errors.push("visible must be a boolean");
  }

  const periodError = validatePeriod(definition.period);
  if (periodError) errors.push(periodError);

  const combination =
    VISUALIZATION_COMBINATIONS[definition.provider]?.[definition.executor];

  if (!combination) {
    errors.push(
      `Provider '${definition.provider}' does not support executor '${definition.executor}'.`,
    );
    return errors;
  }

  if (!combination.widgets.includes(definition.widget)) {
    errors.push(
      `Widget '${definition.widget}' is not supported for ${definition.provider}/${definition.executor}. Allowed: ${combination.widgets.join(", ")}.`,
    );
  }

  const supportedScopes = getProviderScopes(definition.provider);

  if (!supportedScopes.includes(definition.scope)) {
    errors.push(
      `Scope '${definition.scope}' is not supported for provider '${definition.provider}'. Allowed: ${supportedScopes.join(", ")}.`,
    );
  }

  if (combination.keys !== "*" && !combination.keys.includes(definition.key)) {
    errors.push(
      `Key '${definition.key}' is not supported for ${definition.provider}/${definition.executor}. Allowed: ${combination.keys.join(", ")}.`,
    );
  }

  if (
    combination.keys === "*" &&
    context?.goalLabels?.length &&
    !context.goalLabels.some(
      (label) => label.toLowerCase() === definition.key.toLowerCase(),
    )
  ) {
    errors.push(
      `Key '${definition.key}' does not match any existing goal label.`,
    );
  }

  if (!combination.aggregations.includes(definition.aggregation)) {
    errors.push(
      `Aggregation '${definition.aggregation}' is not supported for ${definition.provider}/${definition.executor}. Allowed: ${combination.aggregations.join(", ")}.`,
    );
  }

  const optionsError = validateOptions(definition.options, combination.options);
  if (optionsError) errors.push(optionsError);

  return errors;
}

function validatePeriod(
  period: VisualizationPeriod | undefined,
): string | null {
  if (!period) return "period is required";

  if (period.type === "all") return null;

  if (period.type === "days") {
    if (!Number.isInteger(period.value) || period.value <= 0) {
      return "period.value must be a positive integer when type is 'days'";
    }
    return null;
  }

  return `period.type '${(period as { type: string }).type}' is not supported`;
}

function validateOptions(
  options: VisualizationOptions | undefined,
  allowed: AllowedCombination["options"],
): string | null {
  if (!options) return null;

  const allowedKeys = new Set<keyof VisualizationOptions>();
  if (allowed.comparison) allowedKeys.add("comparison");
  if (allowed.greenIfDeltaPositive) allowedKeys.add("greenIfDeltaPositive");

  for (const key of Object.keys(options) as Array<keyof VisualizationOptions>) {
    if (!allowedKeys.has(key)) {
      return `Option '${key}' is not supported for this visualization configuration.`;
    }
  }

  if (
    options.comparison !== undefined &&
    !COMPARISON_VALUES.includes(options.comparison)
  ) {
    return "Option 'comparison' must be either 'previous-day' or 'previous-period'.";
  }

  if (
    options.greenIfDeltaPositive !== undefined &&
    typeof options.greenIfDeltaPositive !== "boolean"
  ) {
    return "Option 'greenIfDeltaPositive' must be a boolean.";
  }

  return null;
}

export function getAllowedCombinations() {
  const result: Array<{
    provider: VisualizationProviderType;
    executor: VisualizationExecutorType;
    widget: VisualizationWidget;
    scope: VisualizationScope;
  }> = [];

  for (const [provider, executors] of Object.entries(
    VISUALIZATION_COMBINATIONS,
  ) as Array<
    [
      VisualizationProviderType,
      (typeof VISUALIZATION_COMBINATIONS)[VisualizationProviderType],
    ]
  >) {
    for (const [executor, combination] of Object.entries(
      executors ?? {},
    ) as Array<[VisualizationExecutorType, AllowedCombination]>) {
      for (const widget of combination.widgets) {
        for (const scope of getProviderScopes(provider)) {
          result.push({ provider, executor, widget, scope });
        }
      }
    }
  }

  return result;
}
