"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { apiRequest } from "@/lib/api/client";
import {
  formatExerciseEquipmentLabel,
  titleCaseWorkoutValue,
} from "@/lib/workouts/constants";
import { ExerciseDefinition } from "@/models/workout";
import { cn } from "@/lib/utils";

export default function WorkoutExercisesPage() {
  const { user } = useRequireAuth();

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
        const data = await apiRequest<ExerciseDefinition[]>(
          user,
          "/api/exercises?includeInactive=true",
        );
        setExercises(data ?? []);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load exercises");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

  const filteredExercises = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (normalizedQuery.length === 0) {
      return exercises;
    }

    return exercises.filter((exercise) => {
      const haystack = [
        exercise.name,
        exercise.description,
        exercise.equipment,
        exercise.type,
        ...(exercise.categories ?? []),
        ...(exercise.muscleGroups ?? []),
        ...(exercise.notes ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [exercises, query]);

  return (
    <div className="flex h-[calc(100dvh-14.5rem)] min-h-0 flex-col">
      <div className="bg-background sticky top-0 z-10 border-b pb-3">
        <div className="mb-3 flex items-center justify-between gap-3 pt-1">
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Workout Hub
            </p>
            <h2 className="text-xl font-semibold tracking-tight">Exercises</h2>
          </div>

          <Link
            href="/workouts/exercises/new"
            className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add
          </Link>
        </div>

        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title, muscle, equipment, category..."
          className="h-10"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pt-4">
        {loading ? (
          <div className="text-muted-foreground p-6 text-sm">
            Loading exercises...
          </div>
        ) : filteredExercises.length === 0 ? (
          <div className="bg-card rounded-2xl border p-8 text-center">
            <p className="text-muted-foreground text-sm">
              {query.trim().length > 0
                ? "No exercises match your search."
                : "No exercises yet."}
            </p>
          </div>
        ) : (
          <div className="bg-card overflow-hidden rounded-2xl border">
            {filteredExercises.map((exercise) => (
              <Link
                key={exercise.id}
                href={`/workouts/exercises/${encodeURIComponent(exercise.id)}`}
                className="hover:bg-accent flex items-center justify-between gap-3 border-b px-4 py-3 transition-colors last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{exercise.name}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {[
                      exercise.equipment
                        ? formatExerciseEquipmentLabel(exercise.equipment)
                        : undefined,
                      ...exercise.categories.map((category) =>
                        titleCaseWorkoutValue(category),
                      ),
                    ]
                      .filter(Boolean)
                      .join(" • ") || "No categories"}
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
