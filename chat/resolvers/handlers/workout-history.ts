import type { DeterministicResolver } from "../types";
import {
  buildSessionMetrics,
  buildWorkoutEvidence,
  filterWorkoutsByDateRange,
  resolveWorkoutSubject,
} from "@/chat/workout-analytics";

export const createWorkoutHistoryResolver = (): DeterministicResolver => {
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
        refusalReason: `No ${subject.label.toLowerCase()} workout history found between ${context.dateFrom} and ${context.dateTo}.`,
      };
    }

    const latest = sessions.at(-1)!;

    if (/\bwhen did i last|last time\b/i.test(context.message)) {
      return {
        answer: [
          `## Last ${subject.label} Session`,
          `You last trained **${subject.label}** on **${latest.date}**.`,
          `- **Top weight:** ${latest.topWeight} kg`,
          `- **Volume:** ${Math.round(latest.volume)}`,
          `- **Average effort:** ${latest.averageEffort ?? "n/a"}`,
        ].join("\n"),
        evidence: buildWorkoutEvidence(
          context.userId,
          [latest],
          subject,
          context.exercises,
          context.combinations,
          1,
        ),
        confidence: "high",
      };
    }

    if (/\bhow many times|times did i train\b/i.test(context.message)) {
      return {
        answer: [
          `## ${subject.label} Training Count`,
          `You trained **${subject.label}** **${sessions.length}** time${sessions.length === 1 ? "" : "s"} between **${context.dateFrom}** and **${context.dateTo}**.`,
          `- **Most recent session:** ${latest.date}`,
          `- **Average volume per session:** ${Math.round(sessions.reduce((sum, session) => sum + session.volume, 0) / sessions.length)}`,
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

    const rows = [...sessions]
      .sort((left, right) => right.date.localeCompare(left.date))
      .slice(0, 8)
      .map(
        (session, index) =>
          `| ${index + 1} | ${session.date} | ${session.topWeight} | ${Math.round(session.volume)} | ${session.totalSets} | ${session.averageEffort ?? "n/a"} |`,
      );

    return {
      answer: [
        `## ${subject.label} Workout History`,
        `I found **${sessions.length}** matching session${sessions.length === 1 ? "" : "s"} between **${context.dateFrom}** and **${context.dateTo}**.`,
        "| # | Date | Top Weight (kg) | Volume | Sets | Avg Effort |",
        "| --- | --- | ---: | ---: | ---: | ---: |",
        ...rows,
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
