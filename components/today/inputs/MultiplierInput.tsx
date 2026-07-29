"use client";

import { Input } from "@/components/ui/input";

import MetricCard from "../MetricCard";

import { MetricDefinition } from "@/models/metric";

interface Props {
  metric: MetricDefinition;
  value: number;
  onChange: (value: number) => void;
}

export default function MultiplierInput({ metric, value, onChange }: Props) {
  const multiplier = metric.scoring.multiplier ?? 1;

  const maxScore = metric.scoring.maxScore;

  const preview = !!maxScore
    ? Math.min(Math.round(value * multiplier), maxScore)
    : Math.round(value * multiplier);

  const progress = (preview / metric.weight) * 100;
  const bonus = metric.weight < preview ? preview - metric.weight : undefined;

  return (
    <MetricCard
      metric={metric}
      score={preview}
      bonus={bonus}
      progress={progress}

      subtitle={`Every ${metric.unit || "unit"} is worth ×${multiplier}`}
    >
      <div className="space-y-4">
        <Input
          type="number"
          value={value}
          min={0}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-12 text-lg"
        />

        <div className="bg-muted/50 rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">
              Estimated Score
            </span>

            <span className="text-xl font-bold">{preview} pts</span>
          </div>

          <p className="text-muted-foreground mt-2 text-xs">
            {value} × {multiplier} = {preview}{" "}
            {!!metric.scoring.maxScore && preview == metric.scoring.maxScore
              ? "(max)"
              : ""}
          </p>
        </div>
      </div>
    </MetricCard>
  );
}
