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

  return (
    <MetricCard
      metric={metric}
      score={matched?.score}
      progress={matched ? (matched.score / metric.weight) * 100 : 0}
      subtitle={
        matched
          ? `${matched.score}/${metric.weight} points`
          : "No matching range"
      }
    >
      <div className="space-y-4">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />

        {metric.scoring.ranges && (
          <div className="space-y-2">
            {metric.scoring.ranges.map((range, index) => {
              const active = value >= range.min && value <= range.max;

              return (
                <div
                  key={index}
                  className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
                    active ? "border-primary bg-primary/10" : ""
                  }`}
                >
                  <span>
                    {range.min} - {range.max}
                    {metric.unit && ` ${metric.unit}`}
                  </span>

                  <span className="font-medium">{range.score} pts</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MetricCard>
  );
}
