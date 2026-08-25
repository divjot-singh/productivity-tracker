import { DailyEntry } from "@/models/entry";
import { WorkoutEntry } from "@/models/workout";
import { VisualizationPeriod } from "@/models/visualization";

export function normalizeVisualizationKey(value: string): string {
  return value.trim().toLowerCase();
}

export function filterEntriesByPeriod(
  entries: DailyEntry[],
  period: VisualizationPeriod,
): DailyEntry[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) {
    return [];
  }

  if (period.type === "all") {
    return sorted;
  }

  const latestDate = new Date(sorted.at(-1)!.date);

  const cutoff = new Date(latestDate);

  cutoff.setDate(cutoff.getDate() - period.value + 1);

  return sorted.filter((entry) => {
    return new Date(entry.date) >= cutoff;
  });
}
export function expandPeriodForComparison(
  period: VisualizationPeriod,
  comparison?: string,
): VisualizationPeriod {
  if (comparison !== "previous-period" || period.type === "all") {
    return period;
  }

  return {
    type: "days",
    value: period.value * 2,
  };
}

export function filterWorkoutsByPeriod(
  workouts: WorkoutEntry[],
  period: VisualizationPeriod,
): WorkoutEntry[] {
  const sorted = [...workouts].sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) {
    return [];
  }

  if (period.type === "all") {
    return sorted;
  }

  const latestDate = new Date(sorted.at(-1)!.date);
  const cutoff = new Date(latestDate);

  cutoff.setDate(cutoff.getDate() - period.value + 1);

  return sorted.filter((workout) => new Date(workout.date) >= cutoff);
}
