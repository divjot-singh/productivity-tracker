"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Dumbbell,
  Pencil,
  Trash2,
  CircleAlert,
} from "lucide-react";
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
  formatExerciseEquipmentList,
  getDefaultEquipmentOptions,
  getPrimaryMetricLabel,
  normalizeEquipmentValue,
  titleCaseWorkoutValue,
} from "@/lib/workouts/constants";
import { getExerciseEquipments } from "@/lib/workouts/exercise-filters";
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
  const [equipmentOptions, setEquipmentOptions] = useState<string[]>(
    getDefaultEquipmentOptions(),
  );
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

        const [combinationData, workoutData, allExercises] = await Promise.all([
          apiRequest<WorkoutCombination[]>(
            user,
            "/api/combinations?includeInactive=true",
          ),
          apiRequest<WorkoutEntry[]>(
            user,
            `/api/workouts?exerciseId=${encodeURIComponent(resolvedId)}`,
          ),
          apiRequest<ExerciseDefinition[]>(
            user,
            "/api/exercises?includeInactive=true",
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
        setEquipmentOptions(
          Array.from(
            new Set([
              ...getDefaultEquipmentOptions(),
              ...(allExercises ?? [])
                .flatMap((entry) => getExerciseEquipments(entry))
                .map((value) => normalizeEquipmentValue(value)),
            ]),
          ).sort(),
        );

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

    const originalCombinationIds = combinations
      .filter((combination) => combination.exerciseIds.includes(exerciseId))
      .map((combination) => combination.id)
      .sort();

    const currentCombinationIds = [...selectedCombinationIds].sort();

    return (
      JSON.stringify(currentCombinationIds) !==
      JSON.stringify(originalCombinationIds)
    );
  }, [combinations, exercise?.id, routeId, selectedCombinationIds]);

  const hasUnsavedChanges = hasChanges || hasCombinationChanges;

  const canDelete = referencingWorkouts.length === 0;

  async function handleSave() {
    if (!user || !exercise) {
      return;
    }

    if (hasFormErrors) {
      toast.error("Fix the exercise form errors before saving.");
      return;
    }

    if (!hasUnsavedChanges) {
      return;
    }

    try {
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

  function handleCancelEdit() {
    if (!original) {
      return;
    }

    setExercise(original);

    setSelectedCombinationIds(
      combinations
        .filter((combination) => combination.exerciseIds.includes(original.id))
        .map((combination) => combination.id),
    );

    setHasFormErrors(false);
    setIsEditing(false);
  }

  function handleStartEditing() {
    setHasFormErrors(false);
    setIsEditing(true);
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
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="space-y-4">
          <div className="bg-muted h-5 w-24 animate-pulse rounded" />
          <div className="bg-muted h-8 w-64 animate-pulse rounded" />
          <div className="bg-muted h-4 w-full max-w-xl animate-pulse rounded" />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="bg-muted h-24 animate-pulse rounded-xl" />
            <div className="bg-muted h-24 animate-pulse rounded-xl" />
            <div className="bg-muted h-24 animate-pulse rounded-xl" />
            <div className="bg-muted h-24 animate-pulse rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-muted-foreground">Exercise not found.</p>
      </div>
    );
  }

  const attachedCombinations = combinations.filter((combination) =>
    combination.exerciseIds.includes(exercise.id),
  );
  const progressionMetricLabel = getPrimaryMetricLabel(
    exercise.measurementMode,
  );

  return (
    <div className="mx-auto max-w-3xl pb-32">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => {
            if (isEditing && hasUnsavedChanges) {
              return;
            }

            router.back();
          }}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Exercises
        </button>

        {!isEditing ? (
          <Button variant="outline" size="sm" onClick={handleStartEditing}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            {hasUnsavedChanges ? (
              <span className="text-muted-foreground hidden text-xs sm:block">
                Unsaved changes
              </span>
            ) : null}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelEdit}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasUnsavedChanges || saving || hasFormErrors}
            >
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <>
          {/* Edit header */}
          <div className="mb-8">
            <div className="mb-3 flex items-center gap-2">
              <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-xl">
                <Pencil className="h-4 w-4" />
              </div>

              <div>
                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  Exercise
                </p>

                <h1 className="text-2xl font-bold tracking-tight">
                  Edit exercise
                </h1>
              </div>
            </div>

            <p className="text-muted-foreground text-sm">
              Update the exercise details, progression, notes, and workout
              combinations.
            </p>
          </div>

          {/* Editor */}
          <div className="bg-card rounded-2xl border p-4 shadow-sm sm:p-6">
            <ExerciseEditorFields
              exercise={exercise}
              equipmentOptions={equipmentOptions}
              disabled={saving}
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

          {/* Bottom desktop actions */}
          <div className="mt-6 hidden items-center justify-between sm:flex">
            <Button
              variant="ghost"
              onClick={handleCancelEdit}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || saving || hasFormErrors}
            >
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>

          {/* Mobile sticky actions */}
          <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed right-0 bottom-0 left-0 z-50 border-t p-3 backdrop-blur sm:hidden">
            <div className="mx-auto flex max-w-3xl gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                Cancel
              </Button>

              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={!hasUnsavedChanges || saving || hasFormErrors}
              >
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Exercise identity */}
          <section className="mb-8">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
                <Dumbbell className="h-6 w-6" />
              </div>

              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {exercise.name}
                </h1>

                <p className="text-muted-foreground mt-1 text-sm">
                  {exercise.description || "No description provided."}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {exercise.categories.map((category) => (
                <span
                  key={category}
                  className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-medium"
                >
                  {titleCaseWorkoutValue(category)}
                </span>
              ))}

              {exercise.muscleGroups.map((muscleGroup) => (
                <span
                  key={muscleGroup}
                  className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs font-medium"
                >
                  {titleCaseWorkoutValue(muscleGroup)}
                </span>
              ))}
            </div>
          </section>

          {/* Overview */}
          <section className="mb-8">
            <div className="mb-3">
              <h2 className="text-base font-semibold">Overview</h2>

              <p className="text-muted-foreground mt-0.5 text-xs">
                Exercise configuration and training targets
              </p>
            </div>

            <div className="bg-card overflow-hidden rounded-2xl border">
              <div className="grid sm:grid-cols-2">
                <InfoItem
                  label="Equipment"
                  value={formatExerciseEquipmentList(
                    getExerciseEquipments(exercise),
                  )}
                />

                <InfoItem
                  label="Muscle groups"
                  value={
                    exercise.muscleGroups
                      .map((value) => titleCaseWorkoutValue(value))
                      .join(", ") || "None"
                  }
                />

                <InfoItem
                  label="Categories"
                  value={
                    exercise.categories
                      .map((value) => titleCaseWorkoutValue(value))
                      .join(", ") || "None"
                  }
                />

                <InfoItem
                  label="Rep range"
                  value={
                    exercise.progression.repRange
                      ? `${exercise.progression.repRange.min}–${exercise.progression.repRange.max} reps`
                      : "Not configured"
                  }
                  emphasize
                />
              </div>
            </div>
          </section>

          {/* Progression */}
          <section className="mb-8">
            <div className="mb-3">
              <h2 className="text-base font-semibold">Progression</h2>

              <p className="text-muted-foreground mt-0.5 text-xs">
                How this exercise should progress over time
              </p>
            </div>

            <div className="bg-card rounded-2xl border p-4">
              {exercise.progression.repRange ? (
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold">
                    {exercise.progression.repRange.min}–
                    {exercise.progression.repRange.max}
                  </div>

                  <div>
                    <p className="text-sm font-semibold">Rep range</p>

                    <p className="text-muted-foreground mt-0.5 text-xs">
                      Aim to progress within this range before increasing{" "}
                      {progressionMetricLabel.toLowerCase()}.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No progression rule has been configured for this exercise.
                </p>
              )}
            </div>
          </section>

          {/* Notes */}
          {exercise.notes.length > 0 ? (
            <section className="mb-8">
              <div className="mb-3">
                <h2 className="text-base font-semibold">Training notes</h2>
              </div>

              <div className="bg-muted/30 rounded-2xl border p-4">
                <ul className="space-y-2">
                  {exercise.notes.map((note) => (
                    <li
                      key={note}
                      className="text-muted-foreground flex gap-2 text-sm"
                    >
                      <span className="text-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}

          {/* Combinations */}
          <section className="mb-10">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">
                  Used in combinations
                </h2>

                <p className="text-muted-foreground mt-0.5 text-xs">
                  Workout combinations containing this exercise
                </p>
              </div>

              <span className="text-muted-foreground text-xs font-medium">
                {attachedCombinations.length}
              </span>
            </div>

            <div className="bg-card rounded-2xl border p-4">
              {attachedCombinations.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {attachedCombinations.map((combination) => (
                    <Link
                      key={combination.id}
                      href={`/workouts/combinations/${combination.id}`}
                      className="hover:bg-accent rounded-full border px-3 py-1.5 text-sm font-medium transition-colors"
                    >
                      {combination.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  This exercise isn't attached to any workout combination.
                </p>
              )}
            </div>
          </section>

          {/* Danger zone */}
          <section className="border-destructive/30 rounded-2xl border">
            <div className="p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="bg-destructive/10 text-destructive flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                  <Trash2 className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold">Danger zone</h2>

                  <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                    Permanently remove this exercise from your exercise library.
                  </p>

                  {!canDelete ? (
                    <div className="bg-muted/50 mt-3 flex gap-2 rounded-lg p-3">
                      <CircleAlert className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />

                      <p className="text-muted-foreground text-xs leading-relaxed">
                        This exercise can't be deleted because it is used in
                        workout history on{" "}
                        {referencingWorkouts
                          .map((workout) => workout.date)
                          .join(", ")}
                        .
                      </p>
                    </div>
                  ) : null}
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={!canDelete}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Delete dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete exercise?</DialogTitle>

            <DialogDescription>
              This will permanently remove{" "}
              <span className="text-foreground font-medium">
                {exercise.name}
              </span>{" "}
              from your exercise library. This action cannot be undone.
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
              {isDeleting ? "Deleting..." : "Delete exercise"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoItem({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="border-b p-4 last:border-b-0 sm:[&:nth-child(-n+2)]:border-b sm:[&:nth-child(odd)]:border-r">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>

      <p
        className={`mt-1.5 text-sm ${
          emphasize ? "font-semibold" : "font-medium"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
