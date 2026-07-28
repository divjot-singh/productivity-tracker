"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { MetricDefinition } from "@/models/metric";

interface Props {
  goal: MetricDefinition;

  updateGoal: (partial: Partial<MetricDefinition>) => void;
}

export default function TargetConfig({ goal, updateGoal }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Target Configuration</h3>

        <p className="text-muted-foreground mt-1 text-sm">
          Configure how progress beyond the target is rewarded.
        </p>
      </div>

      {/* Target Summary */}

      <div className="bg-muted rounded-xl p-4">
        <p className="text-muted-foreground text-sm">Target</p>

        <p className="mt-1 text-lg font-semibold">
          {String(goal.target)}
          {goal.unit && ` ${goal.unit}`}
        </p>
      </div>

      {/* Bonus Rate */}

      <div className="space-y-2">
        <Label>Bonus Rate</Label>

        <p className="text-muted-foreground text-xs">
          Additional score earned for exceeding the target.
        </p>

        <Input
          type="number"
          step="0.0001"
          min="0"
          value={goal.scoring.bonusRate ?? 0}
          onChange={(e) =>
            updateGoal({
              scoring: {
                ...goal.scoring,
                bonusRate: Number(e.target.value),
              },
            })
          }
          placeholder="0.0002"
        />
      </div>
    </div>
  );
}
