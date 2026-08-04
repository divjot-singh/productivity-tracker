"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MetricDefinition } from "@/models/metric";

interface Props {
  goal: MetricDefinition;
  updateGoal: (partial: Partial<MetricDefinition>) => void;
}

export default function ScoringExplanationInput({ goal, updateGoal }: Props) {
  return (
    <div className="space-y-2">
      <Label>Scoring Explanation</Label>

      <p className="text-muted-foreground text-xs">
        Shown to users when they tap the info icon on the Today page.
      </p>

      <Textarea
        value={goal.scoringExplanation ?? ""}
        onChange={(e) =>
          updateGoal({
            scoringExplanation:
              e.target.value === "" ? undefined : e.target.value,
          })
        }
        placeholder="e.g. Every 1,000 steps = 1 point"
        rows={2}
      />
    </div>
  );
}
