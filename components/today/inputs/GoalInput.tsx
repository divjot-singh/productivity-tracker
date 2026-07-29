"use client";

import { MetricDefinition } from "@/models/metric";

import { Input } from "@/components/ui/input";

import MetricCard from "../MetricCard";

interface Props {
  metric: MetricDefinition;
  value: number;
  onChange: (value: number) => void;
}

export default function GoalInput({ metric, value, onChange }: Props) {
  const target = Number(metric.target);

  const progress = target > 0 ? Math.min((value / target) * 100, 100) : 0;

  const baseScore =
    target > 0 ? Math.min(value / target, 1) * metric.weight : 0;

  const exceeded = Math.max(value - target, 0);

  const bonus = exceeded > 0 ? (metric.scoring.bonusRate ?? 0) : 0;

  const score = baseScore + bonus;

  const remaining = Math.max(target - value, 0);

  return (
    <MetricCard
      metric={metric}
      score={score}
      progress={progress}
      bonus={bonus}
      subtitle={
        exceeded > 0
          ? `+${exceeded} ${metric.unit ?? ""} above target`
          : `${remaining} ${metric.unit ?? ""} remaining`
      }
    >
      <div className="space-y-5">
        {/* Input */}

        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />

        {/* Progress */}

        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>

            <span className="font-medium">
              {value} / {target}
              {metric.unit && ` ${metric.unit}`}
            </span>
          </div>

          <div className="bg-muted h-3 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        {/* Stats */}

        <div className="grid grid-cols-3 gap-3">
          <Stat
            label="Target"
            value={`${target}${metric.unit ? ` ${metric.unit}` : ""}`}
          />

          <Stat
            label="Remaining"
            value={`${remaining}${metric.unit ? ` ${metric.unit}` : ""}`}
          />

          <Stat label="Bonus" value={bonus > 0 ? `+${bonus}` : "-"} />
        </div>
      </div>
    </MetricCard>
  );
}

interface StatProps {
  label: string;
  value: string;
}

function Stat({ label, value }: StatProps) {
  return (
    <div className="bg-muted/40 rounded-xl p-3 text-center">
      <p className="text-muted-foreground text-xs">{label}</p>

      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
