"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft } from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api/client";
import StreakRuleEditor from "@/components/settings/StreakRuleEditor";
import VisualizationFieldLabel from "@/components/settings/VisualizationFieldLabel";
import {
  AllowedCombination,
  VISUALIZATION_COMBINATIONS,
  getProviderScopes,
  normalizeVisualizationOptions,
} from "@/lib/visualizations/validation";
import {
  VisualizationAggregation,
  VisualizationComparison,
  VisualizationDefinition,
  VisualizationExecutorType,
  VisualizationPeriod,
  VisualizationProviderType,
  VisualizationScope,
  VisualizationWidget,
} from "@/models/visualization";
import { MetricDefinition } from "@/models/metric";
import { toast } from "sonner";

const INTERNAL_COMPOSITE_STREAK_KEY = "__composite_streak__";

const SCOPE_OPTIONS: VisualizationScope[] = ["global", "goal", "category"];

const NATIVE_SELECT_CLASS =
  "border-input bg-background text-foreground focus:ring-primary/40 h-12 w-full appearance-none rounded-[10px] border px-4 pr-12 text-lg transition outline-none focus:ring-1";

interface ProviderExecutorOption {
  provider: VisualizationProviderType;
  executor: VisualizationExecutorType;
}

export default function NewVisualizationPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [goals, setGoals] = useState<MetricDefinition[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [visualization, setVisualization] = useState<VisualizationDefinition>({
    id: crypto.randomUUID(),
    title: "",
    description: undefined,
    widget: "stat-card",
    scope: "global",
    provider: "entry",
    executor: "stat",
    key: "score",
    period: { type: "days", value: 30 },
    aggregation: "latest",
    displayOrder: NaN,
    visible: true,
  });

  useEffect(() => {
    async function loadGoals() {
      if (!user) return;

      try {
        setGoalsLoading(true);
        const data = await apiRequest<MetricDefinition[]>(user, "/api/goals");
        setGoals(data ?? []);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load goals");
      } finally {
        setGoalsLoading(false);
      }
    }

    loadGoals();
  }, [user]);

  const widgetsByScope = useMemo(() => {
    const map: Record<VisualizationScope, VisualizationWidget[]> = {
      global: [],
      goal: [],
      category: [],
    };

    for (const [provider, executors] of Object.entries(
      VISUALIZATION_COMBINATIONS,
    ) as Array<
      [
        VisualizationProviderType,
        (
          | Partial<Record<VisualizationExecutorType, AllowedCombination>>
          | undefined
        ),
      ]
    >) {
      const scopes = getProviderScopes(provider as VisualizationProviderType);

      for (const [, combination] of Object.entries(executors ?? {}) as Array<
        [VisualizationExecutorType, AllowedCombination | undefined]
      >) {
        for (const widget of combination?.widgets ?? []) {
          for (const scope of scopes) {
            if (!map[scope].includes(widget)) {
              map[scope].push(widget);
            }
          }
        }
      }
    }

    return map;
  }, []);

  const providerExecutorOptions = useMemo<ProviderExecutorOption[]>(() => {
    const options: ProviderExecutorOption[] = [];

    for (const [provider, executors] of Object.entries(
      VISUALIZATION_COMBINATIONS,
    ) as Array<
      [
        VisualizationProviderType,
        (
          | Partial<Record<VisualizationExecutorType, AllowedCombination>>
          | undefined
        ),
      ]
    >) {
      const scopes = getProviderScopes(provider as VisualizationProviderType);

      if (!scopes.includes(visualization.scope)) continue;

      for (const [executor, combination] of Object.entries(
        executors ?? {},
      ) as Array<[VisualizationExecutorType, AllowedCombination | undefined]>) {
        if (combination?.widgets.includes(visualization.widget)) {
          options.push({
            provider: provider as VisualizationProviderType,
            executor,
          });
        }
      }
    }

    return options;
  }, [visualization.scope, visualization.widget]);

  const keyOptions = useMemo(() => {
    return getKeyOptions(visualization.provider, goals);
  }, [visualization.provider, goals]);

  const combination = useMemo(() => {
    return VISUALIZATION_COMBINATIONS[visualization.provider]?.[
      visualization.executor
    ];
  }, [visualization.provider, visualization.executor]);

  const isCompositeStreak = Boolean(visualization.options?.streakRule);

  function updateVisualization(partial: Partial<VisualizationDefinition>) {
    setVisualization((previous) => ({
      ...previous,
      ...partial,
    }));
  }

  function handleWidgetChange(widget: VisualizationWidget) {
    const validScopes = SCOPE_OPTIONS.filter((scope) =>
      widgetsByScope[scope].includes(widget),
    );

    const newScope = validScopes.includes(visualization.scope)
      ? visualization.scope
      : validScopes[0];

    const validProviders = providerExecutorOptionsFor(widget, newScope);
    const first = validProviders[0] ?? { provider: "entry", executor: "stat" };

    updateVisualization({
      widget,
      scope: newScope,
      provider: first.provider,
      executor: first.executor,
      key: getDefaultKey(first.provider, goals),
      aggregation: getDefaultAggregation(first.provider, first.executor),
      options: undefined,
    });
  }

  function handleScopeChange(scope: VisualizationScope) {
    const validWidgets = widgetsByScope[scope];
    const newWidget = validWidgets.includes(visualization.widget)
      ? visualization.widget
      : validWidgets[0];

    const validProviders = providerExecutorOptionsFor(newWidget, scope);
    const first = validProviders[0] ?? { provider: "entry", executor: "stat" };

    updateVisualization({
      scope,
      widget: newWidget,
      provider: first.provider,
      executor: first.executor,
      key: getDefaultKey(first.provider, goals),
      aggregation: getDefaultAggregation(first.provider, first.executor),
      options: undefined,
    });
  }

  function handleProviderExecutorChange(value: string) {
    const [provider, executor] = value.split("|") as [
      VisualizationProviderType,
      VisualizationExecutorType,
    ];

    updateVisualization({
      provider,
      executor,
      key: getDefaultKey(provider, goals),
      aggregation: getDefaultAggregation(provider, executor),
      options: undefined,
    });
  }

  async function handleSubmit() {
    if (!user) return;

    try {
      setCreating(true);

      const combination =
        VISUALIZATION_COMBINATIONS[visualization.provider]?.[
          visualization.executor
        ];

      if (!combination) {
        toast.error("Selected visualization configuration is invalid.");
        return;
      }

      const payload: VisualizationDefinition = {
        ...visualization,
        title: visualization.title.trim(),
        description: visualization.description?.trim() || undefined,
        key: isCompositeStreak
          ? INTERNAL_COMPOSITE_STREAK_KEY
          : visualization.key.trim(),
        options: normalizeVisualizationOptions(
          visualization.options,
          combination.options,
        ),
      };

      await apiRequest(user, "/api/visualizations", {
        method: "POST",
        body: payload,
      });

      toast.success("Visualization created");
      router.push("/settings/visualizations");
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Failed to create visualization",
      );
    } finally {
      setCreating(false);
    }
  }

  const hasValidPeriod =
    visualization.period.type === "all" ||
    (Number.isInteger(visualization.period.value) &&
      visualization.period.value > 0);

  const hasValidDisplayOrder =
    Number.isNaN(visualization.displayOrder) ||
    (Number.isFinite(visualization.displayOrder) &&
      visualization.displayOrder > 0);

  const canSubmit =
    visualization.title.trim().length > 0 &&
    (isCompositeStreak || visualization.key.trim().length > 0) &&
    hasValidPeriod &&
    hasValidDisplayOrder;

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-screen-sm px-4 pt-4 pb-28">
        <button
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ChevronLeft size={18} />
          Back
        </button>

        <h1 className="mb-8 text-3xl font-bold tracking-tight">
          Add Visualization
        </h1>

        <div className="space-y-6">
          <div className="space-y-2">
            <VisualizationFieldLabel topic="title" htmlFor="title">
              Title
            </VisualizationFieldLabel>
            <Input
              id="title"
              value={visualization.title}
              onChange={(e) => updateVisualization({ title: e.target.value })}
              placeholder="e.g. Life Score Today"
            />
          </div>

          <div className="space-y-2">
            <VisualizationFieldLabel topic="description" htmlFor="description">
              Description
            </VisualizationFieldLabel>
            <Textarea
              id="description"
              value={visualization.description ?? ""}
              onChange={(e) =>
                updateVisualization({
                  description:
                    e.target.value === "" ? undefined : e.target.value,
                })
              }
              placeholder="What does this visualization show?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <VisualizationFieldLabel topic="widget" htmlFor="widget">
                Widget
              </VisualizationFieldLabel>
              <div className="relative">
                <select
                  id="widget"
                  value={visualization.widget}
                  onChange={(e) =>
                    handleWidgetChange(e.target.value as VisualizationWidget)
                  }
                  className={NATIVE_SELECT_CLASS}
                >
                  {widgetsByScope[visualization.scope].map((widget) => (
                    <option key={widget} value={widget}>
                      {toTitleCase(widget)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-2">
              <VisualizationFieldLabel topic="scope" htmlFor="scope">
                Scope
              </VisualizationFieldLabel>
              <div className="relative">
                <select
                  id="scope"
                  value={visualization.scope}
                  onChange={(e) =>
                    handleScopeChange(e.target.value as VisualizationScope)
                  }
                  className={NATIVE_SELECT_CLASS}
                >
                  {SCOPE_OPTIONS.map((scope) => (
                    <option key={scope} value={scope}>
                      {toTitleCase(scope)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {providerExecutorOptions.length > 1 && (
            <div className="space-y-2">
              <VisualizationFieldLabel
                topic="source"
                htmlFor="provider-executor"
              >
                Source
              </VisualizationFieldLabel>
              <div className="relative">
                <select
                  id="provider-executor"
                  value={`${visualization.provider}|${visualization.executor}`}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!value) return;
                    handleProviderExecutorChange(value);
                  }}
                  className={NATIVE_SELECT_CLASS}
                >
                  {providerExecutorOptions.map((option) => (
                    <option
                      key={`${option.provider}|${option.executor}`}
                      value={`${option.provider}|${option.executor}`}
                    >
                      {toTitleCase(option.provider)} /{" "}
                      {toTitleCase(option.executor)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2" />
              </div>
            </div>
          )}

          {combination?.options.streakRule ? (
            <StreakRuleEditor
              goals={goals}
              value={visualization.options?.streakRule}
              onChange={(streakRule) =>
                updateVisualization({
                  options: {
                    ...visualization.options,
                    streakRule,
                  },
                })
              }
            />
          ) : (
            <div className="space-y-2">
              <VisualizationFieldLabel topic="data" htmlFor="key">
                Data
              </VisualizationFieldLabel>
              {goalsLoading ? (
                <div className="text-muted-foreground text-sm">
                  Loading goals...
                </div>
              ) : (
                <div className="relative">
                  <select
                    id="key"
                    value={visualization.key}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (!value) return;
                      updateVisualization({ key: value });
                    }}
                    className={NATIVE_SELECT_CLASS}
                  >
                    {keyOptions.length === 0 ? (
                      <option value="" disabled>
                        No options available
                      </option>
                    ) : (
                      keyOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2" />
                </div>
              )}
            </div>
          )}

          {combination && (
            <div className="space-y-2">
              <VisualizationFieldLabel
                topic="aggregation"
                htmlFor="aggregation"
              >
                Aggregation
              </VisualizationFieldLabel>
              <div className="relative">
                <select
                  id="aggregation"
                  value={visualization.aggregation}
                  onChange={(e) =>
                    updateVisualization({
                      aggregation: e.target.value as VisualizationAggregation,
                    })
                  }
                  className={NATIVE_SELECT_CLASS}
                >
                  {combination.aggregations.map((aggregation) => (
                    <option key={aggregation} value={aggregation}>
                      {toTitleCase(aggregation)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2" />
              </div>
            </div>
          )}

          <PeriodEditor
            period={visualization.period}
            onChange={(period) => updateVisualization({ period })}
          />

          {combination?.options.comparison && (
            <div className="space-y-2">
              <VisualizationFieldLabel topic="comparison" htmlFor="comparison">
                Comparison
              </VisualizationFieldLabel>
              <div className="relative">
                <select
                  id="comparison"
                  value={visualization.options?.comparison ?? "previous-day"}
                  onChange={(e) =>
                    updateVisualization({
                      options: {
                        ...visualization.options,
                        comparison: e.target.value as VisualizationComparison,
                      },
                    })
                  }
                  className={NATIVE_SELECT_CLASS}
                >
                  <option value="previous-day">Previous day</option>
                  <option value="previous-period">Previous period</option>
                </select>
                <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2" />
              </div>
            </div>
          )}

          {combination?.options.greenIfDeltaPositive && (
            <div className="flex items-center justify-between">
              <VisualizationFieldLabel
                topic="greenIfDeltaPositive"
                htmlFor="green-if-delta-positive"
              >
                Green if delta positive
              </VisualizationFieldLabel>
              <Switch
                id="green-if-delta-positive"
                checked={visualization.options?.greenIfDeltaPositive ?? false}
                onCheckedChange={(checked) =>
                  updateVisualization({
                    options: {
                      ...visualization.options,
                      greenIfDeltaPositive: checked,
                    },
                  })
                }
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <VisualizationFieldLabel topic="visible" htmlFor="visible">
                Visible
              </VisualizationFieldLabel>
              <p className="text-muted-foreground text-sm">Show on dashboard</p>
            </div>
            <Switch
              id="visible"
              checked={visualization.visible}
              onCheckedChange={(checked) =>
                updateVisualization({ visible: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <VisualizationFieldLabel
              topic="displayOrder"
              htmlFor="display-order"
            >
              Display order
            </VisualizationFieldLabel>
            <Input
              id="display-order"
              type="number"
              value={
                Number.isNaN(visualization.displayOrder)
                  ? ""
                  : visualization.displayOrder
              }
              placeholder="Auto"
              onChange={(e) =>
                updateVisualization({
                  displayOrder:
                    e.target.value === "" ? NaN : Number(e.target.value),
                })
              }
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
              disabled={creating}
            >
              Cancel
            </Button>

            <Button
              className="flex-[2]"
              onClick={handleSubmit}
              disabled={creating || !canSubmit}
            >
              {creating ? "Creating..." : "Add Visualization"}
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function PeriodEditor({
  period,
  onChange,
}: {
  period: VisualizationPeriod;
  onChange: (period: VisualizationPeriod) => void;
}) {
  const isAll = period.type === "all";

  return (
    <div className="space-y-2">
      <VisualizationFieldLabel topic="period" htmlFor="period">
        Period
      </VisualizationFieldLabel>

      <div className="flex items-center gap-3">
        <div className="relative w-40">
          <select
            id="period"
            value={isAll ? "all" : "days"}
            onChange={(e) =>
              onChange(
                e.target.value === "all"
                  ? { type: "all" }
                  : {
                      type: "days",
                      value: period.type === "days" ? period.value : 30,
                    },
              )
            }
            className={NATIVE_SELECT_CLASS}
          >
            <option value="days">Last N days</option>
            <option value="all">All time</option>
          </select>
          <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2" />
        </div>

        {!isAll && (
          <Input
            type="number"
            min={1}
            value={period.value}
            onChange={(e) =>
              onChange({ type: "days", value: Number(e.target.value) })
            }
            className="w-28"
          />
        )}
      </div>
    </div>
  );
}

function providerExecutorOptionsFor(
  widget: VisualizationWidget,
  scope: VisualizationScope,
): ProviderExecutorOption[] {
  const options: ProviderExecutorOption[] = [];

  for (const [provider, executors] of Object.entries(
    VISUALIZATION_COMBINATIONS,
  ) as Array<
    [
      VisualizationProviderType,
      (
        | Partial<Record<VisualizationExecutorType, AllowedCombination>>
        | undefined
      ),
    ]
  >) {
    if (
      !getProviderScopes(provider as VisualizationProviderType).includes(scope)
    )
      continue;

    for (const [executor, combination] of Object.entries(
      executors ?? {},
    ) as Array<[VisualizationExecutorType, AllowedCombination | undefined]>) {
      if (combination?.widgets.includes(widget)) {
        options.push({
          provider: provider as VisualizationProviderType,
          executor,
        });
      }
    }
  }

  return options;
}

function getKeyOptions(
  provider: VisualizationProviderType,
  goals: MetricDefinition[],
): Array<{ value: string; label: string }> {
  if (provider === "entry") {
    return [
      { value: "score", label: "Life score" },
      { value: "xp", label: "XP" },
    ];
  }

  if (provider === "category") {
    return [{ value: "all", label: "All categories" }];
  }

  return goals.map((goal) => ({
    value: goal.label,
    label: goal.label,
  }));
}

function getDefaultKey(
  provider: VisualizationProviderType,
  goals: MetricDefinition[],
): string {
  if (provider === "entry") return "score";
  if (provider === "category") return "all";
  return goals[0]?.label ?? "";
}

function getDefaultAggregation(
  provider: VisualizationProviderType,
  executor: VisualizationExecutorType,
): VisualizationAggregation {
  return (
    VISUALIZATION_COMBINATIONS[provider]?.[executor]?.aggregations[0] ??
    "latest"
  );
}

function toTitleCase(value: string) {
  return value
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}
