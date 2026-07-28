"use client";

import { MetricDefinition, MetricType, ScoringType } from "@/models/metric";

interface ScoringOption {
  type: ScoringType;
  title: string;
  description: string;
}

const SCORING_OPTIONS: Record<MetricType, ScoringOption[]> = {
  number: [
    {
      type: "goal",
      title: "Goal",
      description:
        "Earn points as you progress towards your goal. Reaching it gives full points and exceeding it earns bonus points.",
    },
    {
      type: "range",
      title: "Range",
      description:
        "Assign different scores for different value ranges. Best for metrics like sleep.",
    },
    {
      type: "multiplier",
      title: "Multiplier",
      description:
        "Score increases proportionally with the value entered. Best for water intake or supplements.",
    },
    {
      type: "options",
      title: "Options",
      description: "Choose from predefined options, each with its own score.",
    },
  ],

  boolean: [
    {
      type: "boolean",
      title: "Boolean",
      description: "Simple Yes / No tracking.",
    },
  ],

  time: [
    {
      type: "goal",
      title: "Goal",
      description: "Earn points based on how close you are to a target time.",
    },
    {
      type: "time-range",
      title: "Time Range",
      description: "Assign different scores for different time ranges.",
    },
    {
      type: "options",
      title: "Options",
      description:
        "Choose from predefined time options, each with its own score.",
    },
  ],
};

interface Props {
  goal: MetricDefinition;

  updateScoring: (type: ScoringType) => void;
}

export default function ScoringTypeStep({ goal, updateScoring }: Props) {
  const options = SCORING_OPTIONS[goal.type];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Scoring Method</h2>

        <p className="text-muted-foreground mt-1 text-sm">
          Decide how this goal contributes towards your Life Score.
        </p>
      </div>

      <div className="grid gap-3">
        {options.map((option) => {
          const selected = goal.scoring.type === option.type;

          return (
            <button
              key={option.type}
              type="button"
              onClick={() => updateScoring(option.type)}
              className={`rounded-[10px] border p-4 text-left transition-all ${
                selected
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-accent"
              }`}
            >
              <p className="font-medium">{option.title}</p>

              <p className="text-muted-foreground mt-1 text-sm">
                {option.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
