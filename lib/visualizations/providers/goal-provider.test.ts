import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { goalProvider } from "./goal-provider";
import { MetricDefinition } from "../../../models/metric";
import { DailyEntry } from "../../../models/entry";
import { VisualizationDefinition } from "../../../models/visualization";

describe("composite streak targets", () => {
  it("uses current targets only for conditions configured to do so", async () => {
    const visualization = {
      id: "streak",
      title: "Workout",
      executor: "streak",
      options: {
        streakRule: {
          operator: "or",
          conditions: [
            {
              goalLabel: "Steps",
              comparator: "gte",
              value: 10000,
              useGoalTarget: true,
            },
            { goalLabel: "Cardio", comparator: "gte", value: 10 },
          ],
        },
      },
    } as unknown as VisualizationDefinition;
    const goals = [
      { id: "steps", label: "Steps", target: 5000 },
      { id: "cardio", label: "Cardio", target: 7 },
    ] as MetricDefinition[];
    const entries = [
      { date: "2026-01-01", values: { steps: 5000, cardio: 0 } },
      { date: "2026-01-02", values: { steps: 0, cardio: 7 } },
      { date: "2026-01-03", values: { steps: 0, cardio: 10 } },
    ] as DailyEntry[];
    const context = { visualization, goals, entries } as Parameters<
      typeof goalProvider.getData
    >[0];
    const data = await goalProvider.getData(context);
    assert.deepEqual(
      data.values.map((entry) => entry.value),
      [true, false, true],
    );
    goals[0].target = 6000;
    const updated = await goalProvider.getData(context);
    assert.equal(updated.values[0].value, false);
  });
});
