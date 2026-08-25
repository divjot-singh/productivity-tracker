import { parseExerciseVisualizationKey } from "@/lib/visualizations/exercise-keys";
import { ExerciseHistoryData, VisualizationProvider } from "./provider-types";

function getWorkoutVolumeValue(workout: {
  exercises: Array<{
    sets: Array<{
      weight: number | null;
      reps: number | null;
    }>;
  }>;
}) {
  return workout.exercises.reduce(
    (exerciseSum, exerciseEntry) =>
      exerciseSum +
      exerciseEntry.sets.reduce((setSum, setEntry) => {
        if (setEntry.weight === null || setEntry.reps === null) {
          return setSum;
        }

        return setSum + setEntry.weight * setEntry.reps;
      }, 0),
    0,
  );
}

function getWorkoutAverageEffortValue(workout: {
  exercises: Array<{
    sets: Array<{
      effort: number | null;
    }>;
  }>;
}) {
  let effortCount = 0;

  const totalEffort = workout.exercises.reduce(
    (exerciseSum, exerciseEntry) =>
      exerciseSum +
      exerciseEntry.sets.reduce((setSum, setEntry) => {
        if (setEntry.effort === null) {
          return setSum;
        }

        effortCount += 1;
        return setSum + setEntry.effort;
      }, 0),
    0,
  );

  if (effortCount === 0) {
    return 0;
  }

  return Number((totalEffort / effortCount).toFixed(1));
}

export const exerciseProvider: VisualizationProvider<ExerciseHistoryData> = {
  async getData({ visualization, exercises, workouts, combinations }) {
    const parsedKey = parseExerciseVisualizationKey(visualization.key);

    if (!parsedKey) {
      throw new Error(`Invalid exercise key '${visualization.key}'.`);
    }

    if (parsedKey.entityType === "workout") {
      const values = workouts
        .map((workout) => ({
          date: workout.date,
          value:
            parsedKey.metric === "averageEffort"
              ? getWorkoutAverageEffortValue(workout)
              : getWorkoutVolumeValue(workout),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        id: "workout",
        label:
          parsedKey.metric === "averageEffort"
            ? "Workout average effort"
            : "Workout volume",
        metric: parsedKey.metric,
        target: undefined,
        valueKind: "number",
        unit: parsedKey.metric === "averageEffort" ? undefined : "kg",
        values,
      };
    }

    if (parsedKey.entityType === "exercise") {
      const exercise = exercises.find((item) => item.id === parsedKey.entityId);

      if (!exercise) {
        throw new Error(`Exercise '${parsedKey.entityId}' not found.`);
      }

      const values = workouts
        .map((workout) => {
          const workoutExercise = workout.exercises.find(
            (item) => item.exerciseId === parsedKey.entityId,
          );

          if (!workoutExercise) {
            return null;
          }

          if (parsedKey.metric === "topWeight") {
            const value = workoutExercise.sets.reduce((max, setEntry) => {
              if (setEntry.weight === null) {
                return max;
              }

              return Math.max(max, setEntry.weight);
            }, 0);

            return {
              date: workout.date,
              value,
            };
          }

          if (parsedKey.metric === "reps") {
            const value = workoutExercise.sets.reduce((sum, setEntry) => {
              if (setEntry.reps === null) {
                return sum;
              }

              return sum + setEntry.reps;
            }, 0);

            return {
              date: workout.date,
              value,
            };
          }

          if (parsedKey.metric === "sets") {
            return {
              date: workout.date,
              value: workoutExercise.sets.length,
            };
          }

          const value = workoutExercise.sets.reduce((sum, setEntry) => {
            if (setEntry.weight === null || setEntry.reps === null) {
              return sum;
            }

            return sum + setEntry.weight * setEntry.reps;
          }, 0);

          return {
            date: workout.date,
            value,
          };
        })
        .filter(
          (
            item,
          ): item is {
            date: string;
            value: number;
          } => item !== null,
        )
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        id: exercise.id,
        label: exercise.name,
        metric: parsedKey.metric,
        target:
          parsedKey.metric === "topWeight" ? exercise.targetWeight : undefined,
        valueKind: "number",
        unit:
          parsedKey.metric === "topWeight"
            ? exercise.weightTracking.unit
            : undefined,
        values,
      };
    }

    const combination = combinations.find(
      (item) => item.id === parsedKey.entityId,
    );

    if (!combination) {
      throw new Error(`Combination '${parsedKey.entityId}' not found.`);
    }

    const exerciseIdSet = new Set(combination.exerciseIds);

    const values = workouts
      .map((workout) => {
        const relevantExercises = workout.exercises.filter((exercise) =>
          exerciseIdSet.has(exercise.exerciseId),
        );

        if (relevantExercises.length === 0) {
          return null;
        }

        if (parsedKey.metric === "topWeight") {
          const value = relevantExercises.reduce(
            (exerciseMax, exerciseEntry) =>
              Math.max(
                exerciseMax,
                exerciseEntry.sets.reduce((setMax, setEntry) => {
                  if (setEntry.weight === null) {
                    return setMax;
                  }

                  return Math.max(setMax, setEntry.weight);
                }, 0),
              ),
            0,
          );

          return {
            date: workout.date,
            value,
          };
        }

        if (parsedKey.metric === "reps") {
          const value = relevantExercises.reduce(
            (exerciseSum, exerciseEntry) =>
              exerciseSum +
              exerciseEntry.sets.reduce((setSum, setEntry) => {
                if (setEntry.reps === null) {
                  return setSum;
                }

                return setSum + setEntry.reps;
              }, 0),
            0,
          );

          return {
            date: workout.date,
            value,
          };
        }

        if (parsedKey.metric === "sets") {
          const value = relevantExercises.reduce(
            (exerciseSum, exerciseEntry) =>
              exerciseSum + exerciseEntry.sets.length,
            0,
          );

          return {
            date: workout.date,
            value,
          };
        }

        const value = relevantExercises.reduce(
          (exerciseSum, exerciseEntry) =>
            exerciseSum +
            exerciseEntry.sets.reduce((setSum, setEntry) => {
              if (setEntry.weight === null || setEntry.reps === null) {
                return setSum;
              }

              return setSum + setEntry.weight * setEntry.reps;
            }, 0),
          0,
        );

        return {
          date: workout.date,
          value,
        };
      })
      .filter(
        (
          item,
        ): item is {
          date: string;
          value: number;
        } => item !== null,
      )
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      id: combination.id,
      label: combination.name,
      metric: parsedKey.metric,
      target: undefined,
      valueKind: "number",
      unit: undefined,
      values,
    };
  },
};
