"use client";

import { ReactNode, useState } from "react";

import { MetricDefinition } from "@/models/metric";
import { ICONS } from "@/lib/metric-icons";
import { cn } from "@/lib/utils";
import { InfoIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Props {
  metric: MetricDefinition;

  progress?: number; // 0-100

  score?: number;

  bonus?: number;
  subtitle?: string;

  children: ReactNode;
}

export default function MetricCard({
  metric,
  progress = 0,
  score,
  bonus,
  children,
}: Props) {
  const Icon = ICONS[metric.icon] ?? ICONS.goal;

  const safeProgress = Math.min(Math.max(progress, 0), 100);

  const progressClass =
    progress >= 100
      ? "bg-gradient-to-r from-emerald-400 to-green-500"
      : progress >= 80
        ? "bg-gradient-to-r from-sky-400 to-blue-500"
        : progress >= 60
          ? "bg-gradient-to-r from-yellow-400 to-orange-500"
          : "bg-gradient-to-r from-red-400 to-red-500";

  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <div className="bg-card rounded-2xl border p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
          <Icon className="text-primary h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold">{metric.label}</h3>

              {metric.scoringExplanation && (
                <Popover open={infoOpen} onOpenChange={setInfoOpen}>
                  <PopoverTrigger
                    render={
                      <button
                        type="button"
                        aria-label="Scoring explanation"
                        className="text-muted-foreground hover:text-foreground inline-flex items-center justify-center rounded-full p-0.5 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <InfoIcon className="h-3.5 w-3.5" />
                      </button>
                    }
                  />

                  <PopoverContent className="w-64 text-xs" align="start">
                    {metric.scoringExplanation}
                  </PopoverContent>
                </Popover>
              )}
            </div>

            <div className="text-right">
              <p className="text-primary text-sm font-bold">
                {score?.toFixed(1) ?? 0}
                <span className="text-muted-foreground text-xs font-normal">
                  {" "}
                  / {metric.weight}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-1.5">
            <div className="bg-muted h-1.5 overflow-hidden rounded-full">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  progressClass,
                )}
                style={{ width: `${safeProgress}%` }}
              />
            </div>

            <div className="text-muted-foreground mt-1 flex justify-between text-xs">
              <span>{Math.round(progress)}%</span>

              {bonus && bonus > 0 ? (
                <span className="font-medium text-emerald-500">
                  +{bonus.toFixed(1)} bonus
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3">{children}</div>
    </div>
  );
}
