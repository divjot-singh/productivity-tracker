"use client";

import { ReactNode } from "react";

import { MetricDefinition } from "@/models/metric";
import { ICONS } from "@/lib/metric-icons";

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
  subtitle,
  children,
}: Props) {
  const Icon = ICONS[metric.icon] ?? ICONS.goal;

  const safeProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="bg-card rounded-3xl border p-5 shadow-sm">
      {/* Header */}

      <div className="flex items-start gap-4">
        <div className="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
          <Icon className="text-primary h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">{metric.label}</h3>

              {metric.description && (
                <p className="text-muted-foreground mt-1 text-sm">
                  {subtitle ?? metric.description}
                </p>
              )}
            </div>

            <div className="text-right">
              <p className="text-primary text-xl font-bold">
                {score?.toFixed(1) ?? 0}
              </p>

              <p className="text-muted-foreground text-xs">/ {metric.weight}</p>
            </div>
          </div>

          {/* Progress */}

          <div className="mt-4">
            <div className="bg-muted h-2 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{
                  width: `${safeProgress}%`,
                }}
              />
            </div>

            <div className="text-muted-foreground mt-2 flex justify-between text-xs">
              <span>{Math.round(progress)}%</span>

              {bonus && bonus > 0 ? (
                <span className="font-medium text-green-500">
                  +{bonus.toFixed(1)} bonus
                </span>
              ) : (
                <span>
                  Target: {String(metric.target)}
                  {metric.unit && ` ${metric.unit}`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Input */}

      <div className="mt-6">{children}</div>
    </div>
  );
}
