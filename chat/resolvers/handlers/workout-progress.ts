import type { DeterministicResolver } from "../types";
import {
  buildSessionMetrics,
  buildWorkoutEvidence,
  filterWorkoutsByDateRange,
  formatSessionTable,
  resolveExerciseFromMessage,
} from "@/chat/workout-analytics";

export const createWorkoutProgressResolver = (): DeterministicResolver => {
  return (context) => {
    const exercise = resolveExerciseFromMessage(
      context.message,
      context.exercises,
    );

    if (!exercise) {
      return {
        clarificationQuestion:
          "Which exercise do you want progress for? For example: deadlift, bench press, or squat.",
        followUpRequired: true,
      };
    }

    const workouts = filterWorkoutsByDateRange(
      context.workouts,
      context.dateFrom,
      context.dateTo,
    );
    const sessions = buildSessionMetrics(workouts, {
      kind: "exercise",
      label: exercise.name,
      exerciseIds: [exercise.id],
      exercise,
    });

    if (sessions.length === 0) {
      return {
        refusalReason: `No ${exercise.name} sessions found between ${context.dateFrom} and ${context.dateTo}.`,
      };
    }

    const first = sessions[0];
    const latest = sessions.at(-1)!;
    const best = sessions.reduce((currentBest, session) =>
      session.topWeight > currentBest.topWeight ? session : currentBest,
    );
    const topWeightDelta = latest.topWeight - first.topWeight;
    const trendLabel =
      topWeightDelta > 0
        ? `up ${topWeightDelta} kg`
        : topWeightDelta < 0
          ? `down ${Math.abs(topWeightDelta)} kg`
          : "flat";

    return {
      answer: [
        `## ${exercise.name} Progress`,
        `From **${context.dateFrom}** to **${context.dateTo}**, I found **${sessions.length}** session${sessions.length === 1 ? "" : "s"}.`,
        `- **Best top weight:** ${best.topWeight} kg on ${best.date}`,
        `- **Latest top weight:** ${latest.topWeight} kg on ${latest.date}`,
        `- **Progress trend:** ${trendLabel}`,
        `- **Total volume in period:** ${Math.round(sessions.reduce((sum, session) => sum + session.volume, 0))}`,
        "| # | Date | Top Weight (kg) | Volume | Sets | Avg Effort |",
        "| --- | --- | ---: | ---: | ---: | ---: |",
        ...formatSessionTable(sessions),
      ].join("\n"),
      evidence: buildWorkoutEvidence(
        context.userId,
        sessions,
        {
          kind: "exercise",
          label: exercise.name,
          exerciseIds: [exercise.id],
          exercise,
        },
        context.exercises,
        context.combinations,
      ),
      confidence: "high",
    };
  };
};
