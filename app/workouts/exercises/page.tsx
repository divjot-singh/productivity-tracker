"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { apiRequest } from "@/lib/api/client";
import { titleCaseWorkoutValue } from "@/lib/workouts/constants";
import {
  getExerciseEquipmentLabel,
  getExerciseEquipments,
} from "@/lib/workouts/exercise-filters";
import type { ExerciseStats } from "@/lib/workouts/exercise-stats";
import { ExerciseDefinition } from "@/models/workout";
import { cn } from "@/lib/utils";

export default function WorkoutExercisesPage() {
  const { user } = useRequireAuth();

  const [exercises, setExercises] = useState<ExerciseDefinition[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [stats, setStats] = useState<Map<string, ExerciseStats>>(new Map());
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

        apiRequest<ExerciseStats[]>(user, "/api/exercise-stats")
          .then((all) =>
            setStats(new Map(all.map((item) => [item.exerciseId, item]))),
          )
          .catch(() => undefined);
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

    const base = [...exercises]
      .filter(
        (exercise) =>
          !category || exercise.categories.includes(category as never),
      )
      .sort(
        (a, b) =>
          Number(b.active !== false) - Number(a.active !== false) ||
          a.name.localeCompare(b.name),
      );

    if (normalizedQuery.length === 0) {
      return base;
    }

    return base.filter((exercise) => {
      const haystack = [
        exercise.name,
        exercise.description,
        ...getExerciseEquipments(exercise),
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
  }, [exercises, query, category]);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(exercises.flatMap((exercise) => exercise.categories)),
      ).sort(),
    [exercises],
  );

  return (
    <div className="flex flex-col">
      <div className="border-b pb-3">
        <div className="mb-3 flex items-center justify-between gap-3 pt-1">
          <h2 className="text-xl font-semibold tracking-tight">Exercises</h2>

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

        {categories.length > 1 ? (
          <div className="-mx-4 mt-3 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4">
            {["", ...categories].map((value) => (
              <button
                key={value || "all"}
                type="button"
                aria-pressed={category === value}
                onClick={() => setCategory(value)}
                className={cn(
                  "h-8 shrink-0 rounded-full border px-3.5 text-xs font-medium",
                  category === value
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "active:bg-accent",
                )}
              >
                {value ? titleCaseWorkoutValue(value) : "All"}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="pt-4">
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
                  <p className="truncate font-medium">
                    {exercise.name}
                    {exercise.active === false ? (
                      <span className="bg-muted text-muted-foreground ml-2 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase">
                        Inactive
                      </span>
                    ) : null}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {[
                      getExerciseEquipmentLabel(exercise),
                      ...exercise.categories.map((category) =>
                        titleCaseWorkoutValue(category),
                      ),
                    ]
                      .filter(Boolean)
                      .join(" • ") || "No categories"}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {stats.get(exercise.id)?.prWeight ? (
                    <span className="text-warn text-xs">
                      PR {stats.get(exercise.id)?.prWeight?.value}{" "}
                      {exercise.weightTracking.unit}
                    </span>
                  ) : null}

                  <ChevronRight size={16} className="text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
