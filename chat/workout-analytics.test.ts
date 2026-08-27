import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseDeterministicIntent } from "./intents/parser";
import {
  buildSessionMetrics,
  resolveExerciseFromMessage,
  resolveExercisesFromMessage,
} from "./workout-analytics";

// Real Firestore exercises use per-user UUID ids and canonical names, so
// resolution is name-based. Fixtures mirror that (UUID-like ids, DB names).
const BENCH_ID = "207069b9-d67e-4e95-96ea-c06fbc985518";
const SQUAT_ID = "22b71b8c-8f35-42b0-82b8-995ee42a30e8";
const DEADLIFT_ID = "667f0473-68d8-4238-8dfa-98159bbf68b7";
const RDL_ID = "e03ff513-6215-49ee-8a21-ffaf70882f26";
const BSS_ID = "de8a5322-c55c-4087-816d-397af317c60f";
const INCLINE_ID = "ea487df3-5092-47af-972f-2f1d6f24fa54";

function makeExercise(id: string, name: string, targetWeight: number) {
  return {
    id,
    name,
    categories: ["push"],
    muscleGroups: [],
    equipment: "barbell",
    type: "compound",
    description: "",
    notes: [],
    tracking: { weight: true, reps: true, effort: true },
    weightTracking: { unit: "kg", mode: "total" },
    progression: { repRange: { min: 5, max: 8 }, strategy: "ascending_weight" },
    currentWeight: null,
    targetWeight,
    active: true,
  };
}

const exercises = [
  makeExercise(BENCH_ID, "Bench Press", 100),
  makeExercise(SQUAT_ID, "Barbell Squat", 150),
  makeExercise(DEADLIFT_ID, "Deadlift", 190),
  makeExercise(RDL_ID, "Romanian Deadlift", 110),
  makeExercise(BSS_ID, "Bulgarian Split Squat", 25),
  makeExercise(INCLINE_ID, "Incline Dumbbell Press", 45),
] as any;

describe("workout exercise resolver", () => {
  it("resolves a bare squat query to the closest name match", () => {
    assert.equal(
      resolveExerciseFromMessage("what is my squat pr", exercises)?.id,
      SQUAT_ID,
    );
    assert.equal(
      resolveExerciseFromMessage("Squad pr", exercises)?.id,
      SQUAT_ID,
    );
  });

  it("resolves a bare deadlift query to Deadlift, not Romanian Deadlift", () => {
    const matches = resolveExercisesFromMessage(
      "what is my deadlift pr",
      exercises,
    ).map((exercise) => exercise.id);
    assert.deepEqual(matches, [DEADLIFT_ID]);
  });

  it("resolves an explicit Romanian deadlift query to Romanian Deadlift", () => {
    const matches = resolveExercisesFromMessage(
      "what is my romanian deadlift pr",
      exercises,
    ).map((exercise) => exercise.id);
    assert.deepEqual(matches, [RDL_ID]);
  });

  it("treats a base-lift qualifier as the conventional lift", () => {
    const matches = resolveExercisesFromMessage(
      "what is my conventional deadlift pr",
      exercises,
    ).map((exercise) => exercise.id);
    assert.deepEqual(matches, [DEADLIFT_ID]);
  });

  it("resolves incline bench press to the incline variant, not flat bench", () => {
    assert.equal(
      resolveExerciseFromMessage("what is my incline bench press pr", exercises)
        ?.id,
      INCLINE_ID,
    );
    assert.equal(
      resolveExerciseFromMessage("inclined bench press pr", exercises)?.id,
      INCLINE_ID,
    );
  });

  it("expands gym slang (dl) to Deadlift", () => {
    const matches = resolveExercisesFromMessage("what's my dl?", exercises).map(
      (exercise) => exercise.id,
    );
    assert.deepEqual(matches, [DEADLIFT_ID]);
  });

  it("finds multiple lifts without variant contamination", () => {
    const matches = resolveExercisesFromMessage(
      "What are my bench, squat and deadlift PRs?",
      exercises,
    );

    assert.deepEqual(
      matches.map((exercise) => exercise.id).sort(),
      [BENCH_ID, SQUAT_ID, DEADLIFT_ID].sort(),
    );
  });

  it("routes all-exercise target completion ranking questions to the target-progress resolver", () => {
    assert.equal(
      parseDeterministicIntent(
        "Check for all the exercises done till now. Give me top 5 exercises where I have the highest percentage of target completion and 5 exercises with lowest.",
      ),
      "workout_target_progress",
    );
  });

  it("routes remaining not-done exercise questions to the remaining-exercises resolver", () => {
    assert.equal(
      parseDeterministicIntent(
        "what are the remaining exercises i havent done yet.",
      ),
      "workout_remaining_exercises",
    );
  });

  it("routes weekly weight-training cycle questions to the cycle resolver", () => {
    assert.equal(
      parseDeterministicIntent(
        "If we consider Monday-Sunday as a full week, how many cycles of weight training have I done till 23rd august",
      ),
      "goal_weight_training_cycles",
    );
  });

  it("computes session metrics by exact exercise id", () => {
    const workout = {
      id: "today-squat",
      date: "2026-08-26",
      combinationIds: [],
      exercises: [
        {
          exerciseId: SQUAT_ID,
          sets: [{ weight: 120, reps: 5, effort: 5, isWarmup: false }],
        },
        {
          exerciseId: BSS_ID,
          sets: [{ weight: 40, reps: 8, effort: 4, isWarmup: false }],
        },
      ],
    } as any;

    const metrics = buildSessionMetrics([workout], {
      kind: "exercise",
      label: "Barbell Squat",
      exerciseIds: [SQUAT_ID],
      exercise: exercises[1],
    });

    assert.equal(metrics.length, 1);
    assert.equal(metrics[0].topWeight, 120);
    assert.equal(metrics[0].totalSets, 1);
  });

  it("routes PR wording variants and top-lift questions to the best-performance resolver", () => {
    assert.equal(
      parseDeterministicIntent("What are my bench, squat and deadlift PRs?"),
      "workout_best_performance",
    );
    assert.equal(
      parseDeterministicIntent("What are my top three lifts by weight?"),
      "workout_best_performance",
    );
    assert.equal(
      parseDeterministicIntent("What about barbell squats?"),
      "workout_best_performance",
    );
    assert.equal(
      parseDeterministicIntent("barbell squat?"),
      "workout_best_performance",
    );
    assert.equal(
      parseDeterministicIntent("what is my squat pr?"),
      "workout_best_performance",
    );
  });

  it("routes bodyweight relative-strength PR questions to the best-performance resolver", () => {
    const message =
      "From the visualisations check my Deadlift, Bench press and squat PR. Let me know if they are good enough for my body weight 83.5kg?";
    assert.equal(parseDeterministicIntent(message), "workout_best_performance");

    const followupMessage = "Are they good for my body weight?";
    assert.equal(
      parseDeterministicIntent(followupMessage),
      "workout_best_performance",
    );
  });
});
