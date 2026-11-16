import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildAutoVisualizations, matchesScoreView } from "./auto-presets.ts";

const goal = (overrides: Record<string, unknown>) =>
  ({
    id: "g",
    label: "Goal",
    category: "health",
    type: "number",
    weight: 10,
    scoring: { type: "goal" },
    status: "active",
    ...overrides,
  }) as never;

describe("buildAutoVisualizations", () => {
  it("always includes score and percent widgets", () => {
    const ids = buildAutoVisualizations([]).map((v) => v.id);

    assert.ok(ids.includes("auto-score-latest-score"));
    assert.ok(ids.includes("auto-percent-trend-percent"));
    assert.ok(ids.includes("auto-consistency-heatmap"));
  });

  it("chooses widgets by goal type and scoring", () => {
    const defs = buildAutoVisualizations([
      goal({
        id: "b",
        label: "Junk food",
        type: "boolean",
        scoring: { type: "boolean" },
        category: "lifestyle",
      }),
      goal({
        id: "t",
        label: "Bed time",
        type: "time",
        scoring: { type: "time-range" },
      }),
      goal({
        id: "s",
        label: "Steps",
        type: "number",
        scoring: { type: "goal" },
      }),
      goal({
        id: "sl",
        label: "Sleep",
        type: "number",
        scoring: { type: "range" },
        weight: 5,
      }),
      goal({
        id: "o",
        label: "Mood",
        type: "number",
        scoring: { type: "options" },
      }),
    ]);
    const byId = new Map(defs.map((d) => [d.id, d]));

    assert.equal(byId.get("auto-goal-b")?.executor, "streak");
    assert.equal(byId.get("auto-goal-t")?.widget, "timeline");
    assert.equal(byId.get("auto-goal-s")?.widget, "bar-chart");
    assert.equal(byId.get("auto-goal-sl")?.widget, "line-chart");
    assert.equal(byId.has("auto-goal-o"), false);
    assert.ok(byId.has("auto-category-radar"));
  });

  it("skips archived goals and keeps zero-weight trackers first", () => {
    const defs = buildAutoVisualizations([
      goal({ id: "a", label: "Old", status: "archived", weight: 0 }),
      goal({ id: "w", label: "Weight", weight: 0 }),
      goal({ id: "x", label: "Steps" }),
    ]);
    const goalIds = defs
      .filter((d) => d.id.startsWith("auto-goal-"))
      .map((d) => d.id);

    assert.deepEqual(goalIds, ["auto-goal-w", "auto-goal-x"]);
  });
});

describe("matchesScoreView", () => {
  it("filters score and percent variants and leaves others alone", () => {
    assert.equal(matchesScoreView("auto-score-trend-score", "percent"), false);
    assert.equal(matchesScoreView("auto-score-trend-score", "score"), true);
    assert.equal(
      matchesScoreView("auto-percent-trend-percent", "score"),
      false,
    );
    assert.equal(matchesScoreView("auto-percent-trend-percent", "both"), true);
    assert.equal(matchesScoreView("auto-goal-x", "percent"), true);
  });
});
