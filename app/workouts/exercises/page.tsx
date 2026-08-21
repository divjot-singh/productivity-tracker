"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { apiRequest } from "@/lib/api/client";
import { ExerciseDefinition } from "@/models/workout";
import { cn } from "@/lib/utils";

export default function WorkoutExercisesPage() {
  const { user } = useRequireAuth();

  const [exercises, setExercises] = useState<ExerciseDefinition[]>([]);
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

  return (
    <div className="space-y-6 pb-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Exercises</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your exercise library.
        </p>
      </div>

      <div>
        <Link
          href="/workouts/exercises/new"
          className={cn(buttonVariants({ size: "sm" }), "w-full sm:w-auto")}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add Exercise
        </Link>
      </div>

      {loading ? (
        <div className="text-muted-foreground p-6 text-sm">
          Loading exercises...
        </div>
      ) : exercises.length === 0 ? (
        <div className="bg-card rounded-2xl border p-8 text-center">
          <p className="text-muted-foreground text-sm">No exercises yet.</p>
        </div>
      ) : (
        <div className="bg-card overflow-hidden rounded-2xl border">
          {exercises.map((exercise) => (
            <Link
              key={exercise.id}
              href={`/workouts/exercises/${encodeURIComponent(exercise.id)}`}
              className="hover:bg-accent flex items-center justify-between gap-3 border-b px-4 py-3 transition-colors last:border-b-0"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{exercise.name}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {exercise.categories.join(", ") || "No categories"}
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
