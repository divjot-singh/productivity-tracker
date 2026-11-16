"use client";

import { ICONS } from "@/lib/metric-icons";
import { calculateScore } from "@/lib/scoring/scoring-engine";
import type { MetricDefinition, MetricValue } from "@/models/metric";

function pointsFor(goal: MetricDefinition, value: MetricValue): string {
  try {
    const result = calculateScore([goal], { [goal.id]: value });
    const score = result.metrics[0]?.score ?? 0;

    return `${Math.round(score * 10) / 10}`;
  } catch {
    return "-";
  }
}

function describe(value: MetricValue, goal: MetricDefinition): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === "" || value === undefined) return "not set";

  return `${value}${goal.unit ? ` ${goal.unit}` : ""}`;
}

// What the goal will look like and what it scores, updated as the form changes.
export default function GoalPreview({ goal }: { goal: MetricDefinition }) {
  const Icon = ICONS[goal.icon] ?? ICONS.goal;

  const samples: { label: string; value: MetricValue }[] =
    goal.type === "boolean"
      ? [
          { label: "Done", value: true },
          { label: "Not done", value: false },
        ]
      : [
          {
            label: `At target (${describe(goal.target, goal)})`,
            value: goal.target,
          },
          {
            label: `Untouched (${describe(goal.defaultValue, goal)})`,
            value: goal.defaultValue,
          },
        ];

  return (
    <div className="bg-card rounded-2xl border p-3">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
          <Icon className="text-primary h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {goal.label.trim() || "Your goal"}
          </p>
          <p className="text-muted-foreground text-xs">
            Worth up to {goal.weight} points a day
          </p>
        </div>
      </div>

      <div className="text-muted-foreground mt-2 space-y-0.5 border-t pt-2 text-xs">
        {samples.map((sample) => (
          <div key={sample.label} className="flex justify-between gap-3">
            <span>{sample.label}</span>
            <span className="text-foreground font-medium">
              {pointsFor(goal, sample.value)} pts
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
