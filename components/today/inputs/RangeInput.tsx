"use client";

import { MetricDefinition } from "@/models/metric";

import MetricCard from "../MetricCard";
import { Input } from "@/components/ui/input";

interface Props {
  metric: MetricDefinition;
  value: number;
  onChange: (value: number) => void;
}

export default function RangeInput({ metric, value, onChange }: Props) {
  const matched = metric.scoring.ranges?.find(
    (range) => value >= range.min && value <= range.max,
  );

  const score = matched ? matched.multiplier * metric.weight : 0;

  return (
    <MetricCard
      metric={metric}
      score={score}
      progress={(score / metric.weight) * 100}
      subtitle={
        matched ? `${score.toFixed(1)} / ${metric.weight} pts` : "Enter a value"
      }
    >
      <div className="space-y-4">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />

        {matched && (
          <div className="bg-muted/50 rounded-xl border p-4">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              Current Score
            </p>

            <div className="mt-2 flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {matched.min}
                  {matched.max !== undefined && ` - ${matched.max}`}
                  {metric.unit && ` ${metric.unit}`}
                </p>

                <p className="text-muted-foreground text-sm">Matching range</p>
              </div>

              <div className="text-right">
                <p className="text-primary text-xl font-bold">
                  {score.toFixed(1)}
                </p>

                <p className="text-muted-foreground text-sm">
                  / {metric.weight} pts
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </MetricCard>
  );
}
