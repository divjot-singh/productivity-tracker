"use client";

import { cn } from "@/lib/utils";
import type {
  MetricDefinition,
  MetricType,
  ScoringType,
} from "@/models/metric";

import BooleanConfig from "../configs/BooleanConfig";
import MultiplierConfig from "../configs/MultiplierConfig";
import OptionsConfig from "../configs/OptionConfig";
import RangeConfig from "../configs/RangeConfig";
import TargetConfig from "../configs/TargetConfig";
import TimeRangeConfig from "../configs/TimeRangeConfig";

const SCORING_OPTIONS: Record<
  MetricType,
  { type: ScoringType; title: string; description: string }[]
> = {
  number: [
    {
      type: "goal",
      title: "Reach a target",
      description: "Full points at the target, bonus points beyond it.",
    },
    {
      type: "range",
      title: "Value ranges",
      description: "Different scores for different ranges, like sleep hours.",
    },
    {
      type: "multiplier",
      title: "Per unit",
      description: "Points grow with the value, like water or supplements.",
    },
    {
      type: "options",
      title: "Choose from options",
      description: "Each option has its own score.",
    },
  ],
  boolean: [],
  time: [
    {
      type: "goal",
      title: "Reach a time",
      description: "Points based on how close you are to a target time.",
    },
    {
      type: "time-range",
      title: "Time ranges",
      description: "Different scores for different times of day.",
    },
    {
      type: "options",
      title: "Choose from options",
      description: "Each time option has its own score.",
    },
  ],
};

interface Props {
  goal: MetricDefinition;
  updateGoal: (partial: Partial<MetricDefinition>) => void;
  updateScoring: (type: ScoringType) => void;
}

export default function ScoringStep({
  goal,
  updateGoal,
  updateScoring,
}: Props) {
  const options = SCORING_OPTIONS[goal.type];

  return (
    <div className="space-y-6">
      {options.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-medium">How should it be scored?</p>

          <div className="space-y-3">
            {options.map((option) => (
              <button
                key={option.type}
                type="button"
                aria-pressed={goal.scoring.type === option.type}
                onClick={() => updateScoring(option.type)}
                className={cn(
                  "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                  goal.scoring.type === option.type
                    ? "border-primary bg-primary/10"
                    : "active:bg-accent",
                )}
              >
                <p className="text-sm font-medium">{option.title}</p>
                <p className="text-muted-foreground text-xs">
                  {option.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

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
