"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Pencil, Trash2 } from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  normalizeVisualizationOptions,
} from "@/lib/visualizations/validation";
import {
  VisualizationDefinition,
  VisualizationWidget,
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
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    return combination?.widgets ?? [visualization.widget];
  }, [combination, visualization]);

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
        key: visualization.key.trim(),
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

  return (
    <AppShell>
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
                <Label htmlFor="widget">Widget</Label>
                <Select
                  value={visualization.widget}
                  onValueChange={(value) =>
                    updateVisualization({
                      widget: value as VisualizationWidget,
                    })
                  }
                >
                  <SelectTrigger id="widget" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {widgetOptions.map((widget) => (
                      <SelectItem key={widget} value={widget}>
                        {toTitleCase(widget)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <p className="text-muted-foreground text-sm">
                Only the widget is editable here. The rest of the visualization
                configuration is locked.
              </p>
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
