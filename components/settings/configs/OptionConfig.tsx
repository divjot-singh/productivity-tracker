"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { MetricDefinition, OptionScore } from "@/models/metric";
import ScoringExplanationInput from "./ScoringExplanationInput";

interface Props {
  goal: MetricDefinition;

  updateGoal: (partial: Partial<MetricDefinition>) => void;
}

export default function OptionsConfig({ goal, updateGoal }: Props) {
  const options = goal.scoring.options ?? [];

  function updateOptions(next: OptionScore[]) {
    updateGoal({
      scoring: {
        ...goal.scoring,
        options: next,
      },
    });
  }

  function updateOption(index: number, partial: Partial<OptionScore>) {
    const next = [...options];

    next[index] = {
      ...next[index],
      ...partial,
    };

    updateOptions(next);
  }

  function addOption() {
    updateOptions([
      ...options,
      {
        label: "",
        value: "",
        multiplier: 1,
      },
    ]);
  }

  function removeOption(index: number) {
    updateOptions(options.filter((_, i) => i !== index));
  }

  const inputType = goal.type === "number" ? "number" : "text";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Options Configuration</h3>

        <p className="text-muted-foreground mt-1 text-sm">
          Configure the selectable options and their score multipliers.
        </p>
      </div>

      <ScoringExplanationInput goal={goal} updateGoal={updateGoal} />

      <div className="space-y-4">
        {options.map((option, index) => (
          <div key={index} className="space-y-4 rounded-xl border p-4">
            <div className="space-y-2">
              <Label>Display Label</Label>

              <Input
                placeholder="Completed today's goal"
                value={option.label}
                onChange={(e) =>
                  updateOption(index, {
                    label: e.target.value,
                  })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Stored Value</Label>

                <Input
                  type={inputType}
                  placeholder="completed"
                  value={String(option.value)}
                  onChange={(e) =>
                    updateOption(index, {
                      value:
                        goal.type === "number"
                          ? Number(e.target.value)
                          : e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Score Multiplier</Label>

                <Input
                  type="number"
                  min={0}
                  step={0.05}
                  value={option.multiplier}
                  onChange={(e) =>
                    updateOption(index, {
                      multiplier: Number(e.target.value),
                    })
                  }
                />

                <p className="text-muted-foreground text-xs">
                  {(option.multiplier * goal.weight).toFixed(1)} / {goal.weight}{" "}
                  points
                </p>
              </div>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => removeOption(index)}
            >
              Remove Option
            </Button>
          </div>
        ))}

        <Button variant="outline" className="w-full" onClick={addOption}>
          Add Option
        </Button>
      </div>
    </div>
  );
}
