"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronLeft, X } from "lucide-react";
import { toast } from "sonner";

import ActionBar from "@/components/common/ActionBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { apiRequest } from "@/lib/api/client";
import {
  formatExerciseEquipmentLabel,
  titleCaseWorkoutValue,
} from "@/lib/workouts/constants";
import {
  filterExercises,
  getExerciseEquipmentLabel,
  getExerciseFilterOptions,
} from "@/lib/workouts/exercise-filters";
import { ExerciseDefinition, WorkoutCombination } from "@/models/workout";
import { normalizeCombinationPayload } from "@/lib/workouts/normalize";

const DEFAULT_COMBINATION: WorkoutCombination = {
  id: "",
  name: "",
  description: "",
  coachingNotes: "",
  warmupGuidance: "",
  exerciseIds: [],
  active: true,
};

const NATIVE_SELECT_CLASS =
  "border-input bg-background text-foreground focus:ring-primary/40 h-10 w-full appearance-none rounded-xl border px-2 pr-9 text-xs transition outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60";

export default function NewCombinationPage() {
  const { user } = useRequireAuth();
  const router = useRouter();

  const [combination, setCombination] =
    useState<WorkoutCombination>(DEFAULT_COMBINATION);
  const [exercises, setExercises] = useState<ExerciseDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exerciseQuery, setExerciseQuery] = useState("");
  const [exerciseCategoryFilter, setExerciseCategoryFilter] = useState("");
  const [exerciseMuscleFilter, setExerciseMuscleFilter] = useState("");
  const [exerciseEquipmentFilter, setExerciseEquipmentFilter] = useState("");

  useEffect(() => {
    async function loadExercises() {
      if (!user) {
        return;
      }

      try {
        setLoading(true);

        const data = await apiRequest<ExerciseDefinition[]>(
          user,
          "/api/exercises?includeInactive=true",
        );

        setExercises((data ?? []).filter((exercise) => exercise.active));
      } catch (error) {
        console.error(error);
        toast.error("Failed to load exercises");
      } finally {
        setLoading(false);
      }
    }

    loadExercises();
  }, [user]);

  const selectedCount = useMemo(
    () => combination.exerciseIds.length,
    [combination],
  );

  const exerciseFilterOptions = useMemo(() => {
    return getExerciseFilterOptions(exercises);
  }, [exercises]);

  const filteredExercises = useMemo(() => {
    return filterExercises(exercises, {
      query: exerciseQuery,
      category: exerciseCategoryFilter,
      muscleGroup: exerciseMuscleFilter,
      equipment: exerciseEquipmentFilter,
    });
  }, [
    exerciseCategoryFilter,
    exerciseEquipmentFilter,
    exerciseMuscleFilter,
    exerciseQuery,
    exercises,
  ]);

  async function handleSave() {
    if (!user) {
      return;
    }

    try {
      setSaving(true);

      const payload = normalizeCombinationPayload(combination);

      await apiRequest(user, "/api/combinations", {
        method: "POST",
        body: payload,
      });

      toast.success("Combination created");
      router.push("/workouts/combinations");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create combination",
      );
    } finally {
      setSaving(false);
    }
  }

  function moveExercise(index: number, direction: -1 | 1) {
    setCombination((prev) => {
      const ids = [...prev.exerciseIds];
      const target = index + direction;

      if (target < 0 || target >= ids.length) return prev;

      [ids[index], ids[target]] = [ids[target], ids[index]];

      return { ...prev, exerciseIds: ids };
    });
  }

  function toggleExercise(exerciseId: string) {
    setCombination((prev) => {
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

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ChevronLeft size={18} />
        Back
      </button>

      <h1 className="mb-4 text-2xl font-bold tracking-tight">
        Add Combination
      </h1>

      <div className="space-y-6">
        <div className="space-y-3">
          <Label>Name</Label>
          <Input
            value={combination.name}
            onChange={(e) =>
              setCombination((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Push"
          />
        </div>

        <div className="space-y-3">
          <Label>Description</Label>
          <Textarea
            value={combination.description ?? ""}
            onChange={(e) =>
              setCombination((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            placeholder="Optional description"
          />
        </div>

        <div className="space-y-3">
          <Label>Coaching Notes</Label>
          <Textarea
            value={combination.coachingNotes ?? ""}
            onChange={(e) =>
              setCombination((prev) => ({
                ...prev,
                coachingNotes: e.target.value,
              }))
            }
            placeholder="Execution cues for this day"
          />
        </div>

        <div className="space-y-3">
          <Label>Warm-up Guidance</Label>
          <Textarea
            value={combination.warmupGuidance ?? ""}
            onChange={(e) =>
              setCombination((prev) => ({
                ...prev,
                warmupGuidance: e.target.value,
              }))
            }
            placeholder="How to warm up before the first working sets"
          />
        </div>

        <div className="space-y-3">
          <Label>Exercises ({selectedCount} selected)</Label>

          {combination.exerciseIds.length > 0 ? (
            <div className="bg-card divide-y overflow-hidden rounded-2xl border">
              {combination.exerciseIds.map((id, index) => (
                <div
                  key={id}
                  className="flex items-center gap-1 py-1 pr-1 pl-4"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {index + 1}.{" "}
                    {exercises.find((item) => item.id === id)?.name ?? id}
                  </span>

                  <button
                    type="button"
                    aria-label="Move up"
                    disabled={index === 0}
                    onClick={() => moveExercise(index, -1)}
                    className="text-muted-foreground active:bg-accent flex h-10 w-10 items-center justify-center rounded-lg disabled:opacity-30"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    aria-label="Move down"
                    disabled={index === combination.exerciseIds.length - 1}
                    onClick={() => moveExercise(index, 1)}
                    className="text-muted-foreground active:bg-accent flex h-10 w-10 items-center justify-center rounded-lg disabled:opacity-30"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() => toggleExercise(id)}
                    className="text-muted-foreground active:text-destructive flex h-10 w-10 items-center justify-center rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <Input
            value={exerciseQuery}
            onChange={(event) => setExerciseQuery(event.target.value)}
            placeholder="Search exercises to add"
            className="h-11"
          />

          <div className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4">
            {["", ...exerciseFilterOptions.categories].map((value) => (
              <button
                key={value || "all"}
                type="button"
                aria-pressed={exerciseCategoryFilter === value}
                onClick={() => setExerciseCategoryFilter(value)}
                className={`h-8 shrink-0 rounded-full border px-3.5 text-xs font-medium ${
                  exerciseCategoryFilter === value
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "active:bg-accent"
                }`}
              >
                {value ? titleCaseWorkoutValue(value) : "All"}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-muted-foreground p-3 text-sm">
              Loading exercises...
            </div>
          ) : exercises.length === 0 ? (
            <div className="text-muted-foreground rounded-xl border p-3 text-sm">
              No active exercises available.
            </div>
          ) : (
            <div className="max-h-[45dvh] space-y-1 overflow-auto rounded-xl border p-2">
              {filteredExercises.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No exercises match current filters.
                </p>
              ) : (
                filteredExercises.map((exercise) => {
                  const checked = combination.exerciseIds.includes(exercise.id);

                  return (
                    <label
                      key={exercise.id}
                      className="hover:bg-accent flex min-h-11 cursor-pointer items-start gap-3 rounded-lg px-2 py-2"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleExercise(exercise.id)}
                        className="mt-1 h-4 w-4"
                      />

                      <div>
                        <p className="text-sm font-medium">{exercise.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {[
                            getExerciseEquipmentLabel(exercise),
                            ...exercise.categories,
                          ]
                            .filter(Boolean)
                            .join(" • ")}
                        </p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          )}
        </div>

        <ActionBar>
          <Button
            className="h-12 flex-1"
            onClick={handleSave}
            disabled={saving || !combination.name.trim()}
          >
            {saving ? "Saving..." : "Create combination"}
          </Button>
        </ActionBar>
      </div>
    </div>
  );
}
