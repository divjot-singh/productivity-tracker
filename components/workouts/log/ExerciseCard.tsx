"use client";

import { Info, MoreVertical, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getPrimaryMetricLabel } from "@/lib/workouts/constants";
import {
  detectSetRecords,
  formatSetLine,
  weightStep,
  type EditorExercise,
  type LastSession,
  type Records,
} from "@/lib/workouts/session";
import type { ExerciseDefinition, WorkoutSetEntry } from "@/models/workout";

import SetRow from "./SetRow";

interface ExerciseCardProps {
  entry: EditorExercise;
  definition: ExerciseDefinition | undefined;
  last: LastSession | null;
  records: Records;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onInfo: () => void;
  onSetChange: (setIndex: number, partial: Partial<WorkoutSetEntry>) => void;
  onToggleDone: (setIndex: number) => void;
  onRemoveSet: (setIndex: number) => void;
  onAddSet: () => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}

// One exercise on screen; the details (notes, records, history) live behind the info button.
export default function ExerciseCard({
  entry,
  definition,
  last,
  records,
  canMoveUp,
  canMoveDown,
  onInfo,
  onSetChange,
  onToggleDone,
  onRemoveSet,
  onAddSet,
  onMove,
  onRemove,
}: ExerciseCardProps) {
  const unit = definition?.weightTracking.unit ?? "kg";
  const weightLabel = getPrimaryMetricLabel(definition?.measurementMode);
  const step = weightStep(unit);
  const doneCount = entry.sets.filter((set) => set.done).length;

  return (
    <article className="space-y-3">
      <div className="flex items-start gap-1">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg leading-tight font-semibold">
            {definition?.name ?? entry.exerciseId}
          </h2>

          <p className="text-muted-foreground mt-0.5 truncate text-xs">
            {last
              ? `Last ${last.date.slice(5)}: ${formatSetLine(last.sets) || "-"}`
              : "First time - no history yet"}
          </p>
        </div>

        <button
          type="button"
          aria-label="Exercise details"
          onClick={onInfo}
          className="text-muted-foreground active:bg-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        >
          <Info className="h-5 w-5" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label="Exercise options"
                className="text-muted-foreground active:bg-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              />
            }
          >
            <MoreVertical className="h-5 w-5" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem disabled={!canMoveUp} onClick={() => onMove(-1)}>
              Move earlier
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!canMoveDown} onClick={() => onMove(1)}>
              Move later
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onRemove}>
              Remove exercise
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2">
        {entry.sets.map((set, index) => (
          <SetRow
            key={set.key}
            index={index}
            set={set}
            weightStep={step}
            weightLabel={weightLabel}
            unit={unit}
            flags={detectSetRecords(
              set,
              records,
              entry.sets.slice(0, index).filter((s) => s.done),
            )}
            onChange={(partial) => onSetChange(index, partial)}
            onToggleDone={() => onToggleDone(index)}
            onRemove={() => onRemoveSet(index)}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onAddSet}
          className="text-primary active:bg-accent flex h-10 items-center gap-1 rounded-lg px-2 text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Add set
        </button>

        <span className="text-muted-foreground text-xs">
          {doneCount}/{entry.sets.length} done
        </span>
      </div>
    </article>
  );
}
