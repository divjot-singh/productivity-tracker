"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Pencil, Trash2 } from "lucide-react";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api/client";
import {
  VISUALIZATION_COMBINATIONS,
  AllowedCombination,
} from "@/lib/visualizations/validation";
import {
  VisualizationAggregation,
  VisualizationComparison,
  VisualizationDefinition,
  VisualizationPeriod,
} from "@/models/visualization";
import { toast } from "sonner";

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
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      if (!user || !id) return;

      try {
        setLoading(true);
        const data = await apiRequest<VisualizationDefinition>(
          user,
          `/api/visualizations/${id}`,
        );
        setOriginal(data);
        setVisualization(data);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load visualization");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, user]);

  const combination = useMemo<AllowedCombination | null>(() => {
    if (!visualization) return null;
    return (
      VISUALIZATION_COMBINATIONS[visualization.provider]?.[
        visualization.executor
      ] ?? null
    );
  }, [visualization]);

  function updateVisualization(partial: Partial<VisualizationDefinition>) {
    setVisualization((previous) =>
      previous ? { ...previous, ...partial } : previous,
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

      await apiRequest(user, `/api/visualizations/${id}`, {
        method: "PATCH",
        body: visualization,
      });

      setOriginal(visualization);
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

  if (!visualization) {
    return (
      <AppShell>
        <div className="p-6">Visualization not found.</div>
      </AppShell>
    );
  }

  const hasChanges = JSON.stringify(visualization) !== JSON.stringify(original);

  return (
    <AppShell>
      <div className="relative mx-auto w-full max-w-screen-sm px-4 pt-4 pb-28">
        <div className="mb-6 flex items-center justify-between">
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

        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            {visualization.title}
          </h1>

          {visualization.description && (
            <p className="text-muted-foreground mt-2 text-sm">
              {visualization.description}
            </p>
          )}
        </div>

        <div className="bg-card mb-6 rounded-3xl border p-6">
          <h2 className="mb-4 text-lg font-semibold">Configuration</h2>

          {isEditing ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={visualization.title}
                  onChange={(e) =>
                    updateVisualization({ title: e.target.value })
                  }
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
                />
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
                    <SelectTrigger id="aggregation" className="w-full">
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
                    <SelectTrigger id="comparison" className="w-full">
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
                    checked={
                      visualization.options?.greenIfDeltaPositive ?? false
                    }
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

              <div className="space-y-2">
                <Label htmlFor="display-order">Display order</Label>
                <Input
                  id="display-order"
                  type="number"
                  value={visualization.displayOrder}
                  onChange={(e) =>
                    updateVisualization({
                      displayOrder: Number(e.target.value),
                    })
                  }
                />
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
                checked={visualization.visible}
                onCheckedChange={(checked) =>
                  updateVisualization({ visible: checked })
                }
              />
            ) : (
              <Switch checked={visualization.visible} disabled />
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
                disabled={saving || !hasChanges}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
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
      <ReadOnlyRow label="Key" value={visualization.key} />
      <ReadOnlyRow
        label="Aggregation"
        value={toTitleCase(visualization.aggregation)}
      />
      <ReadOnlyRow label="Period" value={formatPeriod(visualization.period)} />
      <ReadOnlyRow label="Display order" value={visualization.displayOrder} />
    </div>
  );
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
