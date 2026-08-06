"use client";

import { cn } from "@/lib/utils";

interface TodayStatusBarProps {
  dateLabel: string;
  totalScore: number;
  totalWeights: number;
  totalXP: number;
  isRefreshing?: boolean;
}

export default function TodayStatusBar({
  dateLabel,
  totalScore,
  totalWeights,
  totalXP,
  isRefreshing = false,
}: TodayStatusBarProps) {
  const percentage = totalWeights > 0 ? (totalScore / totalWeights) * 100 : 0;

  const visualPercentage = Math.min(percentage, 100);

  const progressClass =
    percentage >= 100
      ? "bg-gradient-to-r from-emerald-400 to-green-500"
      : percentage >= 80
        ? "bg-gradient-to-r from-sky-400 to-blue-500"
        : percentage >= 60
          ? "bg-gradient-to-r from-yellow-400 to-orange-500"
          : "bg-gradient-to-r from-red-400 to-red-500";

  return (
    <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-20 border-b px-4 py-2.5 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{dateLabel}</span>

        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="text-muted-foreground text-xs">Life Score</p>
            {isRefreshing ? (
              <div className="bg-muted h-4 w-20 animate-pulse rounded" />
            ) : (
              <p className="text-sm font-semibold">
                {totalScore} / {totalWeights}
              </p>
            )}
          </div>

          <div>
            <p className="text-muted-foreground text-xs">XP</p>
            {isRefreshing ? (
              <div className="bg-muted h-4 w-10 animate-pulse rounded" />
            ) : (
              <p className="text-sm font-semibold">{totalXP}</p>
            )}
          </div>
        </div>
      </div>
      <div className="mt-2">
        <div className="bg-muted h-1.5 overflow-hidden rounded-full">
          {isRefreshing ? (
            <div className="bg-muted-foreground/35 h-full w-1/3 animate-pulse rounded-full" />
          ) : (
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                progressClass,
              )}
              style={{ width: `${visualPercentage}%` }}
            />
          )}
        </div>

        {isRefreshing ? (
          <p className="text-muted-foreground mt-1 text-right text-xs">
            Updating...
          </p>
        ) : (
          <p className="text-muted-foreground mt-1 text-right text-xs">
            {Math.round(percentage)}%
          </p>
        )}
      </div>
    </div>
  );
}
