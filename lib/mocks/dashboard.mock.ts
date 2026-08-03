import { DailyEntry, EntryValue, MetricScoreBreakdown } from "@/models/entry";
import { MetricDefinition } from "@/models/metric";
import { Timestamp } from "firebase/firestore";

export function getMockEntries(goals: MetricDefinition[]): DailyEntry[] {
  /**
   * TEMPORARY MOCK DATA
   *
   * Generates historical entries for visualization testing.
   *
   * Covers:
   * - trends
   * - progress
   * - streaks
   * - leaderboard
   * - averages
   * - comparisons
   *
   * Replace with Firebase entries once enough real data exists.
   */

  const days = 200;

  return Array.from({ length: days }).map((_, index) => {
    const date = new Date();

    date.setDate(date.getDate() - index);

    const values: Record<string, EntryValue> = {};

    const breakdown: MetricScoreBreakdown[] = [];

    goals.forEach((goal) => {
      const value = generateValue(goal, index);

      values[goal.id] = value;

      const scoreData = generateBreakdown(goal, value);

      breakdown.push({
        metricId: goal.id,
        value,

        weight: goal.weight,

        score: scoreData.score,

        weightedScore: scoreData.weightedScore,

        bonus: scoreData.bonus,

        xp: scoreData.bonus,
      });
    });

    return {
      id: date.toISOString().split("T")[0],

      date: date.toISOString().split("T")[0],

      values,

      score: breakdown.reduce((sum, item) => sum + item.weightedScore, 0),

      xp: generateXp(index),

      breakdown,

      createdAt: Timestamp.fromDate(date),

      updatedAt: Timestamp.fromDate(date),
    };
  });
}

function generateBreakdown(goal: MetricDefinition, value: EntryValue) {
  let multiplier = 1;

  switch (goal.type) {
    case "boolean":
      multiplier = value === goal.target ? 1 : 0;
      break;

    case "number":
      if (typeof value === "number" && typeof goal.target === "number") {
        multiplier = value / goal.target;
      }
      break;

    case "time":
      multiplier = Math.random();
      break;
  }

  const score = Number(
    Math.min(multiplier, 1) * Number(goal.weight.toFixed(2)),
  );

  const bonus = multiplier > 1 ? Number((multiplier - 1) * goal.weight) : 0;

  return {
    score,

    weightedScore: score + bonus,

    bonus,
  };
}
function generateValue(goal: MetricDefinition, index: number): EntryValue {
  switch (goal.type) {
    case "boolean":
      return index % 5 !== 0;

    case "time":
      return goal.label === "Wake time"
        ? randomWakeTime(index)
        : randomBedTime(index);

    case "number":
      return generateNumberValue(goal, index);

    default:
      return goal.defaultValue;
  }
}

function generateNumberValue(goal: MetricDefinition, index: number): number {
  if (typeof goal.target !== "number") {
    return 0;
  }

  const variance = goal.target * 0.5;

  const value =
    goal.target - variance + (((index * 13) % 100) / 100) * variance * 2;

  return Number(value.toFixed(1));
}

function generateScore(index: number) {
  return Math.floor(70 + ((index * 7) % 30));
}

function generateXp(index: number) {
  return Math.floor((index * 17) % 50);
}

function randomWakeTime(index: number) {
  const times = ["07:30", "08:00", "08:30", "09:00", "09:30"];

  return times[index % times.length];
}

function randomBedTime(index: number) {
  const times = ["21:00", "22:00", "23:00", "00:00"];

  return times[index % times.length];
}
