import type { DeterministicResolver } from "../types";
import { filterWorkoutsByDateRange } from "@/chat/workout-analytics";

export const createWorkoutRemainingExercisesResolver =
  (): DeterministicResolver => {
    return (context) => {
      const workoutsInRange = filterWorkoutsByDateRange(
        context.workouts,
        context.dateFrom,
        context.dateTo,
      );

      const doneExerciseIds = new Set<string>();
      for (const workout of workoutsInRange) {
        for (const entry of workout.exercises) {
          doneExerciseIds.add(entry.exerciseId);
        }
      }

      const doneExercises = context.exercises
        .filter((exercise) => doneExerciseIds.has(exercise.id))
        .sort((left, right) => left.name.localeCompare(right.name));

      const remainingExercises = context.exercises
        .filter((exercise) => !doneExerciseIds.has(exercise.id))
        .sort((left, right) => left.name.localeCompare(right.name));

      const evidence = workoutsInRange
        .sort((left, right) => right.date.localeCompare(left.date))
        .slice(0, 8)
        .map((workout) => ({
          id: workout.id || workout.date,
          source: `users/${context.userId}/workouts/${workout.id || workout.date}`,
          timestamp: workout.date,
          snippet: `Workout on ${workout.date} included ${workout.exercises.length} exercise entries.`,
        }));

      if (context.exercises.length === 0) {
        return {
          refusalReason: "No exercise definitions found for your account yet.",
        };
      }

      if (remainingExercises.length === 0) {
        return {
          answer: [
            "## Remaining Exercises",
            `You have already trained all **${context.exercises.length}** tracked exercises between **${context.dateFrom}** and **${context.dateTo}**.`,
            `- **Completed exercises:** ${doneExercises.length}`,
            `- **Remaining exercises:** 0`,
          ].join("\n"),
          evidence,
          confidence: "high",
        };
      }

      return {
        answer: [
          "## Remaining Exercises",
          `Between **${context.dateFrom}** and **${context.dateTo}**, you have not trained **${remainingExercises.length}** out of **${context.exercises.length}** tracked exercises.`,
          `- **Completed exercises:** ${doneExercises.length}`,
          `- **Remaining exercises:** ${remainingExercises.length}`,
          "",
          "### Exercises Not Done Yet",
          ...remainingExercises.map((exercise) => `- ${exercise.name}`),
        ].join("\n"),
        evidence,
        confidence: "high",
      };
    };
  };
