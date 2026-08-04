"use client";

import { Input } from "@/components/ui/input";

import MetricCard from "../MetricCard";

import { MetricDefinition, MetricValue } from "@/models/metric";

interface Props {
  metric: MetricDefinition;
  value: MetricValue | "";
  onChange: (value: MetricValue | "") => void;
}

export default function MultiplierInput({ metric, value, onChange }: Props) {
  const numericValue = value === "" ? 0 : Number(value);
  const multiplier = metric.scoring.multiplier ?? 1;

  const maxScore = metric.scoring.maxScore;

  const preview = !!maxScore
    ? Math.min(Math.round(numericValue * multiplier), maxScore)
    : Math.round(numericValue * multiplier);

  const progress = (preview / metric.weight) * 100;
  const bonus = metric.weight < preview ? preview - metric.weight : undefined;

  return (
    <MetricCard
      metric={metric}
      score={preview}
      bonus={bonus}
      progress={progress}
    >
      <div className="space-y-3">
        <Input
          type="number"
          inputMode="decimal"
          placeholder="0"
          value={value === "" ? "" : Number(value)}
          min={0}
          onChange={(e) =>
            onChange(e.target.value === "" ? "" : Number(e.target.value))
          }
          className="h-12 text-lg"
        />

        <div className="bg-muted/50 rounded-xl border p-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">
              Estimated Score
            </span>

            <span className="text-lg font-bold">{preview} pts</span>
          </div>

          <p className="text-muted-foreground mt-1 text-xs">
            {numericValue} × {multiplier} = {preview}{" "}
            {!!metric.scoring.maxScore && preview == metric.scoring.maxScore
              ? "(max)"
              : ""}
          </p>
        </div>
      </div>
    </MetricCard>
  );
}
