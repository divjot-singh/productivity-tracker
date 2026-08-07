"use client";

import { MetricDefinition } from "@/models/metric";
import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from "recharts";

interface GoalWeightBreakdownChartProps {
  metrics: MetricDefinition[];
}

const COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
  "#a855f7",
  "#ef4444",
  "#14b8a6",
  "#f97316",
  "#06b6d4",
  "#84cc16",
  "#eab308",
];

export default function GoalWeightBreakdownChart({
  metrics,
}: GoalWeightBreakdownChartProps) {
  if (metrics.length === 0) {
    return null;
  }

  const data = metrics
    .map((metric) => ({
      id: metric.id,
      label: metric.label,
      weight: Number(metric.weight) || 0,
    }))
    .filter((item) => item.weight > 0)
    .sort((a, b) => b.weight - a.weight);

  const totalWeight = data.reduce((sum, item) => sum + item.weight, 0);

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Goal Weight Breakdown</h2>
        <p className="text-muted-foreground text-xs tracking-wide uppercase">
          Total {totalWeight} pts
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-zinc-800 p-4">
        {data.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Add a positive weight to goals to see the breakdown.
          </p>
        ) : (
          <>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="weight"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={92}
                    paddingAngle={2}
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={entry.id}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => {
                      const numericValue = Number(value) || 0;
                      const percent =
                        totalWeight > 0
                          ? ((numericValue / totalWeight) * 100).toFixed(1)
                          : "0.0";

                      return [`${numericValue} pts (${percent}%)`, "Weight"];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 space-y-2">
              {data.map((item, index) => {
                const percent =
                  totalWeight > 0
                    ? ((item.weight / totalWeight) * 100).toFixed(1)
                    : "0.0";

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <p className="truncate text-sm font-medium">
                        {item.label}
                      </p>
                    </div>
                    <p className="text-muted-foreground ml-3 shrink-0 text-xs">
                      {item.weight} pts ({percent}%)
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
