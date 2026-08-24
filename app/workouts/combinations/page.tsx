"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Dumbbell, Plus, Search } from "lucide-react";
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

  const exerciseMap = useMemo(() => {
    return new Map(exercises.map((exercise) => [exercise.id, exercise]));
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

    if (!normalizedQuery) {
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

  const activeCount = combinations.filter(
    (combination) => combination.active !== false,
  ).length;

  return (
    <div className="flex h-[calc(100dvh-14.5rem)] min-h-0 flex-col">
      {/* Header */}
      <div className="bg-background sticky top-0 z-10 border-b pb-3">
        <div className="mb-4 flex items-center justify-between gap-3 pt-1">
          <div className="min-w-0">
            <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
              Workout Hub
            </p>

            <div className="mt-0.5 flex items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight">
                Combinations
              </h2>

              {!loading ? (
                <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[11px] font-medium">
                  {activeCount}
                </span>
              ) : null}
            </div>
          </div>

          <Link
            href="/workouts/combinations/new"
            className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />

          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search combinations or exercises..."
            className="h-10 pl-9"
          />
        </div>

        {!loading ? (
          <div className="text-muted-foreground mt-2 text-[11px]">
            {query.trim()
              ? `${filteredCombinations.length} result${
                  filteredCombinations.length === 1 ? "" : "s"
                }`
              : `${combinations.length} combination${
                  combinations.length === 1 ? "" : "s"
                }`}
          </div>
        ) : null}
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto pt-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="bg-card animate-pulse rounded-2xl border p-4"
              >
                <div className="flex gap-3">
                  <div className="bg-muted h-10 w-10 shrink-0 rounded-xl" />

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="bg-muted h-4 w-40 rounded" />
                    <div className="bg-muted h-3 w-64 max-w-full rounded" />
                    <div className="bg-muted h-3 w-32 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredCombinations.length === 0 ? (
          <div className="bg-card rounded-2xl border p-8 text-center">
            <div className="bg-primary/10 text-primary mx-auto flex h-11 w-11 items-center justify-center rounded-xl">
              {query.trim() ? (
                <Search className="h-5 w-5" />
              ) : (
                <Dumbbell className="h-5 w-5" />
              )}
            </div>

            <h3 className="mt-3 text-sm font-semibold">
              {query.trim()
                ? "No combinations found"
                : "No workout combinations yet"}
            </h3>

            <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-xs leading-relaxed">
              {query.trim()
                ? "Try a different combination name, exercise, muscle group, or equipment."
                : "Create combinations to quickly build your workouts from groups of exercises."}
            </p>

            {!query.trim() ? (
              <Link
                href="/workouts/combinations/new"
                className={cn(buttonVariants({ size: "sm" }), "mt-4")}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Create combination
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCombinations.map((combination) => {
              const combinationExercises = combination.exerciseIds
                .map((id) => exerciseMap.get(id))
                .filter(Boolean) as ExerciseDefinition[];

              const visibleExercises = combinationExercises.slice(0, 4);
              const remainingCount =
                combinationExercises.length - visibleExercises.length;

              const isActive = combination.active !== false;

              return (
                <Link
                  key={combination.id}
                  href={`/workouts/combinations/${combination.id}`}
                  className={cn(
                    "bg-card group block rounded-2xl border p-4 transition-all",
                    "hover:bg-accent/50 hover:border-primary/20",
                    !isActive && "opacity-65",
                  )}
                >
                  {/* Top row */}
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                      <Dumbbell className="h-4.5 w-4.5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate text-sm font-semibold">
                              {combination.name}
                            </h3>

                            {!isActive ? (
                              <span className="bg-muted text-muted-foreground shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase">
                                Inactive
                              </span>
                            ) : null}
                          </div>

                          <p className="text-muted-foreground mt-0.5 text-[11px]">
                            {combinationExercises.length} exercise
                            {combinationExercises.length === 1 ? "" : "s"}
                          </p>
                        </div>

                        <ChevronRight className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {combination.description ? (
                    <p className="text-muted-foreground mt-3 line-clamp-2 text-xs leading-relaxed">
                      {combination.description}
                    </p>
                  ) : null}

                  {/* Exercises */}
                  {visibleExercises.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {visibleExercises.map((exercise) => (
                        <span
                          key={exercise.id}
                          className="bg-muted/70 text-muted-foreground rounded-md px-2 py-1 text-[10px] font-medium"
                        >
                          {exercise.name}
                        </span>
                      ))}

                      {remainingCount > 0 ? (
                        <span className="bg-muted/70 text-muted-foreground rounded-md px-2 py-1 text-[10px] font-medium">
                          +{remainingCount} more
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-muted-foreground mt-3 text-xs">
                      No exercises assigned
                    </p>
                  )}

                  {/* Metadata */}
                  {combination.coachingNotes || combination.warmupGuidance ? (
                    <div className="text-muted-foreground mt-3 flex items-center gap-3 text-[10px]">
                      {combination.warmupGuidance ? (
                        <span>Warm-up guidance</span>
                      ) : null}

                      {combination.coachingNotes ? (
                        <span>Coaching notes</span>
                      ) : null}
                    </div>
                  ) : null}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
