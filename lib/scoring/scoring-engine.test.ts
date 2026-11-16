import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateScore } from "./scoring-engine";
import { MetricDefinition } from "../../models/metric";
import { mapGoal, resolveGoalsForDate } from "../mappers/goal.mapper";

describe("archived goal scoring", () => {
  it("excludes archived goals from scores and available weight", () => {
    const goals = [
      { id: "active", weight: 5, target: true, scoring: { type: "boolean" } },
      {
        id: "archived",
        weight: 10,
        target: true,
        archived: true,
        scoring: { type: "boolean" },
      },
    ] as MetricDefinition[];
    const mapped = goals.map((goal) =>
      mapGoal(goal as unknown as Record<string, unknown>),
    );
    const result = calculateScore(resolveGoalsForDate(mapped, "2026-11-16"), {
      active: true,
      archived: true,
    });
    assert.equal(result.totalScore, 5);
    assert.equal(result.totalWeights, 5);
    assert.deepEqual(
      result.metrics.map((metric) => metric.metricId),
      ["active"],
    );
  });
});
