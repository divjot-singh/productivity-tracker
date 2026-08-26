import type { DeterministicResolver } from "../types";
import {
  buildSessionMetrics,
  buildWorkoutEvidence,
  filterWorkoutsByDateRange,
  resolveExerciseFromMessage,
} from "@/chat/workout-analytics";

function parseTopN(message: string, fallback = 5): number {
  const lower = message.toLowerCase();
  const directMatch = lower.match(
    /\b(?:top|highest|best|lowest|bottom)\s+(\d+)\b/,
  );
  if (directMatch) {
    const parsed = Number(directMatch[1]);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.min(parsed, 10);
    }
  }

  const trailingMatch = lower.match(
    /(\d+)\s+(?:exercise|exercises).*?(?:with\s+)?(?:lowest|highest|best|top|bottom)/,
  );
  if (trailingMatch) {
    const parsed = Number(trailingMatch[1]);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.min(parsed, 10);
    }
  }

  return fallback;
}

export const createWorkoutTargetProgressResolver =
  (): DeterministicResolver => {
    return (context) => {
      const text = context.message.toLowerCase();
      const wantsAllExercises =
        (/\b(all|every)\b/.test(text) ||
          /\b(top|highest|lowest|bottom|closest|farthest|furthest|nearest|rank|ranking)\b/.test(
            text,
          )) &&
        (/\b(exercise|exercises)\b/.test(text) ||
          /\b(target|targets|completion|progress)\b/.test(text));
      const requestedTopN = parseTopN(context.message, 5);
      const exercise = resolveExerciseFromMessage(
        context.message,
        context.exercises,
      );

      if (!exercise && !wantsAllExercises) {
        return {
          clarificationQuestion: "Which exercise target do you want to check?",
          followUpRequired: true,
        };
      }

      const workouts = filterWorkoutsByDateRange(
        context.workouts,
        context.dateFrom,
        context.dateTo,
      );

      if (!exercise) {
        const rankedExercises = context.exercises
          .map((candidate) => {
            if (
              candidate.targetWeight === null ||
              candidate.targetWeight === undefined
            ) {
              return null;
            }

            const subject = {
              kind: "exercise" as const,
              label: candidate.name,
              exerciseIds: [candidate.id],
              exercise: candidate,
            };
            const sessions = buildSessionMetrics(workouts, subject);

            if (sessions.length === 0) {
              return null;
            }

            const best = sessions.reduce((currentBest, session) =>
              session.topWeight > currentBest.topWeight ? session : currentBest,
            );
            const progress = Math.min(
              100,
              Math.round((best.topWeight / candidate.targetWeight) * 100),
            );

            return {
              exercise: candidate,
              bestTopWeight: best.topWeight,
              progress,
              remaining: Math.max(0, candidate.targetWeight - best.topWeight),
              sessions,
              subject,
            };
          })
          .filter((item): item is NonNullable<typeof item> => item !== null)
          .sort((left, right) => right.progress - left.progress);

        if (rankedExercises.length === 0) {
          return {
            refusalReason:
              "No exercise target data is available for the selected period.",
          };
        }

        const topRanked = rankedExercises.slice(0, requestedTopN);
        const lowestRanked = [...rankedExercises]
          .sort((left, right) => left.progress - right.progress)
          .slice(0, requestedTopN);

        const formatRows = (items: typeof topRanked) =>
          items
            .map((item, index) => {
              return `| ${index + 1} | ${item.exercise.name} | ${item.progress}% | ${item.bestTopWeight} kg / ${item.exercise.targetWeight} kg | ${item.remaining} kg left |`;
            })
            .join("\n");

        return {
          answer: [
            "## Exercise Target Completion Ranking",
            `### Top ${requestedTopN} by target completion`,
            "| Rank | Exercise | Target Completion | Best Weight | Remaining |",
            "| --- | --- | ---: | ---: | ---: |",
            formatRows(topRanked),
            "",
            `### Bottom ${requestedTopN} by target completion`,
            "| Rank | Exercise | Target Completion | Best Weight | Remaining |",
            "| --- | --- | ---: | ---: | ---: |",
            formatRows(lowestRanked),
          ].join("\n"),
          evidence: rankedExercises.flatMap((item) =>
            buildWorkoutEvidence(
              context.userId,
              item.sessions,
              item.subject,
              context.exercises,
              context.combinations,
            ),
          ),
          confidence: "high",
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
