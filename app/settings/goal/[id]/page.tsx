"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { apiRequest } from "@/lib/api/client";
import { ICONS } from "@/lib/metric-icons";
import { localYesterday } from "@/lib/dates";

import { MetricDefinition } from "@/models/metric";
import {
  Archive,
  CalendarDays,
  ChevronLeft,
  type LucideIcon,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import GoalPreview from "@/components/settings/GoalPreview";
import { WeightPicker, YesNo } from "@/components/settings/GoalFields";
import IconSelector from "@/components/settings/IconSelector";
import TargetConfig from "@/components/settings/configs/TargetConfig";
import MultiplierConfig from "@/components/settings/configs/MultiplierConfig";
import RangeConfig from "@/components/settings/configs/RangeConfig";
import TimeRangeConfig from "@/components/settings/configs/TimeRangeConfig";
import OptionsConfig from "@/components/settings/configs/OptionConfig";
import BooleanConfig from "@/components/settings/configs/BooleanConfig";

export default function GoalDetails() {
  const { user } = useRequireAuth();
  const router = useRouter();

  const { id } = useParams<{ id: string }>();

  const [originalGoal, setOriginalGoal] = useState<MetricDefinition | null>(
    null,
  );
  const [goal, setGoal] = useState<MetricDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [reactivateWeight, setReactivateWeight] = useState("");
  const [lifecycleBusy, setLifecycleBusy] = useState(false);

  useEffect(() => {
    async function loadGoal() {
      if (!user || !id) {
        return;
      }

      try {
        setLoading(true);

        const loaded = await apiRequest<MetricDefinition>(
          user,
          `/api/goals/${id}`,
        );

        setOriginalGoal(loaded);
        setGoal(loaded);
      } catch (err) {
        console.error(err);
        setError("Failed to load goal.");
      } finally {
        setLoading(false);
      }
    }

    loadGoal();
  }, [id, user]);

  function updateGoal(partial: Partial<MetricDefinition>) {
    setGoal((previous) => (previous ? { ...previous, ...partial } : previous));
  }

  async function handleSave() {
    if (!user || !goal) {
      return;
    }

    try {
      setSaving(true);

      await apiRequest(user, `/api/goals/${id}`, {
        method: "PATCH",
        body: goal,
      });

      setOriginalGoal(goal);
      setIsEditing(false);
      toast.success("Goal updated successfully");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to update goal");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (isEditing && originalGoal) {
      setGoal(originalGoal);
      setIsEditing(false);
      return;
    }

    router.back();
  }

  async function runLifecycle(
    body: Record<string, unknown>,
    successMessage: string,
  ) {
    if (!user) {
      return;
    }

    try {
      setLifecycleBusy(true);

      await apiRequest(user, `/api/goals/${id}`, { method: "PATCH", body });

      const reloaded = await apiRequest<MetricDefinition>(
        user,
        `/api/goals/${id}`,
      );

      setOriginalGoal(reloaded);
      setGoal(reloaded);
      setReactivateWeight("");
      setIsArchiveDialogOpen(false);
      toast.success(successMessage);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLifecycleBusy(false);
    }
  }

  async function handleDelete() {
    if (!user || !goal) {
      return;
    }

    try {
      setIsDeleting(true);

      await apiRequest(user, `/api/goals/${id}`, {
        method: "DELETE",
      });

      toast.success("Goal deleted");
      router.push("/settings");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to delete goal");
      setIsDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  }

  if (loading) {
    return <div className="p-6">Loading goal...</div>;
  }

  if (error || !goal) {
    return <div className="p-6 text-red-500">{error ?? "Goal not found."}</div>;
  }

  const Icon = ICONS[goal.icon] ?? ICONS.goal;

  const hasChanges = JSON.stringify(goal) !== JSON.stringify(originalGoal);

  return (
    <div className="relative p-4 pb-24">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={handleCancel}
          className="text-muted-foreground hover:text-foreground inline-flex h-10 items-center gap-1 text-sm transition-colors"
        >
          <ChevronLeft size={18} />
          Back
        </button>

        {!isEditing && goal.status !== "archived" && (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Button>
        )}
      </div>

      <div className="bg-card mb-4 flex items-start gap-3 rounded-2xl border p-4">
        <div className="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
          <Icon className="text-primary h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-xl leading-tight font-bold">{goal.label}</h1>

          <p className="text-muted-foreground mt-1 text-sm">
            {goal.description || "No description provided."}
          </p>

          <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
            <span className="bg-muted rounded-full px-2.5 py-1">
              {capitalize(goal.category)}
            </span>
            <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1">
              {capitalize(goal.type)}
            </span>
            <span className="bg-secondary rounded-full px-2.5 py-1">
              {goal.weight} pts
            </span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <GoalPreview goal={goal} />
      </div>

      <div className="bg-card mb-4 rounded-2xl border p-4">
        <h2 className="mb-4 text-lg font-semibold">Configuration</h2>

        {isEditing ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Description</Label>

              <Textarea
                value={goal.description ?? ""}
                onChange={(e) =>
                  updateGoal({
                    description:
                      e.target.value.trim().length === 0
                        ? undefined
                        : e.target.value,
                  })
                }
                placeholder="Describe this goal"
              />
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <IconSelector
                value={goal.icon}
                onChange={(icon) => updateGoal({ icon })}
              />
            </div>

            <div className="space-y-2">
              <Label>Importance</Label>

              <WeightPicker
                value={goal.weight}
                onChange={(weight) => updateGoal({ weight })}
              />
            </div>

            <div className="space-y-2">
              <Label>Unit</Label>

              <Input
                value={goal.unit ?? ""}
                onChange={(e) =>
                  updateGoal({
                    unit: e.target.value === "" ? undefined : e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Target</Label>

              {goal.type === "boolean" ? (
                <YesNo
                  label="target"
                  value={goal.target === true}
                  onChange={(next) => updateGoal({ target: next })}
                />
              ) : goal.type === "time" ? (
                <Input
                  type="time"
                  value={String(goal.target)}
                  onChange={(e) => updateGoal({ target: e.target.value })}
                />
              ) : (
                <Input
                  type="number"
                  value={String(goal.target)}
                  onChange={(e) =>
                    updateGoal({ target: Number(e.target.value) })
                  }
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Default Value</Label>

              {goal.type === "boolean" ? (
                <YesNo
                  label="defaultValue"
                  value={goal.defaultValue === true}
                  onChange={(next) => updateGoal({ defaultValue: next })}
                />
              ) : goal.type === "time" ? (
                <Input
                  type="time"
                  value={String(goal.defaultValue)}
                  onChange={(e) => updateGoal({ defaultValue: e.target.value })}
                />
              ) : (
                <Input
                  type="number"
                  value={String(goal.defaultValue)}
                  onChange={(e) =>
                    updateGoal({ defaultValue: Number(e.target.value) })
                  }
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Bonus Rate</Label>

              <p className="text-muted-foreground text-xs">
                Additional score allowed beyond the base weight.
              </p>

              <Input
                type="number"
                step="0.0001"
                min="0"
                value={goal.scoring.bonusRate ?? ""}
                onChange={(e) =>
                  updateGoal({
                    scoring: {
                      ...goal.scoring,
                      bonusRate:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    },
                  })
                }
                placeholder="0.0002"
              />
            </div>

            <ScoringConfig goal={goal} updateGoal={updateGoal} />
          </div>
        ) : (
          <ReadOnlyConfig goal={goal} />
        )}
      </div>

      {!isEditing && goal.status !== "archived" && goal.weight === 0 && (
        <Link
          href={`/logs/backfill?goal=${encodeURIComponent(goal.id)}`}
          className="bg-card hover:bg-accent mb-4 flex items-center gap-3 rounded-2xl border p-4 transition-colors"
        >
          <CalendarDays className="text-primary h-5 w-5" />

          <span className="flex-1">
            <span className="block font-medium">Fill past days</span>
            <span className="text-muted-foreground block text-sm">
              Add values for days you missed
            </span>
          </span>
        </Link>
      )}

      {!isEditing && (
        <div className="bg-card mb-4 rounded-2xl border p-4">
          <h2 className="mb-4 text-lg font-semibold">
            {goal.status === "archived" ? "Archived goal" : "Archive"}
          </h2>

          {goal.status === "archived" ? (
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Archived after {goal.archivedAt ?? "an earlier date"}. History
                is kept and shown as removed. Enter a weight to start scoring it
                again.
              </p>

              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-2">
                  <Label>Weight</Label>

                  <Input
                    type="number"
                    min={0}
                    value={reactivateWeight}
                    placeholder={
                      goal.previousWeight !== undefined
                        ? `Previously ${goal.previousWeight}`
                        : "Weight"
                    }
                    onChange={(e) => setReactivateWeight(e.target.value)}
                  />
                </div>

                <Button
                  disabled={lifecycleBusy || reactivateWeight.trim() === ""}
                  onClick={() =>
                    runLifecycle(
                      {
                        action: "reactivate",
                        weight: Number(reactivateWeight),
                      },
                      "Goal reactivated",
                    )
                  }
                >
                  <RotateCcw className="mr-1.5 h-4 w-4" />
                  Reactivate
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground text-sm">
                Stop scoring this goal from today. Past entries keep their
                scores and the goal is hidden from new entries.
              </p>

              <Button
                variant="outline"
                onClick={() => setIsArchiveDialogOpen(true)}
              >
                <Archive className="mr-1.5 h-4 w-4" />
                Archive goal
              </Button>
            </div>
          )}
        </div>
      )}

      {!isEditing && goal.status === "archived" && (
        <div className="bg-card border-destructive/20 rounded-2xl border p-4">
          <h2 className="text-destructive mb-4 text-lg font-semibold">
            Danger Zone
          </h2>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Delete this goal</p>

              <p className="text-muted-foreground mt-1 text-sm">
                {goal.isProtected
                  ? "Protected seed/core goals cannot be deleted."
                  : "Permanently remove this goal from your configuration."}
              </p>
            </div>

            <Button
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={goal.isProtected}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Delete Goal
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Archive goal?</DialogTitle>

            <DialogDescription>
              This goal stops counting toward your daily maximum score from
              today. You can reactivate it later with a new weight.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsArchiveDialogOpen(false)}
              disabled={lifecycleBusy}
            >
              Cancel
            </Button>

            <Button
              onClick={() =>
                runLifecycle(
                  { action: "archive", lastActiveDate: localYesterday() },
                  "Goal archived",
                )
              }
              disabled={lifecycleBusy}
            >
              {lifecycleBusy ? "Archiving..." : "Archive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete goal?</DialogTitle>

            <DialogDescription>
              This will permanently delete this goal. This action cannot be
              undone.
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
        <div className="bg-background fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 border-t p-3 lg:bottom-0 lg:left-64">
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
  );
}

function ScoringConfig({
  goal,
  updateGoal,
}: {
  goal: MetricDefinition;
  updateGoal: (partial: Partial<MetricDefinition>) => void;
}) {
  switch (goal.scoring.type) {
    case "boolean":
      return <BooleanConfig goal={goal} updateGoal={updateGoal} />;

    case "goal":
      return <TargetConfig goal={goal} updateGoal={updateGoal} />;

    case "multiplier":
      return <MultiplierConfig goal={goal} updateGoal={updateGoal} />;

    case "range":
      return <RangeConfig goal={goal} updateGoal={updateGoal} />;

    case "options":
      return <OptionsConfig goal={goal} updateGoal={updateGoal} />;

    case "time-range":
      return <TimeRangeConfig goal={goal} updateGoal={updateGoal} />;

    default:
      return null;
  }
}

function ReadOnlyConfig({ goal }: { goal: MetricDefinition }) {
  return (
    <div className="space-y-4">
      <ReadOnlyRow label="Icon" value={ICONS[goal.icon]} />
      <ReadOnlyRow label="Weight" value={`${goal.weight} pts`} />
      <ReadOnlyRow label="Unit" value={goal.unit || "None"} />
      <ReadOnlyRow label="Target" value={String(goal.target)} />
      <ReadOnlyRow label="Default Value" value={String(goal.defaultValue)} />
      <ReadOnlyRow label="Scoring Type" value={capitalize(goal.scoring.type)} />

      {"bonusRate" in goal.scoring && goal.scoring.bonusRate !== undefined && (
        <ReadOnlyRow label="Bonus Rate" value={`${goal.scoring.bonusRate}`} />
      )}

      {"multiplier" in goal.scoring &&
        goal.scoring.multiplier !== undefined && (
          <ReadOnlyRow
            label="Multiplier"
            value={`× ${goal.scoring.multiplier}`}
          />
        )}

      {goal.scoring.maxScore !== undefined && (
        <ReadOnlyRow label="Max Score" value={`${goal.scoring.maxScore} pts`} />
      )}

      {goal.scoringExplanation && (
        <ReadOnlyRow
          label="Scoring Explanation"
          value={goal.scoringExplanation}
        />
      )}
    </div>
  );
}

function ReadOnlyRow({
  label,
  value,
}: {
  label: string;
  value: string | LucideIcon;
}) {
  let Icon: LucideIcon | null = null;
  if (typeof value !== "string") {
    Icon = value;
  }
  return (
    <div className="flex items-center justify-between border-b py-3 last:border-b-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="font-medium">
        {typeof value === "string" ? value : Icon && <Icon />}
      </span>
    </div>
  );
}

function capitalize(value: string) {
  return value
    .replace("-", " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}
