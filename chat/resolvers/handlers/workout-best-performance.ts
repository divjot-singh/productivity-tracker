import type { DeterministicResolver } from "../types";
import {
  buildSessionMetrics,
  buildWorkoutEvidence,
  filterWorkoutsByDateRange,
  formatSessionTable,
  resolveExerciseFromMessage,
} from "@/chat/workout-analytics";

export const createWorkoutBestPerformanceResolver =
  (): DeterministicResolver => {
    return (context) => {
      const exercise = resolveExerciseFromMessage(
        context.message,
        context.exercises,
      );

      if (!exercise) {
        return {
          clarificationQuestion:
            "Which exercise should I check for your best or heaviest performance?",
          followUpRequired: true,
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

      return {
        answer: [
          `## Best ${exercise.name} Session`,
          `Your heaviest recorded ${exercise.name.toLowerCase()} top weight in this period was **${best.topWeight} kg** on **${best.date}**.`,
          `- **Session volume:** ${Math.round(best.volume)}`,
          `- **Total sets:** ${best.totalSets}`,
          `- **Average effort:** ${best.averageEffort ?? "n/a"}`,
          "| # | Date | Top Weight (kg) | Volume | Sets | Avg Effort |",
          "| --- | --- | ---: | ---: | ---: | ---: |",
          ...formatSessionTable(sessions),
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
