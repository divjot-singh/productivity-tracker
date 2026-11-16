"use client";

import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { filterExercises } from "@/lib/workouts/exercise-filters";
import type { ExerciseDefinition } from "@/models/workout";

interface AddExerciseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercises: ExerciseDefinition[];
  onPick: (exerciseId: string) => void;
}

export default function AddExerciseSheet({
  open,
  onOpenChange,
  exercises,
  onPick,
}: AddExerciseSheetProps) {
  const [query, setQuery] = useState("");

  const results = useMemo(
    () =>
      filterExercises(exercises, {
        query,
        category: "",
        muscleGroup: "",
        equipment: "",
      }),
    [exercises, query],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-popover max-h-[80dvh] rounded-t-2xl p-0 pb-[env(safe-area-inset-bottom)]"
      >
        <SheetHeader className="px-5 pt-5 pb-2">
          <SheetTitle>Add exercise</SheetTitle>
        </SheetHeader>

        <div className="px-5 pb-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search exercises"
            className="h-11"
          />
        </div>

        <div className="space-y-1 overflow-y-auto px-3 pb-5">
          {results.length === 0 ? (
            <p className="text-muted-foreground px-2 py-6 text-center text-sm">
              No exercises found.
            </p>
          ) : (
            results.map((exercise) => (
              <button
                key={exercise.id}
                type="button"
                onClick={() => {
                  onPick(exercise.id);
                  setQuery("");
                  onOpenChange(false);
                }}
                className="active:bg-accent flex w-full flex-col rounded-xl px-3 py-2.5 text-left"
              >
                <span className="text-sm font-medium">{exercise.name}</span>
                <span className="text-muted-foreground text-xs">
                  {exercise.categories.join(" - ")}
                </span>
              </button>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
