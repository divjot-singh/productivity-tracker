"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ICON_LABELS, ICONS } from "@/lib/metric-icons";
import { cn } from "@/lib/utils";
import type { MetricCategory, MetricDefinition } from "@/models/metric";

const CATEGORIES: { label: string; value: MetricCategory }[] = [
  { label: "Health", value: "health" },
  { label: "Fitness", value: "fitness" },
  { label: "Lifestyle", value: "lifestyle" },
  { label: "Family", value: "family" },
  { label: "Routine", value: "routine" },
];

interface Props {
  goal: MetricDefinition;
  updateGoal: (partial: Partial<MetricDefinition>) => void;
}

export default function BasicsStep({ goal, updateGoal }: Props) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="goal-name" className="text-sm font-medium">
          What do you want to track?
        </label>

        <Input
          id="goal-name"
          className="h-12 text-base"
          placeholder="e.g. Water, Reading, Workout"
          value={goal.label}
          onChange={(event) => updateGoal({ label: event.target.value })}
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Icon</p>

        <div className="grid grid-cols-5 gap-2">
          {Object.keys(ICON_LABELS).map((icon) => {
            const Icon = ICONS[icon];

            return (
              <button
                key={icon}
                type="button"
                title={ICON_LABELS[icon]}
                aria-label={ICON_LABELS[icon]}
                aria-pressed={goal.icon === icon}
                onClick={() => updateGoal({ icon })}
                className={cn(
                  "flex h-12 items-center justify-center rounded-xl border transition-colors",
                  goal.icon === icon
                    ? "border-primary bg-primary/10 text-primary"
                    : "text-muted-foreground active:bg-accent",
                )}
              >
                <Icon size={20} />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <button
          type="button"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen((open) => !open)}
          className="text-muted-foreground flex h-10 items-center gap-1 text-sm"
        >
          More options
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              moreOpen && "rotate-180",
            )}
          />
        </button>

        {moreOpen ? (
          <div className="mt-2 space-y-4">
            <div className="space-y-2">
              <label htmlFor="goal-description" className="text-sm font-medium">
                Description
              </label>

              <Textarea
                id="goal-description"
                placeholder="Optional"
                value={goal.description ?? ""}
                onChange={(event) =>
                  updateGoal({ description: event.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Category</p>

              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    aria-pressed={goal.category === category.value}
                    onClick={() => updateGoal({ category: category.value })}
                    className={cn(
                      "h-9 rounded-full border px-4 text-sm",
                      goal.category === category.value
                        ? "bg-primary text-primary-foreground border-transparent"
                        : "active:bg-accent",
                    )}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
