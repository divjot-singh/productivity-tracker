"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { MetricDefinition, ScoringDefinition } from "@/models/metric";
import ScoringExplanationInput from "./ScoringExplanationInput";

interface Props {
  goal: MetricDefinition;

  updateGoal: (partial: Partial<MetricDefinition>) => void;
}

export default function MultiplierConfig({ goal, updateGoal }: Props) {
  const scoring = goal.scoring as ScoringDefinition & {
    multiplier?: number;
    maxScore?: number;
  };

  function updateScoring(partial: Partial<typeof scoring>) {
    updateGoal({
      scoring: {
        ...scoring,
        ...partial,
      },
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Multiplier Configuration</h3>

        <p className="text-muted-foreground mt-1 text-sm">
          Every unit contributes using a multiplier.
        </p>
      </div>

      <ScoringExplanationInput goal={goal} updateGoal={updateGoal} />

      <div className="space-y-2">
        <Label>Multiplier</Label>

        <Input
          type="number"
          step="0.0001"
          placeholder="0.001"
          value={scoring.multiplier ?? ""}
          onChange={(e) =>
            updateScoring({
              multiplier: Number(e.target.value),
            })
          }
        />

        <p className="text-muted-foreground text-sm">
          Example: 10,000 × 0.001 = 10 points
        </p>
      </div>

      <div className="space-y-2">
        <Label>Maximum Score (Optional)</Label>

        <Input
          type="number"
          placeholder="Leave empty for unlimited"
          value={scoring.maxScore ?? ""}
          onChange={(e) =>
            updateScoring({
              maxScore:
                e.target.value === "" ? undefined : Number(e.target.value),
            })
          }
        />

        <p className="text-muted-foreground text-sm">
          Prevents this metric from contributing more than a fixed score.
        </p>
      </div>
    </div>
  );
}
