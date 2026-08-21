"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { apiRequest } from "@/lib/api/client";
import { normalizeCombinationPayload } from "@/lib/workouts/normalize";
import {
  ExerciseDefinition,
  WorkoutCombination,
  WorkoutEntry,
} from "@/models/workout";

export default function CombinationDetailPage() {
  const { user } = useRequireAuth();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [original, setOriginal] = useState<WorkoutCombination | null>(null);
  const [combination, setCombination] = useState<WorkoutCombination | null>(
    null,
  );
  const [exercises, setExercises] = useState<ExerciseDefinition[]>([]);
  const [referencingWorkouts, setReferencingWorkouts] = useState<
    WorkoutEntry[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      if (!user || !id) {
        return;
      }

      try {
        setLoading(true);

        const [comboData, exerciseData, workoutData] = await Promise.all([
          apiRequest<WorkoutCombination>(user, `/api/combinations/${id}`),
          apiRequest<ExerciseDefinition[]>(
            user,
            "/api/exercises?includeInactive=true",
          ),
          apiRequest<WorkoutEntry[]>(user, `/api/workouts?combinationId=${id}`),
        ]);

        setOriginal(comboData);
        setCombination(comboData);
        setExercises(exerciseData ?? []);
        setReferencingWorkouts(workoutData ?? []);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load combination");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, user]);

  const exerciseNameMap = useMemo(() => {
    return new Map(exercises.map((exercise) => [exercise.id, exercise.name]));
  }, [exercises]);

  const activeExercises = useMemo(
    () => exercises.filter((exercise) => exercise.active),
    [exercises],
  );

  const hasChanges = JSON.stringify(combination) !== JSON.stringify(original);
  const canDelete = referencingWorkouts.length === 0;

  function toggleExercise(exerciseId: string) {
    setCombination((prev) => {
      if (!prev) {
        return prev;
      }

      const has = prev.exerciseIds.includes(exerciseId);

      if (has) {
        return {
          ...prev,
          exerciseIds: prev.exerciseIds.filter((id) => id !== exerciseId),
        };
      }

      return {
        ...prev,
        exerciseIds: [...prev.exerciseIds, exerciseId],
      };
    });
  }

  async function handleSave() {
    if (!user || !combination) {
      return;
    }

    try {
      setSaving(true);

      const payload = normalizeCombinationPayload(combination, id);

      await apiRequest(user, `/api/combinations/${id}`, {
        method: "PATCH",
        body: payload,
      });

      setOriginal(payload);
      setCombination(payload);
      setIsEditing(false);
      toast.success("Combination updated");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update combination",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!user) {
      return;
    }

    try {
      setIsDeleting(true);

      await apiRequest(user, `/api/combinations/${id}?mode=hard`, {
        method: "DELETE",
      });

      toast.success("Combination deleted");
      router.push("/workouts/combinations");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete combination",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  if (loading) {
    return <div className="p-6">Loading combination...</div>;
  }

  if (!combination) {
    return <div className="p-6">Combination not found.</div>;
  }

  return (
    <div className="pb-4">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ChevronLeft size={18} />
          Back
        </button>

        {!isEditing ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Button>
        ) : null}
      </div>

      <h1 className="text-2xl font-bold tracking-tight">{combination.name}</h1>

      <p className="text-muted-foreground mt-2 text-sm">
        {combination.description || "No description provided."}
      </p>

      <div className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            disabled={!isEditing}
            value={combination.name}
            onChange={(e) =>
              setCombination((prev) =>
                prev ? { ...prev, name: e.target.value } : prev,
              )
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            disabled={!isEditing}
            value={combination.description ?? ""}
            onChange={(e) =>
              setCombination((prev) =>
                prev ? { ...prev, description: e.target.value } : prev,
              )
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Exercises</Label>

          {isEditing ? (
            <div className="max-h-72 space-y-2 overflow-auto rounded-xl border p-3">
              {activeExercises.map((exercise) => {
                const checked = combination.exerciseIds.includes(exercise.id);

                return (
                  <label
                    key={exercise.id}
                    className="hover:bg-accent flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleExercise(exercise.id)}
                      className="mt-1"
                    />

                    <div>
                      <p className="text-sm font-medium">{exercise.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {exercise.categories.join(", ")}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border p-3 text-sm">
              {combination.exerciseIds.length === 0
                ? "No exercises selected"
                : combination.exerciseIds
                    .map(
                      (exerciseId) =>
                        exerciseNameMap.get(exerciseId) ?? exerciseId,
                    )
                    .join(", ")}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {isEditing ? (
          <>
            <Button onClick={handleSave} disabled={!hasChanges || saving}>
              {saving ? "Saving..." : "Save"}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setCombination(original);
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
          </>
        ) : (
          <div className="space-y-2">
            <Button
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={!canDelete}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Delete
            </Button>

            {!canDelete ? (
              <p className="text-muted-foreground text-xs">
                Delete is disabled because this combination is used in workout
                history on{" "}
                {referencingWorkouts.map((workout) => workout.date).join(", ")}.
              </p>
            ) : null}
          </div>
        )}
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete combination?</DialogTitle>
            <DialogDescription>
              This will permanently remove the combination.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
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
    </div>
  );
}
