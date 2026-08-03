"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
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

export default function LineChartRenderer({
  visualization,
}: VisualizationRendererProps<TrendChartData>) {
  const { data } = visualization;
  const chartData = buildTrendRows(data);
  const domain = getChartDomain(data);

  return (
    <VisualizationCard
      title={visualization.title}
      subtitle={visualization.subtitle}
    >
      <div className="h-56 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 12, left: 8, bottom: 8 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeOpacity={0.45}
            />

            <XAxis
              dataKey="label"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
              tickFormatter={(value, index) =>
                formatXAxisLabel(String(value), index, chartData.length)
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

            <Tooltip content={<ChartTooltipContent />} />

            {data.datasets.map((dataset, index) => (
              <Line
                key={dataset.label}
                type="monotone"
                dataKey={getDatasetKey(index)}
                name={dataset.label}
                stroke={getSeriesColor(index)}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
                isAnimationActive
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </VisualizationCard>
  );
}
