"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, Pencil, Trash2 } from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import StreakRuleEditor from "@/components/settings/StreakRuleEditor";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api/client";
import {
  AllowedCombination,
  getProviderScopes,
  normalizeVisualizationOptions,
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
import VisualizationFieldLabel from "@/components/settings/VisualizationFieldLabel";

const INTERNAL_COMPOSITE_STREAK_KEY = "__composite_streak__";
const SCOPE_OPTIONS: VisualizationScope[] = ["global", "goal", "category"];
const NATIVE_SELECT_CLASS =
  "border-input bg-background text-foreground focus:ring-primary/40 h-12 w-full appearance-none rounded-[10px] border px-4 pr-12 text-lg transition outline-none focus:ring-1";

interface ProviderExecutorOption {
  provider: VisualizationProviderType;
  executor: VisualizationExecutorType;
}

export default function VisualizationDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [original, setOriginal] = useState<VisualizationDefinition | null>(
    null,
  );
  const [visualization, setVisualization] =
    useState<VisualizationDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [goals, setGoals] = useState<MetricDefinition[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user || !id) return;

      try {
        setLoading(true);
        setError(undefined);
        const data = await apiRequest<VisualizationDefinition>(
          user,
          `/api/visualizations/${id}`,
        );
        setOriginal(data);
        setVisualization(data);
      } catch (e) {
        console.error(e);
        setError("Failed to load visualization.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, user]);

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

  const combination = useMemo<AllowedCombination | null>(() => {
    if (!visualization) return null;
    return (
      VISUALIZATION_COMBINATIONS[visualization.provider]?.[
        visualization.executor
      ] ?? null
    );
  }, [visualization]);

  const widgetOptions = useMemo<VisualizationWidget[]>(() => {
    if (!visualization) return [];
    return widgetsByScope[visualization.scope] ?? [visualization.widget];
  }, [visualization, widgetsByScope]);

  const keyOptions = useMemo(() => {
    if (!visualization) return [];
    return getKeyOptions(visualization.provider, goals);
  }, [visualization, goals]);

  const isCompositeStreak = Boolean(visualization?.options?.streakRule);

  function updateVisualization(partial: Partial<VisualizationDefinition>) {
    setVisualization((previous) =>
      previous
        ? reconcileVisualization({ ...previous, ...partial }, previous, goals)
        : previous,
    );
  }

  function handleCancel() {
    if (isEditing && original) {
      setVisualization(original);
      setIsEditing(false);
      return;
    }

    router.back();
  }

  async function handleSave() {
    if (!user || !visualization) return;

    try {
      setSaving(true);

      const combination =
        VISUALIZATION_COMBINATIONS[visualization.provider]?.[
          visualization.executor
        ];

      if (!combination) {
        toast.error("Selected visualization configuration is invalid.");
        return;
      }

      if (!combination.widgets.includes(visualization.widget)) {
        toast.error("Selected widget is not valid for this visualization.");
        return;
      }

      if (
        visualization.period.type === "days" &&
        (!Number.isInteger(visualization.period.value) ||
          visualization.period.value <= 0)
      ) {
        toast.error("Period must be a positive number of days.");
        return;
      }

      if (
        !Number.isFinite(visualization.displayOrder) ||
        visualization.displayOrder <= 0
      ) {
        toast.error("Display order must be a positive number.");
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

      await apiRequest(user, `/api/visualizations/${id}`, {
        method: "PATCH",
        body: payload,
      });

      setOriginal(payload);
      setVisualization(payload);
      setIsEditing(false);
      toast.success("Visualization updated");
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update visualization",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!user || !visualization) return;

    try {
      setIsDeleting(true);

      await apiRequest(user, `/api/visualizations/${id}`, {
        method: "DELETE",
      });

      toast.success("Visualization deleted");
      router.push("/settings/visualizations");
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete visualization",
      );
      setIsDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="p-6">Loading visualization...</div>
      </AppShell>
    );
  }

  if (error || !visualization) {
    return (
      <AppShell>
        <div className="p-6 text-red-500">
          {error ?? "Visualization not found."}
        </div>
      </AppShell>
    );
  }

  const hasChanges = JSON.stringify(visualization) !== JSON.stringify(original);
  const widgetLabel = toTitleCase(visualization.widget);

  const hasValidPeriod =
    visualization.period.type === "all" ||
    (Number.isInteger(visualization.period.value) &&
      visualization.period.value > 0);

  const hasValidDisplayOrder =
    Number.isFinite(visualization.displayOrder) &&
    visualization.displayOrder > 0;

  const canSave =
    visualization.title.trim().length > 0 &&
    hasValidPeriod &&
    hasValidDisplayOrder;

  return (
    <div className="relative mx-auto w-full max-w-screen-sm px-4 pt-4 pb-28">
      <div className="absolute top-10 left-0 z-10 flex w-full items-center justify-between px-6">
        <button
          onClick={handleCancel}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ChevronLeft size={18} />
          Back
        </button>

        {!isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Button>
        )}
      </div>

      <div className="bg-card relative mb-6 overflow-hidden rounded-3xl border">
        <div className="from-primary/15 via-primary/5 to-background h-28 bg-gradient-to-r" />

        <div className="-mt-10 px-6 pb-6 sm:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-5">
              <div className="bg-background ring-background flex h-20 w-20 items-center justify-center rounded-3xl border shadow-sm ring-4">
                <span className="text-primary text-center text-xs leading-4 font-semibold uppercase">
                  {widgetLabel}
                </span>
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {visualization.title}
                </h1>

                <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
                  {visualization.description || "No description provided."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="bg-muted rounded-full px-4 py-2 text-sm font-medium">
                {toTitleCase(visualization.scope)}
              </div>

              <div className="bg-primary/10 text-primary rounded-full px-4 py-2 text-sm font-medium">
                {toTitleCase(visualization.provider)} /{" "}
                {toTitleCase(visualization.executor)}
              </div>

              <div className="bg-secondary rounded-full px-4 py-2 text-sm font-medium">
                {widgetLabel}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card mb-6 rounded-3xl border p-6">
        <h2 className="mb-4 text-lg font-semibold">Configuration</h2>

        {isEditing ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <VisualizationFieldLabel topic="title" htmlFor="title">
                Title
              </VisualizationFieldLabel>
              <Input
                id="title"
                value={visualization.title}
                onChange={(e) => updateVisualization({ title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <VisualizationFieldLabel
                topic="description"
                htmlFor="description"
              >
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
                <VisualizationFieldLabel topic="scope" htmlFor="scope">
                  Scope
                </VisualizationFieldLabel>
                <div className="relative">
                  <select
                    id="scope"
                    value={visualization.scope}
                    onChange={(e) =>
                      updateVisualization({
                        scope: e.target.value as VisualizationScope,
                      })
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

              <div className="space-y-2">
                <VisualizationFieldLabel topic="widget" htmlFor="widget">
                  Widget
                </VisualizationFieldLabel>
                <div className="relative">
                  <select
                    id="widget"
                    value={visualization.widget}
                    onChange={(e) =>
                      updateVisualization({
                        widget: e.target.value as VisualizationWidget,
                      })
                    }
                    className={NATIVE_SELECT_CLASS}
                  >
                    {widgetOptions.map((widget) => (
                      <option key={widget} value={widget}>
                        {toTitleCase(widget)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <VisualizationFieldLabel
                topic="source"
                htmlFor="provider-executor"
              >
                Source (derived)
              </VisualizationFieldLabel>
              <div
                id="provider-executor"
                className="bg-muted rounded-xl border px-3 py-2 text-sm font-medium"
              >
                {toTitleCase(visualization.provider)} /{" "}
                {toTitleCase(visualization.executor)}
              </div>
            </div>

            {!isCompositeStreak && (
              <div className="space-y-2">
                <VisualizationFieldLabel topic="data" htmlFor="key">
                  Data Key
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
                <VisualizationFieldLabel
                  topic="comparison"
                  htmlFor="comparison"
                >
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

            {combination?.options.streakRule && (
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
            )}

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
                min={1}
                value={visualization.displayOrder}
                onChange={(e) =>
                  updateVisualization({
                    displayOrder: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <p className="text-muted-foreground text-xs">
                Provider and executor are derived from your scope/widget/key
                selections and validated on save.
              </p>
            </div>
          </div>
        ) : (
          <ReadOnlyConfig visualization={visualization} />
        )}
      </div>

      <div className="bg-card mb-6 rounded-3xl border p-6">
        <h2 className="mb-4 text-lg font-semibold">Visibility</h2>

        <div className="flex items-center justify-between">
          <div>
            <div className="mb-1">
              <VisualizationFieldLabel
                topic="visible"
                htmlFor="visibility-switch"
              >
                Visibility
              </VisualizationFieldLabel>
            </div>

            <p className="font-medium">
              {visualization.visible ? "Visible" : "Hidden"}
            </p>

            <p className="text-muted-foreground text-sm">
              {visualization.visible
                ? "This visualization appears on the dashboard."
                : "This visualization is hidden from the dashboard."}
            </p>
          </div>

          {isEditing ? (
            <Switch
              id="visibility-switch"
              checked={visualization.visible}
              onCheckedChange={(checked) =>
                updateVisualization({ visible: checked })
              }
            />
          ) : (
            <Switch
              id="visibility-switch"
              checked={visualization.visible}
              disabled
            />
          )}
        </div>
      </div>

      {!isEditing && (
        <div className="bg-card border-destructive/20 rounded-3xl border p-6">
          <h2 className="text-destructive mb-4 text-lg font-semibold">
            Danger Zone
          </h2>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Delete this visualization</p>

              <p className="text-muted-foreground mt-1 text-sm">
                Permanently remove this visualization from your dashboard.
              </p>
            </div>

            <Button
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Delete Visualization
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete visualization?</DialogTitle>

            <DialogDescription>
              &ldquo;{visualization.title}&rdquo; will be permanently removed
              from your dashboard. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isEditing && (
        <div className="bg-background fixed inset-x-0 bottom-0 z-20 border-t p-4 lg:left-64">
          <div className="mx-auto flex max-w-screen-sm gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              className="flex-[2]"
              onClick={handleSave}
              disabled={saving || !hasChanges || !canSave}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReadOnlyConfig({
  visualization,
}: {
  visualization: VisualizationDefinition;
}) {
  return (
    <div className="space-y-4">
      <ReadOnlyRow label="Widget" value={toTitleCase(visualization.widget)} />
      <ReadOnlyRow label="Scope" value={toTitleCase(visualization.scope)} />
      <ReadOnlyRow
        label="Provider"
        value={toTitleCase(visualization.provider)}
      />
      <ReadOnlyRow
        label="Executor"
        value={toTitleCase(visualization.executor)}
      />
      {visualization.options?.streakRule ? (
        <ReadOnlyStreakRule value={visualization.options.streakRule} />
      ) : (
        <ReadOnlyRow label="Key" value={visualization.key} />
      )}
      <ReadOnlyRow
        label="Aggregation"
        value={toTitleCase(visualization.aggregation)}
      />
      <ReadOnlyRow label="Period" value={formatPeriod(visualization.period)} />
      <ReadOnlyRow label="Display order" value={visualization.displayOrder} />
    </div>
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

function reconcileVisualization(
  draft: VisualizationDefinition,
  previous: VisualizationDefinition,
  goals: MetricDefinition[],
): VisualizationDefinition {
  const widgetsForScope = getWidgetsForScope(draft.scope);

  if (
    widgetsForScope.length > 0 &&
    !widgetsForScope.includes(draft.widget as VisualizationWidget)
  ) {
    draft.widget = widgetsForScope[0];
  }

  const candidates = getCompatibleProviderExecutorCandidates(
    draft,
    previous,
    goals,
  );

  const active =
    candidates.find(
      (candidate) =>
        candidate.provider === previous.provider &&
        candidate.executor === previous.executor,
    ) ?? candidates[0];

  if (!active) {
    return draft;
  }

  const combination =
    VISUALIZATION_COMBINATIONS[active.provider]?.[active.executor];

  if (!combination) {
    return draft;
  }

  let aggregation = draft.aggregation;

  if (!combination.aggregations.includes(aggregation)) {
    aggregation = combination.aggregations[0] ?? previous.aggregation;
  }

  const isComposite = Boolean(draft.options?.streakRule);

  const normalizedKey = isComposite
    ? INTERNAL_COMPOSITE_STREAK_KEY
    : ensureValidKey(draft.key, active.provider, goals);

  const options = normalizeVisualizationOptions(
    draft.options,
    combination.options,
  );

  return {
    ...draft,
    provider: active.provider,
    executor: active.executor,
    aggregation,
    key: normalizedKey,
    options,
  };
}

function getCompatibleProviderExecutorCandidates(
  draft: VisualizationDefinition,
  previous: VisualizationDefinition,
  goals: MetricDefinition[],
): ProviderExecutorOption[] {
  const candidates = getProviderExecutorOptionsFor(draft.scope, draft.widget);
  const isComposite = Boolean(draft.options?.streakRule);

  const keyCompatibleCandidates = candidates.filter((candidate) => {
    const combination =
      VISUALIZATION_COMBINATIONS[candidate.provider]?.[candidate.executor];

    if (!combination) {
      return false;
    }

    if (isComposite && !combination.options.streakRule) {
      return false;
    }

    if (!combination.aggregations.includes(draft.aggregation)) {
      if (
        candidate.provider === previous.provider &&
        candidate.executor === previous.executor
      ) {
        return true;
      }

      return false;
    }

    if (isComposite) {
      return true;
    }

    return isKeyAllowedForProvider(draft.key, candidate.provider, goals);
  });

  if (keyCompatibleCandidates.length > 0) {
    return keyCompatibleCandidates;
  }

  return candidates;
}

function getProviderExecutorOptionsFor(
  scope: VisualizationScope,
  widget: VisualizationWidget,
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
    ) {
      continue;
    }

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

function getWidgetsForScope(scope: VisualizationScope): VisualizationWidget[] {
  const widgets: VisualizationWidget[] = [];

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
    ) {
      continue;
    }

    for (const [, combination] of Object.entries(executors ?? {}) as Array<
      [VisualizationExecutorType, AllowedCombination | undefined]
    >) {
      for (const widget of combination?.widgets ?? []) {
        if (!widgets.includes(widget)) {
          widgets.push(widget);
        }
      }
    }
  }

  return widgets;
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

function ensureValidKey(
  key: string,
  provider: VisualizationProviderType,
  goals: MetricDefinition[],
): string {
  const options = getKeyOptions(provider, goals);

  if (options.some((option) => option.value === key)) {
    return key;
  }

  return options[0]?.value ?? "";
}

function isKeyAllowedForProvider(
  key: string,
  provider: VisualizationProviderType,
  goals: MetricDefinition[],
): boolean {
  const options = getKeyOptions(provider, goals);
  return options.some((option) => option.value === key);
}

function ReadOnlyRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground text-sm">{label}</span>

      <span className="font-medium">{value}</span>
    </div>
  );
}

function ReadOnlyStreakRule({
  value,
}: {
  value: NonNullable<VisualizationDefinition["options"]>["streakRule"];
}) {
  if (!value) {
    return null;
  }

  return (
    <div className="space-y-2 rounded-2xl border p-4">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">Streak rule</span>
        <span className="font-medium">
          {value.operator === "and" ? "All conditions" : "Any condition"}
        </span>
      </div>

      <div className="space-y-2">
        {value.conditions.map((condition, index) => (
          <div key={`${condition.goalLabel}-${index}`} className="text-sm">
            {condition.goalLabel} {formatComparator(condition.comparator)}{" "}
            {String(condition.value)}
          </div>
        ))}
      </div>
    </div>
  );
}

function toTitleCase(value: string) {
  return value
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatPeriod(period: VisualizationDefinition["period"]): string {
  if (period.type === "all") {
    return "All time";
  }

  return `${period.value} day${period.value === 1 ? "" : "s"}`;
}

function formatComparator(
  comparator: NonNullable<
    NonNullable<VisualizationDefinition["options"]>["streakRule"]
  >["conditions"][number]["comparator"],
) {
  switch (comparator) {
    case "eq":
      return "is equal to";
    case "gt":
      return "is greater than";
    case "gte":
      return "is greater than or equal to";
    case "lt":
      return "is less than";
    case "lte":
      return "is less than or equal to";
    default:
      return comparator;
  }
}
