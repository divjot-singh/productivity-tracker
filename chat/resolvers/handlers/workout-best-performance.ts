import type { DeterministicResolver } from "../types";
import {
  buildSessionMetrics,
  buildWorkoutEvidence,
  filterWorkoutsByDateRange,
  formatSessionTable,
  resolveExerciseFromMessage,
  resolveExercisesFromMessage,
} from "@/chat/workout-analytics";

function parseBodyweightKg(message: string): number | null {
  const match = message.match(
    /(\d+(?:\.\d+)?)\s*(kg|kilograms|kilos|lb|lbs|pounds)?/i,
  );

  if (!match) {
    return null;
  }

  const value = Number(match[1]);
  const unit = (match[2] || "kg").toLowerCase();

  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  if (unit === "lb" || unit === "lbs" || unit === "pounds") {
    return value * 0.45359237;
  }

  return value;
}

function scoreRelativeStrength(ratio: number): string {
  if (ratio >= 2.2) return "Excellent";
  if (ratio >= 1.8) return "Very good";
  if (ratio >= 1.5) return "Good";
  if (ratio >= 1.2) return "Solid";
  if (ratio >= 1.0) return "Decent";
  return "Needs more work";
}

const WORD_NUMBERS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

function detectTopLiftsRanking(message: string): number | null {
  const text = message.toLowerCase();
  const asksForRanking =
    /\b(top|heaviest|strongest|biggest|highest)\b/.test(text) &&
    /\b(lift|lifts|exercise|exercises|weight|weights)\b/.test(text);

  if (!asksForRanking) {
    return null;
  }

  const numericMatch = text.match(
    /\b(?:top|heaviest|strongest|biggest|highest)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/,
  );

  if (numericMatch) {
    const raw = numericMatch[1];
    const parsed = Number.isNaN(Number(raw)) ? WORD_NUMBERS[raw] : Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.min(parsed, 10);
    }
  }

  return 3;
}

interface PrSet {
  weight: number;
  reps: number | null;
  effort: number | null;
  isWarmup: boolean;
}

function findPrSet(
  session: ReturnType<typeof buildSessionMetrics>[number],
): PrSet | null {
  let prSet: PrSet | null = null;

  for (const entry of session.entries) {
    for (const set of entry.sets) {
      if (set.weight === null) {
        continue;
      }

      const isBetter =
        prSet === null ||
        set.weight > prSet.weight ||
        (set.weight === prSet.weight && (set.reps ?? 0) > (prSet.reps ?? 0));

      if (isBetter) {
        prSet = {
          weight: set.weight,
          reps: set.reps,
          effort: set.effort,
          isWarmup: set.isWarmup,
        };
      }
    }
  }

  return prSet;
}

