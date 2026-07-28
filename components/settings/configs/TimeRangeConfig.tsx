"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { MetricDefinition, TimeRangeScore } from "@/models/metric";

interface Props {
  goal: MetricDefinition;

  updateGoal: (partial: Partial<MetricDefinition>) => void;
}

export default function TimeRangeConfig({ goal, updateGoal }: Props) {
  const ranges = goal.scoring.time ?? [];

  function updateRanges(next: TimeRangeScore[]) {
    updateGoal({
      scoring: {
        ...goal.scoring,
        time: next,
      },
    });
  }

  function updateRange(index: number, partial: Partial<TimeRangeScore>) {
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
        from: "08:00",
        to: "08:30",
        score: 10,
      },
    ]);
  }

  function removeRange(index: number) {
    updateRanges(ranges.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Time Range Configuration</h3>

        <p className="text-muted-foreground mt-1 text-sm">
          Configure scores for different time intervals.
        </p>
      </div>

      <div className="space-y-4">
        {ranges.map((range, index) => (
          <div key={index} className="space-y-4 rounded-xl border p-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>From</Label>

                <Input
                  type="time"
                  value={range.from}
                  onChange={(e) =>
                    updateRange(index, {
                      from: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>To</Label>

                <Input
                  type="time"
                  value={range.to}
                  onChange={(e) =>
                    updateRange(index, {
                      to: e.target.value,
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
          Add Time Range
        </Button>
      </div>
    </div>
  );
}
