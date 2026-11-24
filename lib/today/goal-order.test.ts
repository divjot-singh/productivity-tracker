import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getAnsweredGoalIds, orderTodayGoals } from "./goal-order.ts";
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

  it("recognizes alternate morning labels in routine order", () => {
    const goals = [
      goal("weight", "Weight tracker"),
      goal("sleep", "Sleep hours"),
      goal("wake", "Wake time", "time"),
    ];
    assert.deepEqual(
      orderTodayGoals(goals, new Set()).map((item) => item.id),
      ["wake", "sleep", "weight"],
    );
  });
});

describe("getAnsweredGoalIds", () => {
  it("recovers non-default saved values and preserves explicit default answers", () => {
    const goals = [
      { ...goal("wake", "Wake time", "time"), defaultValue: "00:00" },
      { ...goal("sleep", "Sleep"), defaultValue: 0 },
      {
        ...goal("alcohol", "Alcohol consumption", "boolean"),
        defaultValue: true,
      },
      { ...goal("stretch", "Stretching", "boolean"), defaultValue: false },
      { ...goal("weight", "Body weight"), defaultValue: 0 },
    ];
    const answered = getAnsweredGoalIds(
      goals,
      {
        wake: "07:30",
        sleep: 7,
        alcohol: false,
        stretch: false,
        weight: 0,
      },
      ["stretch"],
    );
    assert.deepEqual([...answered].sort(), [
      "alcohol",
      "sleep",
      "stretch",
      "wake",
    ]);
  });

  it("does not infer answers for untouched or missing defaults", () => {
    const goals = [
      { ...goal("wake", "Wake time", "time"), defaultValue: "00:00" },
      {
        ...goal("alcohol", "Alcohol consumption", "boolean"),
        defaultValue: true,
      },
      { ...goal("sleep", "Sleep"), defaultValue: 8 },
      { ...goal("weight", "Body weight"), defaultValue: 0 },
    ];
    assert.equal(
      getAnsweredGoalIds(goals, { wake: "00:00", alcohol: true, sleep: 0 })
        .size,
      0,
    );
  });
});
