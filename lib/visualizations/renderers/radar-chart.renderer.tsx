"use client";

import {
  Legend,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { TrendChartData } from "../types";
import { VisualizationRendererProps } from "./renderer-types";
import {
  ChartTooltipContent,
  formatAxisValue,
  getSeriesColor,
  VisualizationCard,
} from "./rendering-utils";

export default function RadarChartRenderer({
  visualization,
}: VisualizationRendererProps<TrendChartData>) {
  const { data } = visualization;

  const rows = data.labels.map((label, index) => ({
    subject: label,
    ...Object.fromEntries(
      data.datasets.map((dataset, datasetIndex) => [
        `series-${datasetIndex}`,
        dataset.data[index] ?? 0,
      ]),
    ),
  }));

  const rawMaxValue =
    data.domain?.max ??
    Math.max(1, ...data.datasets.flatMap((dataset) => dataset.data));
  const maxValue = getNiceRadarMax(rawMaxValue);
  const tickCount = getRadarTickCount(maxValue);

  return (
    <VisualizationCard
      title={visualization.title}
      subtitle={visualization.subtitle}
    >
      <div className="h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            data={rows}
            margin={{ top: 12, right: 12, bottom: 8, left: 12 }}
          >
            <PolarGrid stroke="var(--muted-foreground)" strokeOpacity={0.42} />

            <PolarAngleAxis
              dataKey="subject"
              tickSize={22}
              tick={{
                fill: "var(--foreground)",
                fontSize: 11,
              }}
            />

            <PolarRadiusAxis
              angle={90}
              tickCount={tickCount}
              domain={[0, maxValue]}
              tick={{ fill: "var(--foreground)", fontSize: 10 }}
              axisLine
              allowDecimals={false}
              tickFormatter={(value) =>
                String(formatAxisValue(value, data, { compact: true }))
              }
            />

            <Legend
              position="bottom"
              layout="horizontal"
              iconType="circle"
              wrapperStyle={{
                fontSize: "12px",
                color: "var(--muted-foreground)",
                marginTop: "8px",
              }}
            />

            <Tooltip content={<ChartTooltipContent data={data} />} />

            {data.datasets.map((dataset, index) => (
              <Radar
                key={dataset.label}
                dataKey={`series-${index}`}
                name={dataset.label}
                stroke={getSeriesColor(index)}
                fill={getSeriesColor(index)}
                fillOpacity={0.16}
                strokeWidth={2.5}
                dot={{
                  r: 3.5,
                  fill: getSeriesColor(index),
                  stroke: "var(--background)",
                  strokeWidth: 1.5,
                }}
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </VisualizationCard>
  );
}

function getNiceRadarMax(value: number) {
  if (value <= 10) {
    return 10;
  }

  if (value <= 25) {
    return Math.ceil(value / 5) * 5;
  }

  if (value <= 100) {
    return Math.ceil(value / 10) * 10;
  }

  return Math.ceil(value / 25) * 25;
}

function getRadarTickCount(maxValue: number) {
  if (maxValue <= 10) {
    return 6;
  }

  if (maxValue <= 50) {
    return 6;
  }

  return 5;
}
