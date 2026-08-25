"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import ExerciseEditorFields from "@/components/workouts/ExerciseEditorFields";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { apiRequest } from "@/lib/api/client";
import {
  getDefaultEquipmentOptions,
  normalizeEquipmentValue,
} from "@/lib/workouts/constants";
import { getExerciseEquipments } from "@/lib/workouts/exercise-filters";
import { ExerciseDefinition } from "@/models/workout";
import { normalizeExercisePayload } from "@/lib/workouts/normalize";

const DEFAULT_EXERCISE: ExerciseDefinition = {
  id: "",
  name: "",
  categories: [],
  muscleGroups: [],
  equipment: undefined,
  equipments: [],
  measurementMode: "external_load",
  type: undefined,
  description: undefined,
  notes: [],
  tracking: {
    weight: true,
    reps: true,
    effort: true,
  },
  weightTracking: {
    unit: "kg",
    mode: "total",
  },
  progression: {
    repRange: null,
    strategy: "ascending_weight",
  },
  currentWeight: null,
  targetWeight: null,
  active: true,
};

export default function NewExercisePage() {
  const { user } = useRequireAuth();
  const router = useRouter();

  const [exercise, setExercise] =
    useState<ExerciseDefinition>(DEFAULT_EXERCISE);
  const [equipmentOptions, setEquipmentOptions] = useState<string[]>(
    getDefaultEquipmentOptions(),
  );
  const [saving, setSaving] = useState(false);
  const [hasFormErrors, setHasFormErrors] = useState(false);

  useEffect(() => {
    async function loadEquipmentOptions() {
      if (!user) {
        return;
      }

      try {
        const allExercises = await apiRequest<ExerciseDefinition[]>(
          user,
          "/api/exercises?includeInactive=true",
        );

        const customEquipment = (allExercises ?? []).flatMap((entry) =>
          getExerciseEquipments(entry),
        );

        setEquipmentOptions(
          Array.from(
            new Set([
              ...getDefaultEquipmentOptions(),
              ...customEquipment.map((value) => normalizeEquipmentValue(value)),
            ]),
          ).sort(),
        );
      } catch (error) {
        console.error(error);
      }
    }

    loadEquipmentOptions();
  }, [user]);

  const mergedEquipmentOptions = useMemo(() => {
    return Array.from(
      new Set([
        ...equipmentOptions,
        ...(exercise.equipments ?? []),
        ...(exercise.equipment ? [exercise.equipment] : []),
      ]),
    ).sort();
  }, [equipmentOptions, exercise.equipment, exercise.equipments]);

  async function handleSave() {
    if (!user) {
      return;
    }

    try {
      if (hasFormErrors) {
        toast.error("Fix the exercise form errors before saving.");
        return;
      }

      setSaving(true);

      const payload = normalizeExercisePayload(exercise);

      await apiRequest(user, "/api/exercises", {
        method: "POST",
        body: payload,
      });

      toast.success("Exercise created");
      router.push("/workouts/exercises");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create exercise",
      );
    } finally {
      setSaving(false);
    }
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

      <h1 className="mb-8 text-3xl font-bold tracking-tight">Add Exercise</h1>

      <div className="space-y-4">
        <ExerciseEditorFields
          exercise={exercise}
          equipmentOptions={mergedEquipmentOptions}
          onChange={setExercise}
          onValidationChange={setHasFormErrors}
        />
        <div className="pt-2">
          <Button onClick={handleSave} disabled={saving || hasFormErrors}>
            {saving ? "Saving..." : "Create Exercise"}
          </Button>
        </div>
      </div>
    </div>
  );
}
