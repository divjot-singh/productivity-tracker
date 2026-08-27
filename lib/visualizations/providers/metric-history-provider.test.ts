import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { metricHistoryProvider } from "./metric-history-provider";

describe("metricHistoryProvider weekly aggregation", () => {
  it("aggregates boolean goal values into Monday-Sunday yes-day counts", async () => {
    const visualization = {
      id: "wt-weekly",
      title: "Gym Days per Week",
      widget: "bar-chart",
      scope: "goal",
      provider: "metric",
      executor: "trend",
      key: "Weight training",
      period: { type: "days", value: 30 },
      aggregation: "weekly",
      displayOrder: 1,
      visible: true,
    } as any;

    const goals = [
      {
        id: "g-weight-training",
        label: "Weight training",
        category: "fitness",
        type: "boolean",
        target: true,
      },
    ] as any;

    const entries = [
      {
        date: "2026-08-17",
        breakdown: [
          {
            metricId: "g-weight-training",
            value: true,
            score: 1,
            weight: 1,
            bonus: 0,
            xp: 0,
          },
        ],
      },
      {
        date: "2026-08-18",
        breakdown: [
          {
            metricId: "g-weight-training",
            value: true,
            score: 1,
            weight: 1,
            bonus: 0,
            xp: 0,
          },
        ],
      },
      {
        date: "2026-08-19",
        breakdown: [
          {
            metricId: "g-weight-training",
            value: true,
            score: 1,
            weight: 1,
            bonus: 0,
            xp: 0,
          },
        ],
      },
      {
        date: "2026-08-20",
        breakdown: [
          {
            metricId: "g-weight-training",
            value: false,
            score: 0,
            weight: 1,
            bonus: 0,
            xp: 0,
          },
        ],
      },
      {
        date: "2026-08-21",
        breakdown: [
          {
            metricId: "g-weight-training",
            value: true,
            score: 1,
            weight: 1,
            bonus: 0,
            xp: 0,
          },
        ],
      },
      {
        date: "2026-08-22",
        breakdown: [
          {
            metricId: "g-weight-training",
            value: true,
            score: 1,
            weight: 1,
            bonus: 0,
            xp: 0,
          },
        ],
      },
      {
        date: "2026-08-23",
        breakdown: [
          {
            metricId: "g-weight-training",
            value: false,
            score: 0,
            weight: 1,
            bonus: 0,
            xp: 0,
          },
        ],
      },
      {
        date: "2026-08-24",
        breakdown: [
          {
            metricId: "g-weight-training",
            value: true,
            score: 1,
            weight: 1,
            bonus: 0,
            xp: 0,
          },
        ],
      },
      {
        date: "2026-08-25",
        breakdown: [
          {
            metricId: "g-weight-training",
            value: true,
            score: 1,
            weight: 1,
            bonus: 0,
            xp: 0,
          },
        ],
      },
    ] as any;

    const data = await metricHistoryProvider.getData({
      visualization,
      goals,
      entries,
      exercises: [],
      combinations: [],
      workouts: [],
    });

    assert.equal(data.valueKind, "number");
    assert.equal(data.target, 5);
    assert.deepEqual(
      data.values.map((item) => ({ date: item.date, value: item.value })),
      [
        { date: "2026-08-17", value: 5 },
        { date: "2026-08-24", value: 2 },
      ],
    );
  });
});
