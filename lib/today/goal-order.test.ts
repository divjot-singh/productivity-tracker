import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { orderTodayGoals } from "./goal-order.ts";
import type { MetricDefinition } from "../../models/metric";

const goal = (id: string, label: string, type = "number") =>
  ({ id, label, type, displayOrder: 1 }) as MetricDefinition;

describe("orderTodayGoals", () => {
  it("orders morning, unanswered booleans, ongoing, bedtime, then answered goals", () => {
    const goals = [
      goal("bed", "Bed time", "time"),
      goal("steps", "Steps"),
      goal("alcohol", "Alcohol consumption", "boolean"),
      goal("wake", "Wake time", "time"),
      goal("oral", "Oral Hygeine"),
      goal("sleep", "Sleep"),
      goal("stretch", "Stretching", "boolean"),
    ];
    assert.deepEqual(
      orderTodayGoals(goals, new Set(["sleep", "alcohol", "oral"])).map(
        (item) => item.id,
      ),
      ["wake", "stretch", "oral", "steps", "bed", "sleep", "alcohol"],
    );
  });

  it("keeps default-valued goals unanswered until explicitly marked", () => {
    const goals = [
      goal("boolean", "Stretching", "boolean"),
      goal("steps", "Steps"),
    ];
    assert.deepEqual(
      orderTodayGoals(goals, new Set()).map((item) => item.id),
      ["boolean", "steps"],
    );
    assert.deepEqual(
      orderTodayGoals(goals, new Set(["boolean"])).map((item) => item.id),
      ["steps", "boolean"],
    );
  });
});
