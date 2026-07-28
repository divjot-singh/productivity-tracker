"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { MetricDefinition, RangeScore } from "@/models/metric";

interface Props {
  goal: MetricDefinition;

  updateGoal: (partial: Partial<MetricDefinition>) => void;
}

export default function RangeConfig({ goal, updateGoal }: Props) {
  const ranges = goal.scoring.ranges ?? [];

  function updateRanges(next: RangeScore[]) {
    updateGoal({
      scoring: {
        ...goal.scoring,
        ranges: next,
      },
    });
  }

  function updateRange(index: number, partial: Partial<RangeScore>) {
    const next = [...ranges];

    next[index] = {
      ...next[index],
      ...partial,
    };

    updateRanges(next);
  }

  function addRange() {
    updateRanges([
      ...ranges,
      {
        min: 0,
        max: 0,
        score: 0,
      },
    ]);
  }

  function removeRange(index: number) {
    updateRanges(ranges.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Range Configuration</h3>

        <p className="text-muted-foreground mt-1 text-sm">
          Configure score ranges for this goal.
        </p>
      </div>

      <div className="space-y-4">
        {ranges.map((range, index) => (
          <div key={index} className="space-y-4 rounded-xl border p-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Min</Label>

                <Input
                  type="number"
                  value={range.min}
                  onChange={(e) =>
                    updateRange(index, {
                      min: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Max</Label>

                <Input
                  type="number"
                  value={range.max}
                  onChange={(e) =>
                    updateRange(index, {
                      max: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Score</Label>

                <Input
                  type="number"
                  value={range.score}
                  onChange={(e) =>
                    updateRange(index, {
                      score: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => removeRange(index)}
            >
              Remove
            </Button>
          </div>
        ))}

        <Button variant="outline" className="w-full" onClick={addRange}>
          Add Range
        </Button>
      </div>
    </div>
  );
}
