"use client";

import { Clock3 } from "lucide-react";

import { Input } from "@/components/ui/input";

import MetricCard from "../MetricCard";

import { MetricDefinition } from "@/models/metric";

interface Props {
  metric: MetricDefinition;
  value: string;
  onChange: (value: string) => void;
}

export default function TimeRangeInput({ metric, value, onChange }: Props) {
  const ranges = metric.scoring.time ?? [];
  const matchedRange = ranges.find((range) => {
    const current = value.split(":").map(Number);
    const currentMinutes = current[0] * 60 + current[1];

    const from = range.from.split(":").map(Number);
    const fromMinutes = from[0] * 60 + from[1];

    const to = range.to.split(":").map(Number);
    const toMinutes = to[0] * 60 + to[1];

    if (fromMinutes <= toMinutes) {
      return currentMinutes >= fromMinutes && currentMinutes <= toMinutes;
    }

    // handles ranges crossing midnight
    return currentMinutes >= fromMinutes || currentMinutes <= toMinutes;
  });
  const score = matchedRange ? matchedRange.multiplier * metric.weight : 0;
  const progress =
    metric.weight > 0 ? Math.min(matchedRange?.multiplier ?? 0, 1) * 100 : 0;
  const bestRange = ranges.reduce(
    (best, current) =>
      !best || current.multiplier > best.multiplier ? current : best,
    undefined as (typeof ranges)[number] | undefined,
  );

  return (
    <MetricCard
      metric={metric}
      score={score}
      progress={progress}
      subtitle={metric.scoringExplanation}
    >
      <div className="space-y-2">
        <Input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 text-lg"
        />

        {bestRange && (
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Clock3 className="h-3.5 w-3.5" />
            Best: {bestRange.from} – {bestRange.to}
          </p>
        )}
      </div>
    </MetricCard>
  );
}
