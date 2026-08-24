"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import ExerciseEditorFields from "@/components/workouts/ExerciseEditorFields";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { apiRequest } from "@/lib/api/client";
import {
  createWorkoutId,
  normalizeExercisePayload,
} from "@/lib/workouts/normalize";
import {
  ExerciseDefinition,
  WorkoutCombination,
  WorkoutEntry,
} from "@/models/workout";

export default function ExerciseDetailPage() {
  const { user } = useRequireAuth();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const routeId = useMemo(() => decodeURIComponent(id), [id]);

  const [original, setOriginal] = useState<ExerciseDefinition | null>(null);
  const [exercise, setExercise] = useState<ExerciseDefinition | null>(null);
  const [combinations, setCombinations] = useState<WorkoutCombination[]>([]);
  const [selectedCombinationIds, setSelectedCombinationIds] = useState<
    string[]
  >([]);
  const [referencingWorkouts, setReferencingWorkouts] = useState<
    WorkoutEntry[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasFormErrors, setHasFormErrors] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      if (!user || !routeId) {
        return;
      }

      try {
        setLoading(true);
        let exerciseData: ExerciseDefinition | null = null;
        let resolvedId = routeId;

        try {
          exerciseData = await apiRequest<ExerciseDefinition>(
            user,
            `/api/exercises/${encodeURIComponent(routeId)}`,
          );
        } catch (error) {
          if (
            !(error instanceof Error) ||
            error.message !== "Exercise not found"
          ) {
            throw error;
          }

          const allExercises = await apiRequest<ExerciseDefinition[]>(
            user,
            "/api/exercises?includeInactive=true",
          );

          exerciseData =
            allExercises.find(
              (exercise) =>
                exercise.id === routeId ||
                createWorkoutId(exercise.name) === routeId,
            ) ?? null;

          if (!exerciseData) {
            throw error;
          }

          resolvedId = exerciseData.id;
        }

        const [combinationData, workoutData] = await Promise.all([
          apiRequest<WorkoutCombination[]>(
            user,
            "/api/combinations?includeInactive=true",
          ),
          apiRequest<WorkoutEntry[]>(
            user,
            `/api/workouts?exerciseId=${encodeURIComponent(resolvedId)}`,
          ),
        ]);

        if (resolvedId !== routeId) {
          router.replace(
            `/workouts/exercises/${encodeURIComponent(resolvedId)}`,
          );
        }

        setOriginal(exerciseData);
        setExercise(exerciseData);
        setCombinations(combinationData ?? []);
        setReferencingWorkouts(workoutData ?? []);
        setSelectedCombinationIds(
          (combinationData ?? [])
            .filter((combination) =>
              combination.exerciseIds.includes(resolvedId),
            )
            .map((combination) => combination.id),
        );
      } catch (error) {
        console.error(error);
        toast.error("Failed to load exercise");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [routeId, router, user]);

  const hasChanges = JSON.stringify(exercise) !== JSON.stringify(original);

  const hasCombinationChanges = useMemo(() => {
    const exerciseId = exercise?.id ?? routeId;

    return (
      JSON.stringify([...selectedCombinationIds].sort()) !==
      JSON.stringify(
        combinations
          .filter((combination) => combination.exerciseIds.includes(exerciseId))
          .map((combination) => combination.id)
          .sort(),
      )
    );
  }, [combinations, exercise?.id, routeId, selectedCombinationIds]);

  const canDelete = referencingWorkouts.length === 0;

  async function handleSave() {
    if (!user || !exercise) {
      return;
    }

    try {
      if (hasFormErrors) {
        toast.error("Fix the exercise form errors before saving.");
        return;
      }

      setSaving(true);
      const exerciseId = exercise.id;
      const payload = normalizeExercisePayload(exercise, exerciseId);

      await apiRequest(
        user,
        `/api/exercises/${encodeURIComponent(exerciseId)}`,
        {
          method: "PATCH",
          body: {
            ...payload,
            combinationIds: selectedCombinationIds,
          },
        },
      );

      setOriginal(payload);
      setExercise(payload);
      setCombinations((prev) =>
        prev.map((combination) => {
          const shouldInclude = selectedCombinationIds.includes(combination.id);
          const alreadyIncludes = combination.exerciseIds.includes(exerciseId);

          if (shouldInclude && !alreadyIncludes) {
            return {
              ...combination,
              exerciseIds: [...combination.exerciseIds, exerciseId],
            };
          }

          if (!shouldInclude && alreadyIncludes) {
            return {
              ...combination,
              exerciseIds: combination.exerciseIds.filter(
                (value) => value !== exerciseId,
              ),
            };
          }

          return combination;
        }),
      );
      setIsEditing(false);
      toast.success("Exercise updated");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update exercise",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!user || !exercise) {
      return;
    }

    try {
      setIsDeleting(true);

      await apiRequest(
        user,
        `/api/exercises/${encodeURIComponent(exercise.id)}?mode=hard`,
        {
          method: "DELETE",
        },
      );

      toast.success("Exercise deleted");
      router.push("/workouts/exercises");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete exercise",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  if (loading) {
    return <div className="p-6">Loading exercise...</div>;
  }

  if (!exercise) {
    return <div className="p-6">Exercise not found.</div>;
  }

  return (
    <div className="pb-17">
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

      <h1 className="text-2xl font-bold tracking-tight">{exercise.name}</h1>

      <p className="text-muted-foreground mt-2 text-sm">
        {exercise.description || "No description provided."}
      </p>

      {isEditing ? (
        <div className="mt-6">
          <ExerciseEditorFields
            exercise={exercise}
            disabled={!isEditing}
            combinations={combinations}
            selectedCombinationIds={selectedCombinationIds}
            onToggleCombination={(combinationId) =>
              setSelectedCombinationIds((prev) =>
                prev.includes(combinationId)
                  ? prev.filter((value) => value !== combinationId)
                  : [...prev, combinationId],
              )
            }
            onValidationChange={setHasFormErrors}
            onChange={setExercise}
          />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border p-3">
              <p className="text-muted-foreground text-xs">Categories</p>
              <p className="mt-1 text-sm font-medium">
                {exercise.categories.join(", ") || "None"}
              </p>
            </div>

            <div className="rounded-xl border p-3">
              <p className="text-muted-foreground text-xs">Muscle groups</p>
              <p className="mt-1 text-sm font-medium">
                {exercise.muscleGroups.join(", ") || "None"}
              </p>
            </div>

            <div className="rounded-xl border p-3">
              <p className="text-muted-foreground text-xs">Equipment</p>
              <p className="mt-1 text-sm font-medium">
                {exercise.equipment || "Not set"}
              </p>
            </div>

            <div className="rounded-xl border p-3">
              <p className="text-muted-foreground text-xs">Progression</p>
              <p className="mt-1 text-sm font-medium">
                {exercise.progression.repRange
                  ? `Rep range ${exercise.progression.repRange.min}-${exercise.progression.repRange.max}`
                  : "No rep range set"}
              </p>
            </div>
          </div>

          {exercise.notes.length > 0 ? (
            <div className="rounded-xl border p-3">
              <p className="text-muted-foreground text-xs">Notes</p>
              <ul className="mt-2 space-y-1 text-sm">
                {exercise.notes.map((note) => (
                  <li key={note}>• {note}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="rounded-xl border p-3">
            <p className="text-muted-foreground text-xs">Combinations</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {combinations.filter((combination) =>
                combination.exerciseIds.includes(exercise.id),
              ).length > 0 ? (
                combinations
                  .filter((combination) =>
                    combination.exerciseIds.includes(exercise.id),
                  )
                  .map((combination) => (
                    <Link
                      key={combination.id}
                      href={`/workouts/combinations/${combination.id}`}
                      className="hover:bg-accent rounded-full border px-3 py-1 text-sm transition-colors"
                    >
                      {combination.name}
                    </Link>
                  ))
              ) : (
                <p className="text-sm">No combinations attached.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-2">
        {isEditing ? (
          <>
            <Button
              onClick={handleSave}
              disabled={
                (!hasChanges && !hasCombinationChanges) ||
                saving ||
                hasFormErrors
              }
            >
              {saving ? "Saving..." : "Save"}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setExercise(original);
                setSelectedCombinationIds(
                  combinations
                    .filter((combination) =>
                      combination.exerciseIds.includes(exercise.id),
                    )
                    .map((combination) => combination.id),
                );
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
                Delete is disabled because this exercise is used in workout
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
            <DialogTitle>Delete exercise?</DialogTitle>
            <DialogDescription>
              This will permanently remove the exercise.
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
