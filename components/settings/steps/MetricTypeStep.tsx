"use client";

import { MetricDefinition, MetricType } from "@/models/metric";

import { Input } from "@/components/ui/input";

import ChevronDownIcon from "@/SVGs/ChevronDownIcon";
import { Label } from "@/components/ui/label";

const METRIC_TYPES: {
  value: MetricType;
  title: string;
  description: string;
}[] = [
  {
    value: "number",
    title: "Number",
    description: "Track numeric values like steps, water, sleep or calories.",
  },
  {
    value: "boolean",
    title: "Boolean",
    description: "Simple Yes / No tracking for habits or daily activities.",
  },
  {
    value: "time",
    title: "Time",
    description: "Track time based activities or events during the day.",
  },
];

interface Props {
  goal: MetricDefinition;

  updateMetricType: (type: MetricType) => void;

  updateGoal: (partial: Partial<MetricDefinition>) => void;
}

export default function MetricTypeStep({
  goal,
  updateMetricType,
  updateGoal,
}: Props) {
  function handleTypeChange(type: MetricType) {
    updateMetricType(type);
    switch (type) {
      case "number":
        updateGoal({
          unit: "",
          defaultValue: 0,
          target: 0,
        });
        break;

      case "boolean":
        updateGoal({
          unit: undefined,
          defaultValue: false,
          target: false,
        });
        break;

      case "time":
        updateGoal({
          unit: undefined,
          defaultValue: "",
          target: "",
        });
        break;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}

      <div>
        <h2 className="text-xl font-semibold">Metric Type</h2>

        <p className="text-muted-foreground mt-1 text-sm">
          Define how this goal will be tracked.
        </p>
      </div>

      {/* Metric Type Selection */}

      <div className="grid gap-3">
        {METRIC_TYPES.map((metric) => {
          const selected = goal.type === metric.value;

          return (
            <button
              key={metric.value}
              type="button"
              onClick={() => handleTypeChange(metric.value)}
              className={`rounded-[10px] border p-4 text-left transition-all ${
                selected
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-accent"
              }`}
            >
              <p className="font-medium">{metric.title}</p>

              <p className="text-muted-foreground mt-1 text-sm">
                {metric.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Unit */}

      {goal.type === "number" && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Unit</label>

          <Input
            value={goal.unit ?? ""}
            placeholder="Example: steps, hours, servings"
            onChange={(e) =>
              updateGoal({
                unit: e.target.value,
              })
            }
          />
        </div>
      )}

      {/* Default Value */}

      <div className="space-y-2">
        <Label htmlFor="defaultVal" className="mb-4">
          Default Value
        </Label>
        {goal.type === "boolean" ? (
          <div className="relative">
            <select
              id="defaultVal"
              value={goal.defaultValue === true ? "true" : "false"}
              onChange={(e) =>
                updateGoal({
                  defaultValue: e.target.value === "true",
                })
              }
              className="border-input bg-background text-foreground focus:ring-primary/40 h-12 w-full appearance-none rounded-[10px] border px-4 pr-12 text-lg transition outline-none focus:ring-1"
            >
              <option key={"false"} value={"false"}>
                No
              </option>
              <option key={"true"} value={"true"}>
                Yes
              </option>
            </select>{" "}
            <ChevronDownIcon />
          </div>
        ) : (
          <Input
            type={goal.type === "time" ? "time" : "number"}
            value={String(goal.defaultValue ?? "")}
            onChange={(e) =>
              updateGoal({
                defaultValue:
                  goal.type === "number"
                    ? Number(e.target.value)
                    : e.target.value,
              })
            }
          />
        )}
      </div>

      {/* Target */}

      <div className="space-y-2">
        <Label htmlFor="defaultVal">Target</Label>

        <p className="text-muted-foreground mb-4 text-xs">
          The value you want to achieve for this metric.
        </p>

        {goal.type === "boolean" ? (
          <div className="relative">
            <select
              id="category"
              value={goal.target == true ? "true" : "false"}
              onChange={(e) =>
                updateGoal({
                  target: e.target.value === "true",
                })
              }
              className="border-input bg-background text-foreground focus:ring-primary/40 h-12 w-full appearance-none rounded-[10px] border px-4 pr-12 text-lg transition outline-none focus:ring-1"
            >
              <option key={"false"} value={"false"}>
                No
              </option>
              <option key={"true"} value={"true"}>
                Yes
              </option>
            </select>{" "}
            <ChevronDownIcon />
          </div>
        ) : (
          <Input
            type={goal.type === "time" ? "time" : "number"}
            value={String(goal.target ?? "")}
            onChange={(e) =>
              updateGoal({
                target:
                  goal.type === "number"
                    ? Number(e.target.value)
                    : e.target.value,
              })
            }
          />
        )}
      </div>

      {/* Weight */}

      <div className="space-y-2">
        <label className="text-sm font-medium">Weight</label>

        <p className="text-muted-foreground text-xs">
          Determines how much this metric contributes to your overall score.
        </p>

        <Input
          type="number"
          min={0}
          max={100}
          value={goal.weight}
          onChange={(e) =>
            updateGoal({
              weight: Number(e.target.value),
            })
          }
        />
      </div>
    </div>
  );
}
