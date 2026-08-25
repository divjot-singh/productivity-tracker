"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

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
    <div className="pb-17">
      <button
        onClick={() => router.back()}
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ChevronLeft size={18} />
        Back
      </button>

      <h1 className="mb-8 text-3xl font-bold tracking-tight">
        Add Combination
      </h1>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={combination.name}
            onChange={(e) =>
              setCombination((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Push"
          />
        </div>

        <div className="space-y-2">
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

        <div className="space-y-2">
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

        <div className="space-y-2">
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

        <div className="space-y-2">
          <Label>Exercises ({selectedCount} selected)</Label>

          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              value={exerciseQuery}
              onChange={(event) => setExerciseQuery(event.target.value)}
              placeholder="Search exercises"
            />

            <div className="grid grid-cols-3 gap-2">
              <div className="relative">
                <select
                  value={exerciseCategoryFilter}
                  onChange={(event) =>
                    setExerciseCategoryFilter(event.target.value)
                  }
                  className={NATIVE_SELECT_CLASS}
                >
                  <option value="">All categories</option>
                  {exerciseFilterOptions.categories.map((value) => (
                    <option key={value} value={value}>
                      {titleCaseWorkoutValue(value)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
              </div>

              <div className="relative">
                <select
                  value={exerciseMuscleFilter}
                  onChange={(event) =>
                    setExerciseMuscleFilter(event.target.value)
                  }
                  className={NATIVE_SELECT_CLASS}
                >
                  <option value="">All muscles</option>
                  {exerciseFilterOptions.muscleGroups.map((value) => (
                    <option key={value} value={value}>
                      {titleCaseWorkoutValue(value)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
              </div>

              <div className="relative">
                <select
                  value={exerciseEquipmentFilter}
                  onChange={(event) =>
                    setExerciseEquipmentFilter(event.target.value)
                  }
                  className={NATIVE_SELECT_CLASS}
                >
                  <option value="">All equipment</option>
                  {exerciseFilterOptions.equipments.map((value) => (
                    <option key={value} value={value}>
                      {formatExerciseEquipmentLabel(value)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
              </div>
            </div>
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
            <div className="max-h-72 space-y-2 overflow-auto rounded-xl border p-3">
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

        <div className="pt-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Create Combination"}
          </Button>
        </div>
      </div>
    </div>
  );
}
