"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CombinationSuggestions } from "@/lib/workouts/session";
import type { WorkoutCombination } from "@/models/workout";

interface CombinationPanelProps {
  combinations: WorkoutCombination[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  nameOf: (exerciseId: string) => string;
  diff: {
    added: string[];
    removed: string[];
    reordered: boolean;
    changed: boolean;
  } | null;
  suggestions: CombinationSuggestions | null;
  busy: boolean;
  onUpdate: () => void;
  onSaveAsNew: (name: string) => void;
  onApplySuggestion: (kind: "add" | "remove", exerciseId: string) => void;
}

export default function CombinationPanel({
  combinations,
  selectedId,
  onSelect,
  nameOf,
  diff,
  suggestions,
  busy,
  onUpdate,
  onSaveAsNew,
  onApplySuggestion,
}: CombinationPanelProps) {
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");

  const hasSuggestions =
    suggestions &&
    (suggestions.add.length > 0 || suggestions.remove.length > 0);

  return (
    <div className="space-y-2">
      <div className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1">
        {combinations.map((combination) => (
          <button
            key={combination.id}
            type="button"
            aria-pressed={combination.id === selectedId}
            onClick={() =>
              onSelect(combination.id === selectedId ? null : combination.id)
            }
            className={cn(
              "h-9 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors",
              combination.id === selectedId
                ? "bg-primary text-primary-foreground border-transparent"
                : "bg-card active:bg-accent",
            )}
          >
            {combination.name}
          </button>
        ))}
      </div>

      {diff?.changed ? (
        <div className="bg-card space-y-2 rounded-2xl border p-3">
          <p className="text-sm">
            Different from this combination:{" "}
            <span className="text-muted-foreground">
              {[
                ...diff.added.map((id) => `+ ${nameOf(id)}`),
                ...diff.removed.map((id) => `- ${nameOf(id)}`),
                diff.reordered ? "order changed" : "",
              ]
                .filter(Boolean)
                .join(", ")}
            </span>
          </p>

          <div className="flex gap-2">
            <Button size="sm" disabled={busy} onClick={onUpdate}>
              Update combination
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => setNaming(true)}
            >
              Save as new
            </Button>
          </div>
        </div>
      ) : null}

      {hasSuggestions ? (
        <div className="bg-card space-y-2 rounded-2xl border p-3">
          <p className="text-sm font-medium">
            Based on your last {suggestions.sessions} sessions
          </p>

          {suggestions.add.map((item) => (
            <div
              key={`a-${item.exerciseId}`}
              className="flex items-center justify-between gap-2"
            >
              <span className="text-sm">
                Add {nameOf(item.exerciseId)}{" "}
                <span className="text-muted-foreground text-xs">
                  (in {item.count} of {suggestions.sessions})
                </span>
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => onApplySuggestion("add", item.exerciseId)}
              >
                Apply
              </Button>
            </div>
          ))}

          {suggestions.remove.map((item) => (
            <div
              key={`r-${item.exerciseId}`}
              className="flex items-center justify-between gap-2"
            >
              <span className="text-sm">
                Remove {nameOf(item.exerciseId)}{" "}
                <span className="text-muted-foreground text-xs">
                  (in {item.count} of {suggestions.sessions})
                </span>
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => onApplySuggestion("remove", item.exerciseId)}
              >
                Apply
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      <Dialog open={naming} onOpenChange={setNaming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as new combination</DialogTitle>
          </DialogHeader>

          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Push B"
            autoFocus
          />

          <DialogFooter>
            <Button
              disabled={!name.trim() || busy}
              onClick={() => {
                onSaveAsNew(name.trim());
                setName("");
                setNaming(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
