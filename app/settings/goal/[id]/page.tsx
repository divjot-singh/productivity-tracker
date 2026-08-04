"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api/client";
import { ICONS } from "@/lib/metric-icons";

import { MetricDefinition } from "@/models/metric";
import { ChevronLeft, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import IconSelector from "@/components/settings/IconSelector";
import TargetConfig from "@/components/settings/configs/TargetConfig";
import MultiplierConfig from "@/components/settings/configs/MultiplierConfig";
import RangeConfig from "@/components/settings/configs/RangeConfig";
import TimeRangeConfig from "@/components/settings/configs/TimeRangeConfig";
import OptionsConfig from "@/components/settings/configs/OptionConfig";
import BooleanConfig from "@/components/settings/configs/BooleanConfig";

export default function GoalDetails() {
  const { user } = useAuth();
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
                <Icon className="text-primary h-10 w-10" />
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {goal.label}
                </h1>

                <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
                  {goal.description || "No description provided."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="bg-muted rounded-full px-4 py-2 text-sm font-medium">
                {capitalize(goal.category)}
              </div>

              <div className="bg-primary/10 text-primary rounded-full px-4 py-2 text-sm font-medium">
                {capitalize(goal.type)}
              </div>

              <div className="bg-secondary rounded-full px-4 py-2 text-sm font-medium">
                {goal.weight} pts
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
              <Label>Icon</Label>
              <IconSelector
                value={goal.icon}
                onChange={(icon) => updateGoal({ icon })}
              />
            </div>

            <div className="space-y-2">
              <Label>Weight</Label>

              <Input
                type="number"
                min={0}
                value={goal.weight}
                onChange={(e) => updateGoal({ weight: Number(e.target.value) })}
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

            <ScoringConfig goal={goal} updateGoal={updateGoal} />
          </div>
        ) : (
          <ReadOnlyConfig goal={goal} />
        )}
      </div>

      {!isEditing && (
        <div className="bg-card border-destructive/20 rounded-3xl border p-6">
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
      <ReadOnlyRow label="Icon" value={goal.icon} />
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

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b py-3 last:border-b-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function capitalize(value: string) {
  return value
    .replace("-", " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}