export const createWorkoutBestPerformanceResolver =
  (): DeterministicResolver => {
    return (context) => {
      const requestedExercises = resolveExercisesFromMessage(
        context.message,
        context.exercises,
      );
      const primaryExercise = resolveExerciseFromMessage(
        context.message,
        context.exercises,
      );
      const bodyWeightKg = parseBodyweightKg(context.message);
      const asksAboutBodyweight =
        /\b(body weight|bodyweight|bw|relative strength|good enough|good for my weight|good for my body weight|are they good|are they strong enough|are they good enough)\b/.test(
          context.message.toLowerCase(),
        ) ||
        /\b(good enough|enough for my body weight|relative strength|are they good|are they strong enough|are they good enough)\b/.test(
          context.message.toLowerCase(),
        );

      const workouts = filterWorkoutsByDateRange(
        context.workouts,
        context.dateFrom,
        context.dateTo,
      );

      if (!primaryExercise && requestedExercises.length === 0) {
        const topLiftsCount = detectTopLiftsRanking(context.message);
        if (topLiftsCount && !asksAboutBodyweight) {
          const rankedLifts = context.exercises
            .map((exercise) => {
              const subject = {
                kind: "exercise" as const,
                label: exercise.name,
                exerciseIds: [exercise.id],
                exercise,
              };
              const sessions = buildSessionMetrics(workouts, subject);
              if (sessions.length === 0) {
                return null;
              }

              const best = sessions.reduce((currentBest, session) =>
                session.topWeight > currentBest.topWeight
                  ? session
                  : currentBest,
              );

              return { exercise, best, sessions, subject };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null)
            .sort((left, right) => right.best.topWeight - left.best.topWeight);

          if (rankedLifts.length === 0) {
            return {
              refusalReason: `No matching workout sessions were found between ${context.dateFrom} and ${context.dateTo}.`,
            };
          }

          const topLifts = rankedLifts.slice(0, topLiftsCount);
          const liftRows = topLifts
            .map(
              ({ exercise, best }, index) =>
                `| ${index + 1} | ${exercise.name} | ${best.topWeight} kg | ${best.date} |`,
            )
            .join("\n");

          return {
            answer: [
              `## Top ${topLifts.length} Lifts by Weight`,
              "| Rank | Exercise | Top Weight | Date |",
              "| --- | --- | ---: | --- |",
              liftRows,
            ].join("\n"),
            evidence: topLifts.flatMap(({ sessions, subject }) =>
              buildWorkoutEvidence(
                context.userId,
                sessions,
                subject,
                context.exercises,
                context.combinations,
              ),
            ),
            confidence: "high",
          };
        }

        if (asksAboutBodyweight && bodyWeightKg) {
          const allExercisesWithWorkouts = context.exercises
            .map((exercise) => {
              const subject = {
                kind: "exercise" as const,
                label: exercise.name,
                exerciseIds: [exercise.id],
                exercise,
              };
              const sessions = buildSessionMetrics(workouts, subject);
              if (sessions.length === 0) {
                return null;
              }

              const best = sessions.reduce((currentBest, session) =>
                session.topWeight > currentBest.topWeight
                  ? session
                  : currentBest,
              );

              return { exercise, best, sessions, subject };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);

          if (allExercisesWithWorkouts.length === 0) {
            return {
              refusalReason:
                "Insufficient evidence to answer your bodyweight strength question.",
            };
          }

          const relativeRows = allExercisesWithWorkouts
            .map(({ exercise, best }) => {
              const ratio = best.topWeight / bodyWeightKg;
              return `| ${exercise.name} | ${best.topWeight} kg | ${ratio.toFixed(2)}x BW | ${scoreRelativeStrength(ratio)} |`;
            })
            .join("\n");

          return {
            answer: [
              "## Relative strength vs body weight",
              `Using a bodyweight of **${bodyWeightKg.toFixed(1)} kg**:`,
              "| Lift | PR | Relative to BW | Assessment |",
              "| --- | ---: | ---: | --- |",
              relativeRows,
            ].join("\n"),
            evidence: allExercisesWithWorkouts.flatMap(
              ({ sessions, subject }) =>
                buildWorkoutEvidence(
                  context.userId,
                  sessions,
                  subject,
                  context.exercises,
                  context.combinations,
                ),
            ),
            confidence: "high",
          };
        }

        return {
          clarificationQuestion:
            "Which exercise should I check for your best or heaviest performance?",
          followUpRequired: true,
        };
      }

      const exercisesToReport =
        requestedExercises.length > 0
          ? requestedExercises
          : primaryExercise
            ? [primaryExercise]
            : [];

      const sections = exercisesToReport
        .map((exercise) => {
          const subject = {
            kind: "exercise" as const,
            label: exercise.name,
            exerciseIds: [exercise.id],
            exercise,
          };
          const sessions = buildSessionMetrics(workouts, subject);

          if (sessions.length === 0) {
            return null;
          }

          const best = sessions.reduce((currentBest, session) =>
            session.topWeight > currentBest.topWeight ? session : currentBest,
          );

          return {
            exercise,
            best,
            sessions,
            subject,
          };
        })
        .filter(
          (value): value is NonNullable<typeof value> => value !== null,
        ) as Array<{
        exercise: (typeof context.exercises)[number];
        best: ReturnType<typeof buildSessionMetrics>[number];
        sessions: ReturnType<typeof buildSessionMetrics>;
        subject: {
          kind: "exercise";
          label: string;
          exerciseIds: string[];
          exercise: (typeof context.exercises)[number];
        };
      }>;

      if (sections.length === 0) {
        return {
          refusalReason: `No matching workout sessions were found between ${context.dateFrom} and ${context.dateTo}.`,
        };
      }

      if (sections.length === 1) {
        const section = sections[0];
        const { exercise, best, sessions, subject } = section;

        if (asksAboutBodyweight && bodyWeightKg) {
          const ratio = best.topWeight / bodyWeightKg;
          return {
            answer: [
              `## ${exercise.name} Relative Strength`,
              `At **${bodyWeightKg.toFixed(1)} kg body weight**, your **${exercise.name}** PR of **${best.topWeight} kg** is a **${ratio.toFixed(2)}x bodyweight** lift.`,
              `- **Assessment:** ${scoreRelativeStrength(ratio)}`,
              `- **Best recorded top weight:** ${best.topWeight} kg on ${best.date}`,
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

        const prSet = findPrSet(best);
        const prSetLines = prSet
          ? [
              "### PR set",
              `- **Weight:** ${prSet.weight} kg`,
              `- **Reps:** ${prSet.reps ?? "n/a"}`,
              `- **Effort:** ${prSet.effort !== null ? `${prSet.effort}/5` : "n/a"}`,
              `- **Warm-up set:** ${prSet.isWarmup ? "Yes" : "No"}`,
            ]
          : [];

        return {
          answer: [
            `## ${exercise.name} PR`,
            `Your **${exercise.name}** PR is **${best.topWeight} kg**, set on **${best.date}**.`,
            ...prSetLines,
            "### Session",
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
      }

      const rows = sections
        .map(({ exercise, best }) => ({
          exercise,
          best,
        }))
        .map(
          ({ exercise, best }) =>
            `- **${exercise.name}:** **${best.topWeight} kg** on **${best.date}**`,
        )
        .join("\n");

      if (asksAboutBodyweight && bodyWeightKg) {
        const relativeRows = sections
          .map(({ exercise, best }) => {
            const ratio = best.topWeight / bodyWeightKg;
            return `| ${exercise.name} | ${best.topWeight} kg | ${ratio.toFixed(2)}x BW | ${scoreRelativeStrength(ratio)} |`;
          })
          .join("\n");

        return {
          answer: [
            "## Relative strength vs body weight",
            `Using a bodyweight of **${bodyWeightKg.toFixed(1)} kg**:`,
            "| Lift | PR | Relative to BW | Assessment |",
            "| --- | ---: | ---: | --- |",
            relativeRows,
          ].join("\n"),
          evidence: sections.flatMap(({ sessions, subject }) =>
            buildWorkoutEvidence(
              context.userId,
              sessions,
              subject,
              context.exercises,
              context.combinations,
            ),
          ),
          confidence: "high",
        };
      }

      return {
        answer: [
          "## Best PRs",
          "Your strongest recorded lifts in this period were:",
          rows,
        ].join("\n"),
        evidence: sections.flatMap(({ sessions, subject }) =>
          buildWorkoutEvidence(
            context.userId,
            sessions,
            subject,
            context.exercises,
            context.combinations,
          ),
        ),
        confidence: "high",
      };
    };
  };
