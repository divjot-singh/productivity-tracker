"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { apiRequest } from "@/lib/api/client";
import { ExerciseDefinition, WorkoutCombination } from "@/models/workout";
import { cn } from "@/lib/utils";

export default function WorkoutCombinationsPage() {
  const { user } = useRequireAuth();

  const [combinations, setCombinations] = useState<WorkoutCombination[]>([]);
  const [exercises, setExercises] = useState<ExerciseDefinition[]>([]);
  const [query, setQuery] = useState("");
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

  const exerciseMetaMap = useMemo(() => {
    return new Map(
      exercises.map((exercise) => [
        exercise.id,
        [
          exercise.name,
          exercise.description,
          exercise.equipment,
          exercise.type,
          ...(exercise.categories ?? []),
          ...(exercise.muscleGroups ?? []),
          ...(exercise.notes ?? []),
        ]
          .filter(Boolean)
          .join(" "),
      ]),
    );
  }, [exercises]);

  const filteredCombinations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (normalizedQuery.length === 0) {
      return combinations;
    }

    return combinations.filter((combination) => {
      const exerciseSearchText = combination.exerciseIds
        .map((id) => exerciseMetaMap.get(id) ?? id)
        .join(" ");

      const haystack = [
        combination.name,
        combination.description,
        combination.coachingNotes,
        combination.warmupGuidance,
        exerciseSearchText,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [combinations, exerciseMetaMap, query]);

  return (
    <div className="flex h-[calc(100dvh-14.5rem)] min-h-0 flex-col">
      <div className="bg-background sticky top-0 z-10 border-b pb-3">
        <div className="mb-3 flex items-center justify-between gap-3 pt-1">
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Workout Hub
            </p>
            <h2 className="text-xl font-semibold tracking-tight">
              Combinations
            </h2>
          </div>

          <Link
            href="/workouts/combinations/new"
            className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add
          </Link>
        </div>

        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, notes, exercise, equipment..."
          className="h-10"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pt-4">
        {loading ? (
          <div className="text-muted-foreground p-6 text-sm">
            Loading combinations...
          </div>
        ) : filteredCombinations.length === 0 ? (
          <div className="bg-card rounded-2xl border p-8 text-center">
            <p className="text-muted-foreground text-sm">
              {query.trim().length > 0
                ? "No combinations match your search."
                : "No combinations yet."}
            </p>
          </div>
        ) : (
          <div className="bg-card overflow-hidden rounded-2xl border">
            {filteredCombinations.map((combination) => (
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
    </div>
  );
}
