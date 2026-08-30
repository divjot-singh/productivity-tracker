"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

import { HeatmapData } from "../types";
import { VisualizationRendererProps } from "./renderer-types";
import { VisualizationCard } from "./rendering-utils";

const weekdayLabels = ["M", "T", "W", "T", "F", "S", "S"];

export default function HeatmapRenderer({
  visualization,
}: VisualizationRendererProps<HeatmapData>) {
  const populatedCells = useMemo(
    () => visualization.data.cells.filter((cell) => cell.label !== "No data"),
    [visualization.data.cells],
  );
  const columns = useMemo(() => buildColumns(populatedCells), [populatedCells]);
  const valueRange = useMemo(
    () => resolveValueRange(populatedCells),
    [populatedCells],
  );
  const isBinaryHeatmap = useMemo(
    () => isBinaryValueHeatmap(populatedCells),
    [populatedCells],
  );
  const [selectedDate, setSelectedDate] = useState(
    populatedCells.at(-1)?.date ?? null,
  );
  const selectedCell =
    populatedCells.find((cell) => cell.date === selectedDate) ??
    populatedCells.at(-1) ??
    null;

  return (
    <VisualizationCard
      title={visualization.title}
      subtitle={visualization.subtitle}
    >
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-2">
          <div className="grid grid-rows-7 gap-2 pt-7">
            {weekdayLabels.map((label, index) => (
              <div
                key={`${label}-${index}`}
                className="text-muted-foreground flex h-3 items-center text-[10px] font-medium"
              >
                {label}
              </div>
            ))}
          </div>

          {columns.map((column, columnIndex) => (
            <div key={`${column.label}-${columnIndex}`} className="space-y-2">
              <p className="text-muted-foreground text-center text-[10px] font-medium">
                {column.label}
              </p>

              <div className="grid grid-rows-7 gap-2">
                {column.cells.map((cell, cellIndex) => (
                  <button
                    key={`${cell.date}-${cellIndex}`}
                    type="button"
                    disabled={cell.label === "No data"}
                    aria-label={
                      cell.label === "No data"
                        ? "No data"
                        : `${cell.label}: ${
                            isBinaryHeatmap
                              ? formatBinaryValue(cell.value)
                              : cell.value
                          }`
                    }
                    onClick={() => {
                      if (cell.label !== "No data") {
                        setSelectedDate(cell.date);
                      }
                    }}
                    className={cn(
                      "h-3 w-3 rounded-lg transition-transform duration-150",
                      cell.label === "No data"
                        ? "cursor-default opacity-35"
                        : "cursor-pointer active:scale-95",
                      selectedDate === cell.date
                        ? "ring-offset-background ring-2 ring-white/80 ring-offset-2"
                        : "ring-0",
                    )}
                    style={{
                      backgroundColor: resolveCellColor(cell.intensity),
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedCell ? (
        <div className="bg-background/40 mt-4 flex items-center justify-between gap-4 rounded-2xl border border-white/8 px-3 py-3">
          <div>
            <p className="text-sm font-medium">{selectedCell.label}</p>
            <p className="text-muted-foreground text-xs">
              {isBinaryHeatmap ? "Daily status" : "Daily life score"}
            </p>
          </div>

          <div className="text-right">
            <p className="text-lg font-semibold">
              {isBinaryHeatmap
                ? formatBinaryValue(selectedCell.value)
                : selectedCell.value}
            </p>
            <p className="text-muted-foreground text-[11px]">
              {isBinaryHeatmap
                ? "Binary completion"
                : `${resolveIntensityLabel(selectedCell.intensity)} intensity`}
            </p>
          </div>
        </div>
      ) : null}

      <div className="text-muted-foreground mt-4 flex items-center justify-between gap-3 text-xs">
        <span>{isBinaryHeatmap ? "No" : valueRange.min.toFixed(1)}</span>
        <div className="flex items-center gap-1.5">
          {[0.15, 0.35, 0.55, 0.75, 1].map((intensity) => (
            <span
              key={intensity}
              className="h-2.5 w-2.5 rounded-lg"
              style={{ backgroundColor: resolveCellColor(intensity) }}
            />
          ))}
        </div>
        <span>{isBinaryHeatmap ? "Yes" : valueRange.max.toFixed(1)}</span>
      </div>

      <p className="text-muted-foreground mt-3 text-xs">
        {isBinaryHeatmap
          ? "Tap a day to inspect completion status."
          : "Tap a day to inspect the score and relative intensity."}
      </p>
    </VisualizationCard>
  );
}

function isBinaryValueHeatmap(cells: HeatmapData["cells"]) {
  if (cells.length === 0) {
    return false;
  }

  return cells.every((cell) => cell.value === 0 || cell.value === 1);
}

function formatBinaryValue(value: number) {
  return value >= 1 ? "Yes" : "No";
}

function buildColumns(cells: HeatmapData["cells"]) {
  const ordered = cells
    .slice()
    .sort((left, right) => left.date.localeCompare(right.date));

  const columns: Array<{
    label: string;
    cells: HeatmapData["cells"];
  }> = [];
  const indexByWeek = new Map<string, number>();

  ordered.forEach((cell) => {
    const date = new Date(cell.date);
    const dayOfWeek = (date.getDay() + 6) % 7;
    const weekStart = startOfWeek(date);
    const weekKey = weekStart.toISOString().slice(0, 10);

    let columnIndex = indexByWeek.get(weekKey);

    if (columnIndex === undefined) {
      columnIndex = columns.length;
      indexByWeek.set(weekKey, columnIndex);
      columns[columnIndex] = {
        label: weekStart.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        cells: Array.from({ length: 7 }).map((_, emptyIndex) => ({
          date: `${weekKey}-empty-${emptyIndex}`,
          label: "No data",
          value: 0,
          intensity: 0,
        })),
      };
    }

    columns[columnIndex].cells[dayOfWeek] = cell;
  });

  return columns;
}

function startOfWeek(date: Date) {
  const normalized = new Date(date);

  normalized.setHours(0, 0, 0, 0);

  const day = normalized.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  normalized.setDate(normalized.getDate() + diff);

  return normalized;
}

function resolveValueRange(cells: HeatmapData["cells"]) {
  if (cells.length === 0) {
    return { min: 0, max: 0 };
  }

  const values = cells.map((cell) => cell.value);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function resolveIntensityLabel(intensity: number) {
  if (intensity >= 0.85) {
    return "Very high";
  }

  if (intensity >= 0.6) {
    return "High";
  }

  if (intensity >= 0.35) {
    return "Medium";
  }

  if (intensity >= 0.15) {
    return "Low";
  }

  return "Very low";
}

function resolveCellColor(intensity: number) {
  const alpha = Math.max(0.12, Math.min(0.95, intensity));

  return `color-mix(in srgb, var(--primary) ${Math.round(alpha * 100)}%, var(--muted))`;
}
