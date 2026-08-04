import { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { TrendChartData } from "../types";
import { formatClockTime } from "../time-utils";

interface VisualizationCardProps {
  title: string;

  subtitle?: string;

  footer?: ReactNode;

  children: ReactNode;

  className?: string;
}

interface ChartTooltipContentProps {
  active?: boolean;

  label?: string;

  data?: TrendChartData;

  payload?: Array<{
    name?: string;
    value?: number | string;
    color?: string;
  }>;
}

export function VisualizationCard({
  title,
  subtitle,
  footer,
  children,
  className,
}: VisualizationCardProps) {
  return (
    <section
      className={cn(
        "bg-card/95 w-full min-w-0 rounded-[28px] border border-white/14 p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05),0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur sm:p-6",
        className,
      )}
    >
      <header className="mb-4 space-y-1">
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>

        {subtitle ? (
          <p className="text-muted-foreground text-sm leading-5">{subtitle}</p>
        ) : null}
      </header>

      {children}

      {footer ? <div className="mt-4">{footer}</div> : null}
    </section>
  );
}

export function ChartTooltipContent({
  active,
  label,
  data,
  payload,
}: ChartTooltipContentProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="bg-card min-w-32 rounded-2xl border border-white/8 px-3 py-2.5 shadow-xl">
      {label ? (
        <p className="text-muted-foreground text-xs font-medium tracking-wide">
          {label}
        </p>
      ) : null}

      <div className="mt-2 space-y-1.5">
        {payload.map((item, index) => (
          <div
            key={`${item.name ?? "value"}-${index}`}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color ?? "var(--primary)" }}
              />

              <span className="text-muted-foreground text-xs">{item.name}</span>
            </div>

            <span className="text-sm font-semibold">
              {formatTooltipValue(item.value, data)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function buildTrendRows(data: TrendChartData) {
  return data.labels.map((label, index) => {
    const row: Record<string, string | number | null> = {
      label,
    };

    data.datasets.forEach((dataset, datasetIndex) => {
      row[getDatasetKey(datasetIndex)] = dataset.data[index] ?? null;
    });

    return row;
  });
}

export function getChartDomain(
  data: TrendChartData,
): [number, number] | undefined {
  if (!data.domain) {
    return undefined;
  }

  return [data.domain.min, data.domain.max];
}

export function formatAxisValue(
  value: number | string,
  data: TrendChartData,
  options?: {
    compact?: boolean;
  },
) {
  if (typeof value !== "number") {
    return value;
  }

  if (data.valueKind === "boolean") {
    return value >= 1 ? "Yes" : "No";
  }

  if (data.valueKind === "time-of-day") {
    return formatClockTime(value * 60);
  }

  const formatted = formatCompactNumber(value);

  if (options?.compact || !data.unit) {
    return formatted;
  }

  return `${formatted} ${data.unit}`;
}

function formatTooltipValue(
  value: number | string | undefined,
  data?: TrendChartData,
) {
  if (typeof value !== "number") {
    return value ?? "-";
  }

  if (data?.valueKind === "time-of-day") {
    return formatClockTime(value * 60);
  }

  return formatCompactNumber(value);
}

export function formatXAxisLabel(label: string, index: number, total: number) {
  if (total <= 7) {
    return label;
  }

  const step = total <= 14 ? 2 : total <= 31 ? 5 : 7;

  return index % step === 0 || index === total - 1 ? label : "";
}

export function getDatasetKey(index: number) {
  return `series-${index}`;
}

export function getSeriesColor(index: number) {
  const colors = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ];

  return colors[index % colors.length];
}

export function formatCompactNumber(value: number | string | undefined) {
  if (typeof value === "number") {
    const formatter = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: value >= 100 ? 0 : 1,
    });

    return formatter.format(value);
  }

  return value ?? "-";
}
