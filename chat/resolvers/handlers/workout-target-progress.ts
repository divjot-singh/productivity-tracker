import type { DeterministicResolver } from "../types";
import {
  buildSessionMetrics,
  buildWorkoutEvidence,
  filterWorkoutsByDateRange,
  resolveExerciseFromMessage,
} from "@/chat/workout-analytics";

export const createWorkoutTargetProgressResolver =
  (): DeterministicResolver => {
    return (context) => {
      const exercise = resolveExerciseFromMessage(
        context.message,
        context.exercises,
      );

      if (!exercise) {
        return {
          clarificationQuestion: "Which exercise target do you want to check?",
          followUpRequired: true,
        };
      }

      if (
        exercise.targetWeight === null ||
        exercise.targetWeight === undefined
      ) {
        return {
          refusalReason: `No target weight is set for ${exercise.name}.`,
        };
      }

      const workouts = filterWorkoutsByDateRange(
        context.workouts,
        context.dateFrom,
        context.dateTo,
      );
      const subject = {
        kind: "exercise" as const,
        label: exercise.name,
        exerciseIds: [exercise.id],
        exercise,
      };
      const sessions = buildSessionMetrics(workouts, subject);

      if (sessions.length === 0) {
        return {
          refusalReason: `No ${exercise.name} sessions found between ${context.dateFrom} and ${context.dateTo}.`,
        };
      }

      const best = sessions.reduce((currentBest, session) =>
        session.topWeight > currentBest.topWeight ? session : currentBest,
      );
      const remaining = Math.max(0, exercise.targetWeight - best.topWeight);
      const progress = Math.min(
        100,
        Math.round((best.topWeight / exercise.targetWeight) * 100),
      );

      return {
        answer: [
          `## ${exercise.name} Target Progress`,
          `Your target for **${exercise.name}** is **${exercise.targetWeight} kg**.`,
          `- **Best recorded top weight:** ${best.topWeight} kg on ${best.date}`,
          `- **Progress toward target:** ${progress}%`,
          `- **Remaining gap:** ${remaining} kg`,
        ].join("\n"),
        evidence: buildWorkoutEvidence(
          context.userId,
          sessions,
          subject,
          context.exercises,
          context.combinations,
        ),
        confidence: "high",
      };
    };
  };
