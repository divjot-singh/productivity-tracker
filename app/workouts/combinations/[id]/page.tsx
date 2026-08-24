"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Dumbbell,
  Pencil,
  Trash2,
  FileText,
  Flame,
  CircleAlert,
  Save,
  ChevronRight,
} from "lucide-react";
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

        toast.error(
          error instanceof Error ? error.message : "Failed to load combination",
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, user]);

  const exerciseMap = useMemo(() => {
    return new Map(exercises.map((exercise) => [exercise.id, exercise]));
  }, [exercises]);

  const activeExercises = useMemo(
    () => exercises.filter((exercise) => exercise.active),
    [exercises],
  );

  const hasChanges = JSON.stringify(combination) !== JSON.stringify(original);

  const canDelete = referencingWorkouts.length === 0;

  function updateCombination(updates: Partial<WorkoutCombination>) {
    setCombination((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        ...updates,
      };
    });
  }

  function toggleExercise(exerciseId: string) {
    setCombination((prev) => {
      if (!prev) {
        return prev;
      }

      const has = prev.exerciseIds.includes(exerciseId);

      return {
        ...prev,
        exerciseIds: has
          ? prev.exerciseIds.filter((value) => value !== exerciseId)
          : [...prev.exerciseIds, exerciseId],
      };
    });
  }

  function handleStartEditing() {
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setCombination(original);
    setIsEditing(false);
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
    return (
      <div className="mx-auto max-w-3xl pb-32">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="bg-muted h-5 w-24 animate-pulse rounded" />
            <div className="bg-muted h-9 w-20 animate-pulse rounded-lg" />
          </div>

          <div className="space-y-3">
            <div className="bg-muted h-9 w-72 max-w-full animate-pulse rounded" />
            <div className="bg-muted h-4 w-full max-w-xl animate-pulse rounded" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="bg-muted h-24 animate-pulse rounded-2xl" />
            <div className="bg-muted h-24 animate-pulse rounded-2xl" />
          </div>

          <div className="bg-muted h-48 animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!combination) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="bg-card rounded-2xl border p-8 text-center">
          <div className="bg-muted mx-auto flex h-10 w-10 items-center justify-center rounded-xl">
            <Dumbbell className="text-muted-foreground h-5 w-5" />
          </div>

          <p className="mt-3 text-sm font-medium">Combination not found.</p>

          <Link
            href="/workouts/combinations"
            className="text-primary mt-2 inline-block text-sm font-medium hover:underline"
          >
            Back to combinations
          </Link>
        </div>
      </div>
    );
  }

  const selectedExercises = combination.exerciseIds
    .map((exerciseId) => exerciseMap.get(exerciseId))
    .filter(Boolean) as ExerciseDefinition[];

  return (
    <div className="mx-auto max-w-3xl pb-32">
      {/* Header */}
      <div className="mb-7 flex items-center justify-between gap-3">
        <button
          onClick={() => {
            if (isEditing && hasChanges) {
              return;
            }

            router.back();
          }}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Combinations
        </button>

        {!isEditing ? (
          <Button variant="outline" size="sm" onClick={handleStartEditing}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancelEdit}
            disabled={saving}
          >
            Cancel
          </Button>
        )}
      </div>

      {/* Identity */}
      <section className="mb-8">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
            <Dumbbell className="h-6 w-6" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {combination.name}
              </h1>

              {combination.active === false ? (
                <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase">
                  Inactive
                </span>
              ) : null}
            </div>

            <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
              {combination.description || "No description provided."}
            </p>
          </div>
        </div>
      </section>

      {isEditing ? (
        <>
          {/* Edit header */}
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-xl">
                <Pencil className="h-4 w-4" />
              </div>

              <div>
                <p className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
                  Combination
                </p>
                <h2 className="text-lg font-semibold tracking-tight">
                  Edit combination
                </h2>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Details */}
            <section className="bg-card rounded-2xl border p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="combination-name">Name</Label>

                  <Input
                    id="combination-name"
                    value={combination.name}
                    onChange={(event) =>
                      updateCombination({
                        name: event.target.value,
                      })
                    }
                    disabled={saving}
                    placeholder="e.g. Push A"
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="combination-description">Description</Label>

                  <Input
                    id="combination-description"
                    value={combination.description ?? ""}
                    onChange={(event) =>
                      updateCombination({
                        description: event.target.value,
                      })
                    }
                    disabled={saving}
                    placeholder="Short description"
                    className="h-9"
                  />
                </div>
              </div>
            </section>

            {/* Guidance */}
            <section className="bg-card rounded-2xl border p-4">
              <div className="mb-3">
                <h3 className="text-sm font-semibold">Training guidance</h3>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Textarea
                  id="coaching-notes"
                  value={combination.coachingNotes ?? ""}
                  onChange={(event) =>
                    updateCombination({
                      coachingNotes: event.target.value,
                    })
                  }
                  disabled={saving}
                  placeholder="Coaching notes / execution cues"
                  className="min-h-20 resize-none"
                />

                <Textarea
                  id="warmup-guidance"
                  value={combination.warmupGuidance ?? ""}
                  onChange={(event) =>
                    updateCombination({
                      warmupGuidance: event.target.value,
                    })
                  }
                  disabled={saving}
                  placeholder="Warm-up guidance"
                  className="min-h-20 resize-none"
                />
              </div>
            </section>

            {/* Exercises */}
            <section className="bg-card overflow-hidden rounded-2xl border">
              <div className="border-b px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">Exercises</h3>
                    <p className="text-muted-foreground mt-0.5 text-[11px]">
                      Select the exercises for this workout.
                    </p>
                  </div>

                  <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-[11px] font-semibold">
                    {combination.exerciseIds.length} selected
                  </span>
                </div>

                {/* Selected exercises */}
                {combination.exerciseIds.length > 0 ? (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {combination.exerciseIds.map((exerciseId) => {
                      const exercise = activeExercises.find(
                        (item) => item.id === exerciseId,
                      );

                      if (!exercise) {
                        return null;
                      }

                      return (
                        <button
                          key={exercise.id}
                          type="button"
                          onClick={() => toggleExercise(exercise.id)}
                          disabled={saving}
                          className="bg-primary/10 text-primary hover:bg-primary/15 inline-flex max-w-full items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium transition-colors"
                        >
                          <span className="truncate">{exercise.name}</span>
                          <span className="shrink-0 opacity-60">×</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground mt-2 text-[11px]">
                    No exercises selected.
                  </p>
                )}
              </div>

              {/* Exercise list */}
              <div className="max-h-72 overflow-y-auto p-2">
                {activeExercises.length === 0 ? (
                  <p className="text-muted-foreground p-3 text-sm">
                    No active exercises available.
                  </p>
                ) : (
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {activeExercises.map((exercise) => {
                      const checked = combination.exerciseIds.includes(
                        exercise.id,
                      );

                      return (
                        <button
                          key={exercise.id}
                          type="button"
                          onClick={() => toggleExercise(exercise.id)}
                          disabled={saving}
                          className={[
                            "flex min-w-0 items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors",
                            checked
                              ? "border-primary/30 bg-primary/5"
                              : "hover:bg-accent hover:border-border border-transparent",
                          ].join(" ")}
                        >
                          {/* Checkbox */}
                          <span
                            className={[
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                              checked
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-input bg-background",
                            ].join(" ")}
                          >
                            {checked ? (
                              <svg
                                viewBox="0 0 12 12"
                                className="h-2.5 w-2.5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M2 6l2.5 2.5L10 3" />
                              </svg>
                            ) : null}
                          </span>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium">
                              {exercise.name}
                            </p>

                            <p className="text-muted-foreground mt-0.5 truncate text-[10px]">
                              {exercise.categories?.join(" • ") ||
                                "Uncategorized"}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Desktop actions */}
          <div className="mt-5 hidden items-center justify-between sm:flex">
            <Button
              variant="ghost"
              onClick={handleCancelEdit}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button onClick={handleSave} disabled={!hasChanges || saving}>
              <Save className="mr-1.5 h-4 w-4" />
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
          {/* Mobile action bar */}
          <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-[57px] z-50 border-t p-2.5 backdrop-blur">
            <div className="mx-auto flex max-w-3xl gap-2">
              <Button
                variant="outline"
                className="h-10 flex-1"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                Cancel
              </Button>

              <Button
                className="h-10 flex-1"
                onClick={handleSave}
                disabled={!hasChanges || saving}
              >
                <Save className="mr-1.5 h-4 w-4" />
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Overview */}
          <section className="mb-8">
            <div className="mb-3">
              <h2 className="text-base font-semibold">Overview</h2>

              <p className="text-muted-foreground mt-0.5 text-xs">
                Workout structure and usage
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="bg-card rounded-2xl border p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-xl">
                    <Dumbbell className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-muted-foreground text-xs">Exercises</p>

                    <p className="mt-0.5 text-lg font-semibold">
                      {combination.exerciseIds.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl border p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-xl">
                    <FileText className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-muted-foreground text-xs">
                      Workout usage
                    </p>

                    <p className="mt-0.5 text-lg font-semibold">
                      {referencingWorkouts.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Exercises */}
          <section className="mb-8">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Exercises</h2>

                <p className="text-muted-foreground mt-0.5 text-xs">
                  Exercises included in this combination
                </p>
              </div>

              <span className="text-muted-foreground text-xs font-medium">
                {selectedExercises.length}
              </span>
            </div>

            <div className="bg-card overflow-hidden rounded-2xl border">
              {selectedExercises.length === 0 ? (
                <div className="p-5 text-center">
                  <p className="text-muted-foreground text-sm">
                    No exercises selected.
                  </p>
                </div>
              ) : (
                selectedExercises.map((exercise, index) => (
                  <Link
                    key={exercise.id}
                    href={`/workouts/exercises/${encodeURIComponent(
                      exercise.id,
                    )}`}
                    className="hover:bg-accent/50 flex items-center gap-3 border-b px-4 py-3 transition-colors last:border-b-0"
                  >
                    <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold">
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {exercise.name}
                      </p>

                      <p className="text-muted-foreground mt-0.5 truncate text-[11px]">
                        {exercise.categories?.join(" • ") || "Uncategorized"}
                      </p>
                    </div>

                    <ChevronLeft className="text-muted-foreground h-4 w-4 rotate-180" />
                  </Link>
                ))
              )}
            </div>
          </section>

          {/* Coaching */}
          {combination.coachingNotes ? (
            <section className="mb-8">
              <div className="mb-3">
                <h2 className="text-base font-semibold">Coaching notes</h2>

                <p className="text-muted-foreground mt-0.5 text-xs">
                  Cues to keep in mind during the workout
                </p>
              </div>

              <div className="bg-muted/30 rounded-2xl border p-4">
                <div className="flex gap-3">
                  <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                    <FileText className="h-4 w-4" />
                  </div>

                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {combination.coachingNotes}
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          {/* Warm-up */}
          {combination.warmupGuidance ? (
            <section className="mb-8">
              <div className="mb-3">
                <h2 className="text-base font-semibold">Warm-up guidance</h2>

                <p className="text-muted-foreground mt-0.5 text-xs">
                  Preparation before your working sets
                </p>
              </div>

              <div className="bg-muted/30 rounded-2xl border p-4">
                <div className="flex gap-3">
                  <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                    <Flame className="h-4 w-4" />
                  </div>

                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {combination.warmupGuidance}
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          {/* Workout history */}
          {referencingWorkouts.length > 0 ? (
            <section className="mb-10">
              <div className="mb-3">
                <h2 className="text-base font-semibold">Workout history</h2>

                <p className="text-muted-foreground mt-0.5 text-xs">
                  Dates where this combination was used
                </p>
              </div>

              <div className="bg-card overflow-hidden rounded-2xl border">
                {referencingWorkouts.slice(0, 8).map((workout) => (
                  <Link
                    key={workout.id}
                    href={`/workouts/${encodeURIComponent(workout.date)}`}
                    className="hover:bg-accent/50 flex items-center justify-between px-4 py-3 transition-colors"
                  >
                    <span className="text-sm font-medium">{workout.date}</span>

                    <ChevronRight className="text-muted-foreground h-4 w-4" />
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

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
                    Permanently remove this workout combination.
                  </p>

                  {!canDelete ? (
                    <div className="bg-muted/50 mt-3 flex gap-2 rounded-lg p-3">
                      <CircleAlert className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />

                      <p className="text-muted-foreground text-xs leading-relaxed">
                        This combination can't be deleted because it is used in
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
            <DialogTitle>Delete combination?</DialogTitle>

            <DialogDescription>
              This will permanently remove{" "}
              <span className="text-foreground font-medium">
                {combination.name}
              </span>{" "}
              from your workout library. This action cannot be undone.
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
              {isDeleting ? "Deleting..." : "Delete combination"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
