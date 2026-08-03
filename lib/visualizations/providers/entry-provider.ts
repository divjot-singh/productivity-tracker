import { StatEntryKey } from "@/models/visualization";
import { VisualizationProvider } from "./provider-types";

export const entryProvider: VisualizationProvider = {
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
      unit: key === "xp" ? "xp" : undefined,
      label: key === "score" ? "Life score" : "XP",
    };
  },
};
