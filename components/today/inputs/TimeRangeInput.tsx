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

  const bestRange = [...ranges].sort((a, b) => b.score - a.score)[0];
  const score = matchedRange?.score ?? 0;

  const progress =
    metric.weight > 0 ? Math.min((score / metric.weight) * 100, 100) : 0;

  return (
    <MetricCard
      metric={metric}
      score={score}
      progress={progress}
      subtitle={
        bestRange
          ? `Best score between ${bestRange.from} - ${bestRange.to}`
          : undefined
      }
    >
      <div className="space-y-4">
        <Input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 text-lg"
        />

        {bestRange && (
          <div className="bg-muted/50 rounded-xl border p-3">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              Recommended
            </p>

            <p className="mt-1 flex items-center gap-2 font-medium">
              <Clock3 className="h-4 w-4" />
              {bestRange.from} – {bestRange.to}
            </p>
          </div>
        )}
      </div>
    </MetricCard>
  );
}
