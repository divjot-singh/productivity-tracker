"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { apiRequest } from "@/lib/api/client";
import { ExerciseDefinition, WorkoutCombination } from "@/models/workout";
import { normalizeCombinationPayload } from "@/lib/workouts/normalize";

const DEFAULT_COMBINATION: WorkoutCombination = {
  id: "",
  name: "",
  description: "",
  exerciseIds: [],
  active: true,
};

export default function NewCombinationPage() {
  const { user } = useRequireAuth();
  const router = useRouter();

  const [combination, setCombination] =
    useState<WorkoutCombination>(DEFAULT_COMBINATION);
  const [exercises, setExercises] = useState<ExerciseDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    <div className="pb-4">
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
          <Label>Exercises ({selectedCount} selected)</Label>

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
              {exercises.map((exercise) => {
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
