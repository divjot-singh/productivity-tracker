"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api/client";
import {
  AllowedCombination,
  VISUALIZATION_COMBINATIONS,
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

const SCOPE_OPTIONS: VisualizationScope[] = ["global", "goal", "category"];

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
      const scopes = providerToScopes(provider as VisualizationProviderType);

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
      const scopes = providerToScopes(provider as VisualizationProviderType);

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

      await apiRequest(user, "/api/visualizations", {
        method: "POST",
        body: visualization,
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

  const canSubmit = visualization.title.trim().length > 0;

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
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={visualization.title}
              onChange={(e) => updateVisualization({ title: e.target.value })}
              placeholder="e.g. Life Score Today"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
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
              <Label htmlFor="widget">Widget</Label>
              <Select
                value={visualization.widget}
                onValueChange={(value) =>
                  handleWidgetChange(value as VisualizationWidget)
                }
              >
                <SelectTrigger id="widget">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {widgetsByScope[visualization.scope].map((widget) => (
                    <SelectItem key={widget} value={widget}>
                      {toTitleCase(widget)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scope">Scope</Label>
              <Select
                value={visualization.scope}
                onValueChange={(value) =>
                  handleScopeChange(value as VisualizationScope)
                }
              >
                <SelectTrigger id="scope">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCOPE_OPTIONS.map((scope) => (
                    <SelectItem key={scope} value={scope}>
                      {toTitleCase(scope)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {providerExecutorOptions.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="provider-executor">Source</Label>
              <Select
                value={`${visualization.provider}|${visualization.executor}`}
                onValueChange={(value) => {
                  if (!value) return;
                  handleProviderExecutorChange(value);
                }}
              >
                <SelectTrigger id="provider-executor">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {providerExecutorOptions.map((option) => (
                    <SelectItem
                      key={`${option.provider}|${option.executor}`}
                      value={`${option.provider}|${option.executor}`}
                    >
                      {toTitleCase(option.provider)} /{" "}
                      {toTitleCase(option.executor)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="key">Data</Label>
            {goalsLoading ? (
              <div className="text-muted-foreground text-sm">
                Loading goals...
              </div>
            ) : (
              <Select
                value={visualization.key}
                onValueChange={(value) => {
                  if (!value) return;
                  updateVisualization({ key: value });
                }}
              >
                <SelectTrigger id="key">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {keyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {combination && (
            <div className="space-y-2">
              <Label htmlFor="aggregation">Aggregation</Label>
              <Select
                value={visualization.aggregation}
                onValueChange={(value) =>
                  updateVisualization({
                    aggregation: value as VisualizationAggregation,
                  })
                }
              >
                <SelectTrigger id="aggregation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {combination.aggregations.map((aggregation) => (
                    <SelectItem key={aggregation} value={aggregation}>
                      {toTitleCase(aggregation)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <PeriodEditor
            period={visualization.period}
            onChange={(period) => updateVisualization({ period })}
          />

          {combination?.options.comparison && (
            <div className="space-y-2">
              <Label htmlFor="comparison">Comparison</Label>
              <Select
                value={visualization.options?.comparison ?? "previous-day"}
                onValueChange={(value) =>
                  updateVisualization({
                    options: {
                      ...visualization.options,
                      comparison: value as VisualizationComparison,
                    },
                  })
                }
              >
                <SelectTrigger id="comparison">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="previous-day">Previous day</SelectItem>
                  <SelectItem value="previous-period">
                    Previous period
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {combination?.options.greenIfDeltaPositive && (
            <div className="flex items-center justify-between">
              <Label htmlFor="green-if-delta-positive">
                Green if delta positive
              </Label>
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
              <Label htmlFor="visible">Visible</Label>
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
            <Label htmlFor="display-order">Display order</Label>
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
      <Label htmlFor="period">Period</Label>

      <div className="flex items-center gap-3">
        <Select
          value={isAll ? "all" : "days"}
          onValueChange={(value) =>
            onChange(
              value === "all"
                ? { type: "all" }
                : {
                    type: "days",
                    value: period.type === "days" ? period.value : 30,
                  },
            )
          }
        >
          <SelectTrigger id="period" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="days">Last N days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>

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

function providerToScopes(
  provider: VisualizationProviderType,
): VisualizationScope[] {
  switch (provider) {
    case "entry":
      return ["global"];
    case "metric":
    case "goal":
      return ["goal"];
    case "category":
      return ["category"];
    default:
      return [];
  }
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
      !providerToScopes(provider as VisualizationProviderType).includes(scope)
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
