import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildMessage,
  daysBetween,
  dueByTime,
  localMoment,
  mergeSettings,
  type UserFacts,
} from "./rules.ts";

const settings = mergeSettings(null);

const facts: UserFacts = {
  loggedToday: false,
  streak: 5,
  workoutToday: false,
  weighedToday: false,
  daysSinceLastEntry: 0,
  weekly: { daysLogged: 5, averageScorePercent: 72, workouts: 3 },
};

test("localMoment converts to IST", () => {
  // 2026-01-04 is a Sunday; 15:30 UTC = 21:00 IST.
  const moment = localMoment(new Date("2026-01-04T15:30:00Z"), "Asia/Kolkata");

  assert.deepEqual(moment, {
    date: "2026-01-04",
    minutes: 21 * 60,
    weekday: 0,
  });
});

test("dueByTime fires inside the window and dedupes per day", () => {
  const moment = { date: "2026-01-05", minutes: 21 * 60 + 5, weekday: 1 };

  assert.ok(dueByTime(moment, settings, {}).includes("dailyReminder"));
  assert.ok(
    !dueByTime(moment, settings, { dailyReminder: "2026-01-05" }).includes(
      "dailyReminder",
    ),
  );
  assert.ok(
    !dueByTime({ ...moment, minutes: 20 * 60 }, settings, {}).includes(
      "dailyReminder",
    ),
  );
});

test("workout nudge skips weekends, weekly summary is Sunday only", () => {
  const sunday = { date: "2026-01-04", minutes: 21 * 60 + 40, weekday: 0 };
  const saturday = { date: "2026-01-03", minutes: 18 * 60 + 5, weekday: 6 };

  assert.ok(!dueByTime(saturday, settings, {}).includes("workoutNudge"));
  assert.ok(dueByTime(sunday, settings, {}).includes("weeklySummary"));
  assert.ok(
    !dueByTime({ ...sunday, weekday: 1 }, settings, {}).includes(
      "weeklySummary",
    ),
  );
});

test("missed-days repeats at most every 3 days", () => {
  const moment = { date: "2026-01-10", minutes: 12 * 60 + 1, weekday: 6 };

  assert.ok(
    dueByTime(moment, settings, { missedDays: "2026-01-08" }).every(
      (t) => t !== "missedDays",
    ),
  );
  assert.ok(
    dueByTime(moment, settings, { missedDays: "2026-01-07" }).includes(
      "missedDays",
    ),
  );
});

test("messages depend on facts", () => {
  assert.equal(
    buildMessage("dailyReminder", { ...facts, loggedToday: true }),
    null,
  );
  assert.ok(buildMessage("dailyReminder", facts));
  assert.equal(buildMessage("streakRisk", { ...facts, streak: 2 }), null);
  assert.match(buildMessage("streakRisk", facts)!.title, /5-day/);
  assert.equal(
    buildMessage("missedDays", { ...facts, daysSinceLastEntry: 2 }),
    null,
  );
  assert.equal(
    buildMessage("missedDays", { ...facts, daysSinceLastEntry: 9 }),
    null,
  );
  assert.ok(buildMessage("missedDays", { ...facts, daysSinceLastEntry: 3 }));
  assert.equal(buildMessage("weighIn", { ...facts, weighedToday: null }), null);
  assert.match(
    buildMessage("weeklySummary", facts)!.body,
    /5\/7 days, avg score 72%, 3 workouts/,
  );
});

test("daysBetween", () => {
  assert.equal(daysBetween("2026-01-01", "2026-01-04"), 3);
});
