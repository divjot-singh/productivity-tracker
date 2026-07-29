"use client";

import MetricCard from "../MetricCard";

import { MetricDefinition } from "@/models/metric";

interface Props {
  metric: MetricDefinition;
  value: boolean;
  onChange: (value: boolean) => void;
}

export default function BooleanInput({ metric, value, onChange }: Props) {
  const progress = value == metric.target ? 100 : 0;
  const score = value == metric.target ? metric.weight : 0;
  return (
    <MetricCard
      metric={metric}
      score={score}
      progress={progress}
      subtitle="Choose whether you completed this today."
    >
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`rounded-xl border p-4 transition-all ${
            value
              ? "border-primary bg-primary/10"
              : "border-border hover:bg-accent"
          }`}
        >
          <div className="text-center">
            <p className="text-2xl">✅</p>

            <p className="mt-2 font-medium">Yes</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onChange(false)}
          className={`rounded-xl border p-4 transition-all ${
            !value
              ? "border-primary bg-primary/10"
              : "border-border hover:bg-accent"
          }`}
        >
          <div className="text-center">
            <p className="text-2xl">❌</p>

            <p className="mt-2 font-medium">No</p>
          </div>
        </button>
      </div>
    </MetricCard>
  );
}
