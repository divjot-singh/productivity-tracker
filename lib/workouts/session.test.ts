import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildExercise,
  detectSetRecords,
  diffCombination,
  lastSession,
  recentSessions,
  sortCombinations,
  recordsExcluding,
  suggestCombinationChanges,
  toWorkoutExercises,
  createEditorSet,
} from "./session.ts";
import { applySession, summarizeSession } from "./exercise-stats.ts";

const set = (weight: number, reps: number, isWarmup = false) => ({
  weight,
  reps,
  effort: 3 as const,
  isWarmup,
});

const workout = (date: string, ids: string[], combo = "push") => ({
  id: date,
  date,
  combinationIds: [combo],
  exercises: ids.map((exerciseId) => ({ exerciseId, sets: [set(50, 8)] })),
});

test("lastSession picks the latest earlier workout with the exercise", () => {
  const workouts = [
    workout("2026-01-01", ["a"]),
    workout("2026-01-05", ["a"]),
    workout("2026-01-09", ["a"]),
  ];

  assert.equal(lastSession(workouts, "a", "2026-01-09")?.date, "2026-01-05");
  assert.equal(lastSession(workouts, "b", "2026-01-09"), null);
});

test("buildExercise prefills from last session as not done", () => {
  const last = { date: "2026-01-05", sets: [set(60, 8), set(60, 7)] };
  const built = buildExercise("a", undefined, last);

  assert.equal(built.sets.length, 2);
  assert.ok(built.sets.every((s) => !s.done));
  assert.equal(built.sets[0].weight, 60);
});

test("only done sets are saved; empty exercises are dropped", () => {
  const a = buildExercise("a", undefined, {
    date: "x",
    sets: [set(60, 8), set(60, 8)],
  });
  const b = buildExercise("b", undefined, null);

  a.sets[0].done = true;

  const saved = toWorkoutExercises([a, b]);

  assert.equal(saved.length, 1);
  assert.equal(saved[0].sets.length, 1);
});

test("PR detection ignores the day being edited and warm-ups", () => {
  const history = applySession(
    "a",
    {},
    "2026-01-01",
    summarizeSession("2026-01-01", [set(80, 5)]),
  );
  const withToday = applySession(
    "a",
    history.history,
    "2026-01-09",
    summarizeSession("2026-01-09", [set(90, 5)]),
  );
  const records = recordsExcluding(withToday, "2026-01-09");

  assert.equal(records.prWeight, 80);
  assert.equal(detectSetRecords(set(85, 5), records).weightPr, true);
  assert.equal(detectSetRecords(set(80, 5), records).weightPr, false);
  assert.equal(detectSetRecords(set(100, 5, true), records).weightPr, false);
  assert.equal(
    detectSetRecords(set(85, 5), records, [set(85, 5)]).weightPr,
    false,
  );
  assert.equal(
    detectSetRecords(set(100, 5), recordsExcluding(undefined, "x")).weightPr,
    false,
  );
});

test("diffCombination", () => {
  assert.deepEqual(diffCombination(["a", "b"], ["a", "b"]).changed, false);

  const diff = diffCombination(["a", "b"], ["b", "c"]);

  assert.deepEqual(diff.added, ["c"]);
  assert.deepEqual(diff.removed, ["a"]);
  assert.equal(diffCombination(["a", "b"], ["b", "a"]).reordered, true);
});

test("suggestions use 3 of the last 5 sessions", () => {
  const combo = {
    id: "push",
    name: "Push",
    exerciseIds: ["a", "b"],
    active: true,
  };
  const workouts = [
    workout("2026-01-05", ["a", "c"]),
    workout("2026-01-04", ["a", "c"]),
    workout("2026-01-03", ["a", "c"]),
    workout("2026-01-02", ["a"]),
    workout("2026-01-01", ["a", "b"]),
  ];
  const result = suggestCombinationChanges(combo, workouts);

  assert.deepEqual(result.add, [{ exerciseId: "c", count: 3 }]);
  assert.deepEqual(result.remove, [{ exerciseId: "b", count: 1 }]);
  assert.deepEqual(
    suggestCombinationChanges(combo, workouts.slice(0, 2)).add,
    [],
  );
  assert.deepEqual(
    suggestCombinationChanges({ ...combo, optionalExercises: ["b"] }, workouts)
      .remove,
    [],
  );
});

test("createEditorSet starts not done", () => {
  assert.equal(createEditorSet().done, false);
});

test("recentSessions returns newest first", () => {
  const workouts = [
    workout("2026-01-01", ["a"]),
    workout("2026-01-05", ["a"]),
    workout("2026-01-03", ["b"]),
  ];

  assert.deepEqual(
    recentSessions(workouts, "a", "2026-02-01", 3).map((s) => s.date),
    ["2026-01-05", "2026-01-01"],
  );
});

test("priority combinations come first in order", () => {
  const names = [
    "Arms",
    "Legs Lite",
    "Pull",
    "Push/Pull Lite",
    "Core",
    "Legs",
    "Push",
  ];

  assert.deepEqual(
    sortCombinations(names.map((name) => ({ name }))).map((c) => c.name),
    ["Push", "Pull", "Legs", "Push/Pull Lite", "Legs Lite", "Arms", "Core"],
  );
});
