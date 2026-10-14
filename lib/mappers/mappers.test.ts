import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mapEntry } from "./entry.mapper.ts";
import { mapGoal, isGoalLiveOn, resolveGoalsForDate } from "./goal.mapper.ts";
import { mapExercise } from "./exercise.mapper.ts";
import { toMillis } from "./timestamps.ts";

const row = (weight: number, weightedScore: number) => ({
  metricId: "m",
  value: 1,
  score: weightedScore,
  weight,
  weightedScore,
  bonus: 0,
  xp: 0,
});

describe("mapEntry", () => {
  it("derives maxScore and percent for legacy entries from breakdown weights", () => {
    const entry = mapEntry(
      { date: "2026-01-01", values: {}, score: 90, breakdown: [row(60, 50), row(40, 40)] },
      "2026-01-01",
    );

    assert.equal(entry.maxScore, 100);
    assert.equal(entry.scorePercent, 90);
  });

  it("keeps the same 90 score lower as a percent when the day's max grew to 105", () => {
    const before = mapEntry({ score: 90, breakdown: [row(100, 90)] });
    const after = mapEntry({ score: 90, breakdown: [row(100, 85), row(5, 5)] });

    assert.equal(before.scorePercent, 90);
    assert.equal(after.scorePercent, 85.7);
  });

  it("prefers stored maxScore and scorePercent", () => {
    const entry = mapEntry({ score: 50, maxScore: 200, scorePercent: 25, breakdown: [row(100, 50)] });

    assert.equal(entry.maxScore, 200);
    assert.equal(entry.scorePercent, 25);
  });

  it("leaves percent undefined when there is nothing to derive from", () => {
    const entry = mapEntry({ date: "2026-01-01" });

    assert.equal(entry.maxScore, undefined);
    assert.equal(entry.scorePercent, undefined);
    assert.deepEqual(entry.values, {});
  });
});

describe("mapGoal", () => {
  it("reads missing status as active and keeps zero-weight goals active", () => {
    const goal = mapGoal({ label: "Weight tracker", weight: 0 }, "g1");

    assert.equal(goal.status, "active");
    assert.equal(goal.weight, 0);
    assert.equal(goal.id, "g1");
  });

  it("honours archived status and archivedAt for date checks", () => {
    const goal = mapGoal({ status: "archived", archivedAt: "2026-03-10", weight: 0 }, "g2");

    assert.equal(isGoalLiveOn(goal, "2026-03-10"), true);
    assert.equal(isGoalLiveOn(goal, "2026-03-11"), false);
  });
});

describe("resolveGoalsForDate", () => {
  const active = mapGoal({ label: "A", weight: 10 }, "a");
  const tracker = mapGoal({ label: "Weight", weight: 0 }, "w");
  const archived = mapGoal(
    { label: "Old", weight: 0, status: "archived", archivedAt: "2026-03-10", previousWeight: 5 },
    "o",
  );
  const goals = [active, tracker, archived];

  it("scores an archived goal at its previous weight on or before archivedAt", () => {
    const resolved = resolveGoalsForDate(goals, "2026-03-10");

    assert.equal(resolved.length, 3);
    assert.equal(resolved.find((g) => g.id === "o")?.weight, 5);
  });

  it("drops archived goals after archivedAt but keeps zero-weight active goals", () => {
    const resolved = resolveGoalsForDate(goals, "2026-03-11");

    assert.deepEqual(resolved.map((g) => g.id), ["a", "w"]);
  });
});

describe("mapExercise", () => {
  it("promotes legacy single equipment to equipments", () => {
    const exercise = mapExercise({ name: "Bench", equipment: "barbell" }, "e1");

    assert.deepEqual(exercise.equipments, ["barbell"]);
  });

  it("keeps existing equipments", () => {
    const exercise = mapExercise({ name: "Row", equipments: ["cable"], equipment: "barbell" });

    assert.deepEqual(exercise.equipments, ["cable"]);
  });
});

describe("toMillis", () => {
  it("handles Timestamp-like, plain-object, Date and ISO inputs", () => {
    assert.equal(toMillis({ _seconds: 10, _nanoseconds: 5_000_000 }), 10005);
    assert.equal(toMillis({ seconds: 2 }), 2000);
    assert.equal(toMillis({ toMillis: () => 42 }), 42);
    assert.equal(toMillis(new Date(7)), 7);
    assert.equal(toMillis("1970-01-01T00:00:01.000Z"), 1000);
    assert.equal(toMillis(undefined), null);
  });
});
