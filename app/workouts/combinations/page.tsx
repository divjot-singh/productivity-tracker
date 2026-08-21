"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { apiRequest } from "@/lib/api/client";
import { ExerciseDefinition, WorkoutCombination } from "@/models/workout";
import { cn } from "@/lib/utils";

export default function WorkoutCombinationsPage() {
  const { user } = useRequireAuth();

  const [combinations, setCombinations] = useState<WorkoutCombination[]>([]);
  const [exercises, setExercises] = useState<ExerciseDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) {
        return;
      }

      try {
        setLoading(true);

        const [comboData, exerciseData] = await Promise.all([
          apiRequest<WorkoutCombination[]>(
            user,
            "/api/combinations?includeInactive=true",
          ),
          apiRequest<ExerciseDefinition[]>(
            user,
            "/api/exercises?includeInactive=true",
          ),
        ]);

        setCombinations(comboData ?? []);
        setExercises(exerciseData ?? []);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load combinations");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

  const exerciseNameMap = useMemo(() => {
    return new Map(exercises.map((exercise) => [exercise.id, exercise.name]));
  }, [exercises]);

  return (
    <div className="space-y-6 pb-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Combinations</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage reusable exercise combinations.
        </p>
      </div>

      <div>
        <Link
          href="/workouts/combinations/new"
          className={cn(buttonVariants({ size: "sm" }), "w-full sm:w-auto")}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add Combination
        </Link>
      </div>

      {loading ? (
        <div className="text-muted-foreground p-6 text-sm">
          Loading combinations...
        </div>
      ) : combinations.length === 0 ? (
        <div className="bg-card rounded-2xl border p-8 text-center">
          <p className="text-muted-foreground text-sm">No combinations yet.</p>
        </div>
      ) : (
        <div className="bg-card overflow-hidden rounded-2xl border">
          {combinations.map((combination) => (
            <Link
              key={combination.id}
              href={`/workouts/combinations/${combination.id}`}
              className="hover:bg-accent flex items-center justify-between gap-3 border-b px-4 py-3 transition-colors last:border-b-0"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{combination.name}</p>

                <p className="text-muted-foreground truncate text-xs">
                  {combination.exerciseIds
                    .map((id) => exerciseNameMap.get(id) ?? id)
                    .join(", ") || "No exercises"}
                </p>
              </div>

              <ChevronRight size={16} className="text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
