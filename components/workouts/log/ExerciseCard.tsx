"use client";

import { useState } from "react";
import { ChevronDown, Info, MoreVertical, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getPrimaryMetricLabel } from "@/lib/workouts/constants";
import {
  EFFORT_GUIDE,
  detectSetRecords,
  formatSetLine,
  weightStep,
  type EditorExercise,
  type Effort,
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
  onEffort: (effort: Effort) => void;
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
  onEffort,
  onMove,
  onRemove,
}: ExerciseCardProps) {
  const [effortOpen, setEffortOpen] = useState(false);

  const unit = definition?.weightTracking.unit ?? "kg";
  const weightLabel = getPrimaryMetricLabel(definition?.measurementMode);
  const step = weightStep(unit);
  const doneCount = entry.sets.filter((set) => set.done).length;
  const effort = entry.sets.find((set) => set.effort)?.effort ?? 3;
  const effortLabel = EFFORT_GUIDE.find((item) => item.effort === effort);

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

        <button
          type="button"
          aria-expanded={effortOpen}
          onClick={() => setEffortOpen((open) => !open)}
          className="text-muted-foreground flex h-10 items-center gap-1 rounded-lg px-2 text-xs"
        >
          Effort: {effortLabel?.label}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              effortOpen && "rotate-180",
            )}
          />
        </button>
      </div>

      {effortOpen ? (
        <div className="space-y-1.5">
          <div className="grid grid-cols-5 gap-1.5">
            {EFFORT_GUIDE.map((item) => (
              <button
                key={item.effort}
                type="button"
                onClick={() => onEffort(item.effort)}
                aria-pressed={item.effort === effort}
                className={cn(
                  "h-10 rounded-lg border text-sm font-medium",
                  item.effort === effort
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "active:bg-accent",
                )}
              >
                {item.effort}
              </button>
            ))}
          </div>

          <p className="text-muted-foreground text-xs">
            {effortLabel?.label} - {effortLabel?.hint}. Applies to every set.
          </p>
        </div>
      ) : null}
    </article>
  );
}
