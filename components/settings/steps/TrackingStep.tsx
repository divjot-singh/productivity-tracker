"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { WeightPicker, YesNo } from "../GoalFields";
import type { MetricDefinition, MetricType } from "@/models/metric";

const TYPES: { value: MetricType; title: string; description: string }[] = [
  {
    value: "number",
    title: "Number",
    description: "A quantity, like steps, water, sleep or calories.",
  },
  {
    value: "boolean",
    title: "Yes / No",
    description: "A habit you either did or didn't.",
  },
  {
    value: "time",
    title: "Time",
    description: "A time of day, like waking up or going to bed.",
  },
];

interface Props {
  goal: MetricDefinition;
  updateMetricType: (type: MetricType) => void;
  updateGoal: (partial: Partial<MetricDefinition>) => void;
}

export default function TrackingStep({
  goal,
  updateMetricType,
  updateGoal,
}: Props) {
  function changeType(type: MetricType) {
    updateMetricType(type);

    if (type === "number") {
      updateGoal({ unit: "", defaultValue: 0, target: 0 });
    } else if (type === "boolean") {
      updateGoal({ unit: undefined, defaultValue: false, target: false });
    } else {
      updateGoal({ unit: undefined, defaultValue: "", target: "" });
    }
  }

  function valueInput(field: "defaultValue" | "target", label: string) {
    const value = goal[field];

    if (goal.type === "boolean") {
      return (
        <YesNo
          label={label}
          value={value === true}
          onChange={(next) => updateGoal({ [field]: next })}
        />
      );
    }

    return (
      <Input
        className="h-11"
        aria-label={label}
        type={goal.type === "time" ? "time" : "number"}
        inputMode={goal.type === "number" ? "decimal" : undefined}
        value={String(value ?? "")}
        onChange={(event) =>
          updateGoal({
            [field]:
              goal.type === "number"
                ? Number(event.target.value)
                : event.target.value,
          })
        }
      />
    );
  }

  const description = TYPES.find(
    (item) => item.value === goal.type,
  )?.description;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-medium">How do you track it?</p>

        <div className="grid grid-cols-3 gap-2">
          {TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              aria-pressed={goal.type === type.value}
              onClick={() => changeType(type.value)}
              className={cn(
                "h-11 rounded-xl border text-sm font-medium",
                goal.type === type.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "active:bg-accent",
              )}
            >
              {type.title}
            </button>
          ))}
        </div>

        <p className="text-muted-foreground text-xs">{description}</p>
      </div>

      {goal.type === "number" ? (
        <div className="space-y-2">
          <label htmlFor="goal-unit" className="text-sm font-medium">
            Unit
          </label>

          <Input
            id="goal-unit"
            className="h-11"
            placeholder="e.g. steps, hours, glasses"
            value={goal.unit ?? ""}
            onChange={(event) => updateGoal({ unit: event.target.value })}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <p className="text-sm font-medium">Target</p>
          {valueInput("target", "Target")}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Starts at</p>
          {valueInput("defaultValue", "Default value")}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">How important is it?</p>

        <WeightPicker
          value={goal.weight}
          onChange={(weight) => updateGoal({ weight })}
        />
      </div>
    </div>
  );
}
