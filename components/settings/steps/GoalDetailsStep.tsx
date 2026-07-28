"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ICON_LABELS, ICONS } from "@/lib/metric-icons";

import { MetricCategory, MetricDefinition } from "@/models/metric";
import ChevronDownIcon from "@/SVGs/ChevronDownIcon";

const CATEGORY_OPTIONS: {
  label: string;
  value: MetricCategory;
}[] = [
  {
    label: "Health",
    value: "health",
  },
  {
    label: "Fitness",
    value: "fitness",
  },
  {
    label: "Lifestyle",
    value: "lifestyle",
  },
  {
    label: "Family",
    value: "family",
  },
  {
    label: "Routine",
    value: "routine",
  },
];

interface Props {
  goal: MetricDefinition;

  updateGoal: (partial: Partial<MetricDefinition>) => void;
}

export default function GoalDetailsStep({ goal, updateGoal }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Goal Details</h2>

        <p className="text-muted-foreground mt-1 text-sm">
          Basic information about your goal.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="label">Goal Name</Label>

        <Input
          id="label"
          className="mt-4 h-12 text-lg"
          placeholder="Workout"
          value={goal.label}
          onChange={(e) =>
            updateGoal({
              label: e.target.value,
            })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>

        <Textarea
          id="description"
          className="mt-4 min-h-24 text-base"
          placeholder="Optional"
          value={goal.description}
          onChange={(e) =>
            updateGoal({
              description: e.target.value,
            })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category" className="mb-4">
          Category
        </Label>

        <div className="relative">
          <select
            id="category"
            value={goal.category}
            onChange={(e) =>
              updateGoal({
                category: e.target.value as MetricCategory,
              })
            }
            className="border-input bg-background text-foreground focus:ring-primary/40 h-12 w-full appearance-none rounded-[10px] border px-4 pr-12 text-lg transition outline-none focus:ring-1"
          >
            {CATEGORY_OPTIONS.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>

          <ChevronDownIcon />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Icon</Label>

        <div className="grid grid-cols-4 gap-3">
          {Object.keys(ICON_LABELS).map((icon) => {
            const Icon = ICONS[icon];
            const label = ICON_LABELS[icon];

            const selected = goal.icon === icon;

            return (
              <button
                key={icon}
                type="button"
                onClick={() =>
                  updateGoal({
                    icon: icon,
                  })
                }
                className={`flex flex-col items-center gap-2 rounded-xl border p-3 ${
                  selected ? "border-primary bg-primary/10" : "border-border"
                }`}
              >
                <Icon size={22} />

                <span className="text-xs">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
