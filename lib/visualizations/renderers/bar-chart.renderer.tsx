"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { TrendChartData } from "../types";
import { VisualizationRendererProps } from "./renderer-types";
import {
  buildTrendRows,
  ChartTooltipContent,
  formatAxisValue,
  formatXAxisLabel,
  getChartDomain,
  getDatasetKey,
  getSeriesColor,
  VisualizationCard,
} from "./rendering-utils";

export default function BarChartRenderer({
  visualization,
}: VisualizationRendererProps<TrendChartData>) {
  const { data } = visualization;
  const rows = buildTrendRows(data);
  const domain = getChartDomain(data);

  return (
    <VisualizationCard
      title={visualization.title}
      subtitle={visualization.subtitle}
    >
      <div className="h-56 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            margin={{ top: 10, right: 8, left: 8, bottom: 8 }}
            barGap={10}
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeOpacity={0.2}
            />

            <XAxis
              dataKey="label"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={20}
              tickFormatter={(value, index) =>
                formatXAxisLabel(String(value), index, rows.length)
              }
            />

            <YAxis
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={48}
              domain={domain}
              tickFormatter={(value) =>
                formatAxisValue(value, data, { compact: true })
              }
            />

            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.02)" }}
              content={<ChartTooltipContent />}
            />

            {data.datasets.map((dataset, index) => (
              <Bar
                key={dataset.label}
                dataKey={getDatasetKey(index)}
                name={dataset.label}
                fill={getSeriesColor(index)}
                radius={[12, 12, 6, 6]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </VisualizationCard>
  );
}
