import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { streakExecutor } from "./streak.executor.ts";
import type { VisualizationDefinition } from "../../../models/visualization";
import type { StatCardData } from "../types";

describe("streak executor", () => {
  it("breaks streaks when a calendar day is missing", () => {
    const visualization = {
      id: "streak",
      title: "Streak",
      widget: "stat-card",
    } as VisualizationDefinition;
    const result = streakExecutor.execute(visualization, {
      target: false,
      values: [
        { date: "2026-01-01", value: false },
        { date: "2026-01-02", value: false },
        { date: "2026-01-04", value: false },
      ],
    });
    const data = result.data as StatCardData;

    assert.equal(data.value, 1);
    assert.equal(data.streak?.bestValue, 2);
  });
});
