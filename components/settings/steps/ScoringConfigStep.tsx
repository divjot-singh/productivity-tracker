"use client";

import { MetricDefinition } from "@/models/metric";

import BooleanConfig from "../configs/BooleanConfig";
import MultiplierConfig from "../configs/MultiplierConfig";
import RangeConfig from "../configs/RangeConfig";
import TargetConfig from "../configs/TargetConfig";
import TimeRangeConfig from "../configs/TimeRangeConfig";
import OptionsConfig from "../configs/OptionConfig";

interface Props {
  goal: MetricDefinition;

  updateGoal: (partial: Partial<MetricDefinition>) => void;
}

export default function ScoringConfigStep({ goal, updateGoal }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Configure Scoring</h2>

        <p className="text-muted-foreground mt-1 text-sm">
          Configure how this goal should be evaluated.
        </p>
      </div>

      {goal.scoring.type === "boolean" && (
        <BooleanConfig goal={goal} updateGoal={updateGoal} />
      )}

      {goal.scoring.type === "goal" && (
        <TargetConfig goal={goal} updateGoal={updateGoal} />
      )}

      {goal.scoring.type === "range" && (
        <RangeConfig goal={goal} updateGoal={updateGoal} />
      )}

      {goal.scoring.type === "options" && (
        <OptionsConfig goal={goal} updateGoal={updateGoal} />
      )}

      {goal.scoring.type === "multiplier" && (
        <MultiplierConfig goal={goal} updateGoal={updateGoal} />
      )}

      {goal.scoring.type === "time-range" && (
        <TimeRangeConfig goal={goal} updateGoal={updateGoal} />
      )}
    </div>
  );
}
