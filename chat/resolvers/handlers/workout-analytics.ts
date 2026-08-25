import type { DeterministicResolver } from "../types";
import {
  average,
  buildSessionMetrics,
  buildWorkoutEvidence,
  filterWorkoutsByDateRange,
  formatSessionTable,
  resolveWorkoutSubject,
} from "@/chat/workout-analytics";

export const createWorkoutAnalyticsResolver = (): DeterministicResolver => {
  return (context) => {
    const subject = resolveWorkoutSubject(
      context.message,
      context.exercises,
      context.combinations,
    );
    const workouts = filterWorkoutsByDateRange(
      context.workouts,
      context.dateFrom,
      context.dateTo,
    );
    const sessions = buildSessionMetrics(workouts, subject);

    if (sessions.length === 0) {
      return {
        refusalReason: `No ${subject.label.toLowerCase()} workout data found between ${context.dateFrom} and ${context.dateTo}.`,
      };
    }

    const isEffortQuestion = /\beffort\b/i.test(context.message);

    if (isEffortQuestion) {
      const averageEfforts = sessions
        .map((session) => session.averageEffort)
        .filter((value): value is number => value !== null);

      if (averageEfforts.length === 0) {
        return {
          refusalReason: `No effort data found for ${subject.label.toLowerCase()} between ${context.dateFrom} and ${context.dateTo}.`,
        };
      }

      return {
        answer: [
          `## ${subject.label} Effort`,
          `From **${context.dateFrom}** to **${context.dateTo}**, the average effort across **${sessions.length}** session${sessions.length === 1 ? "" : "s"} was **${average(averageEfforts).toFixed(1)}**.`,
          `- **Highest session average effort:** ${Math.max(...averageEfforts).toFixed(1)}`,
          `- **Latest session average effort:** ${(sessions.at(-1)?.averageEffort ?? 0).toFixed(1)}`,
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
    }

    const totalVolume = Math.round(
      sessions.reduce((sum, session) => sum + session.volume, 0),
    );
    const bestVolumeSession = sessions.reduce((currentBest, session) =>
      session.volume > currentBest.volume ? session : currentBest,
    );

    return {
      answer: [
        `## ${subject.label} Volume`,
        `From **${context.dateFrom}** to **${context.dateTo}**, total volume was **${totalVolume}** across **${sessions.length}** session${sessions.length === 1 ? "" : "s"}.`,
        `- **Average volume per session:** ${Math.round(totalVolume / sessions.length)}`,
        `- **Highest volume session:** ${Math.round(bestVolumeSession.volume)} on ${bestVolumeSession.date}`,
        `- **Total reps:** ${sessions.reduce((sum, session) => sum + session.totalReps, 0)}`,
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
