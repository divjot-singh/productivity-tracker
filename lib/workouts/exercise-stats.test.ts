import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applySession,
  buildHistories,
  computeStats,
  estimateOneRepMax,
  summarizeSession,
} from "./exercise-stats.ts";

const set = (weight: number | null, reps: number | null, isWarmup = false) => ({
  weight,
  reps,
  effort: null,
  isWarmup,
});

describe("summarizeSession", () => {
  it("ignores warm-up sets and totals volume", () => {
    const summary = summarizeSession("2026-01-01", [
      set(40, 10, true),
      set(80, 5),
      set(80, 5),
    ]);

    assert.equal(summary?.topWeight, 80);
    assert.equal(summary?.volume, 800);
    assert.equal(summary?.totalSets, 2);
    assert.equal(summary?.totalReps, 10);
  });

  it("returns null when only warm-ups exist", () => {
    assert.equal(summarizeSession("2026-01-01", [set(40, 10, true)]), null);
  });

  it("handles bodyweight sets with no weight", () => {
    const summary = summarizeSession("2026-01-01", [set(null, 12), set(null, 10)]);

    assert.equal(summary?.volume, 0);
    assert.equal(summary?.totalReps, 22);
  });
});

describe("estimateOneRepMax", () => {
  it("uses the Epley formula and returns the weight for a single", () => {
    assert.equal(estimateOneRepMax(100, 1), 100);
    assert.equal(estimateOneRepMax(100, 5), 116.7);
    assert.equal(estimateOneRepMax(0, 5), 0);
  });
});

describe("computeStats / applySession", () => {
  const w = (date: string, weight: number, reps: number) => ({
    date,
    exercises: [{ exerciseId: "bench", sets: [set(weight, reps)] }],
  });

  it("assigns each record to the first date it was reached", () => {
    const histories = buildHistories([
      w("2026-01-01", 80, 5),
      w("2026-01-08", 85, 5),
      w("2026-01-15", 85, 5),
    ]);
    const stats = computeStats("bench", histories.get("bench")!);

    assert.deepEqual(stats.prWeight, { value: 85, date: "2026-01-08" });
    assert.equal(stats.totalSessions, 3);
    assert.equal(stats.lastPerformed, "2026-01-15");
  });

  it("lowers the PR when the record session is edited down or deleted", () => {
    const histories = buildHistories([w("2026-01-01", 80, 5), w("2026-01-08", 90, 5)]);
    const base = computeStats("bench", histories.get("bench")!);

    const edited = applySession("bench", base.history, "2026-01-08", summarizeSession("2026-01-08", [set(82, 5)]));
    assert.equal(edited.prWeight?.value, 82);

    const deleted = applySession("bench", base.history, "2026-01-08", null);
    assert.deepEqual(deleted.prWeight, { value: 80, date: "2026-01-01" });
    assert.equal(deleted.totalSessions, 1);
  });

  it("returns empty records when no history remains", () => {
    const stats = applySession("bench", {}, "2026-01-01", null);

    assert.equal(stats.prWeight, null);
    assert.equal(stats.lastPerformed, null);
  });
});
