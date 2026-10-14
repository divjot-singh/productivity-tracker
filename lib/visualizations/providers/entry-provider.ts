import { StatEntryKey } from "@/models/visualization";
import { StatProviderData, VisualizationProvider } from "./provider-types";

const ENTRY_KEY_LABELS: Record<StatEntryKey, string> = {
  score: "Life score",
  scorePercent: "Score %",
  maxScore: "Maximum score",
  xp: "XP",
};

const ENTRY_KEY_UNITS: Partial<Record<StatEntryKey, string>> = {
  scorePercent: "%",
  xp: "xp",
};

export const entryProvider: VisualizationProvider<StatProviderData> = {
  async getData({ visualization, entries }) {
    const key = visualization.key as StatEntryKey;

    const values = entries
      .map((entry) => ({
        date: entry.date,
        value: entry[key],
      }))
      .filter(
        (
          item,
        ): item is {
          date: string;
          value: number;
        } => typeof item.value === "number",
      )
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      values,
      unit: ENTRY_KEY_UNITS[key],
      label: ENTRY_KEY_LABELS[key] ?? "Life score",
    };
  },
};
