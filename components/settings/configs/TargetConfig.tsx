"use client";

import { MetricDefinition } from "@/models/metric";
import ScoringExplanationInput from "./ScoringExplanationInput";

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

      <ScoringExplanationInput goal={goal} updateGoal={updateGoal} />
    </div>
  );
}
