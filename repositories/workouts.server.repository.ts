import { adminDb } from "@/lib/firebase-admin";
import { removeUndefinedDeep } from "@/lib/firestore/sanitize";
import { WorkoutEntry } from "@/models/workout";

function getWorkoutRef(uid: string, date: string) {
  return adminDb.collection("users").doc(uid).collection("workouts").doc(date);
}

export async function getWorkout(
  uid: string,
  date: string,
): Promise<WorkoutEntry | null> {
  const snapshot = await getWorkoutRef(uid, date).get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    ...(snapshot.data() as WorkoutEntry),
    id: snapshot.id,
  };
}

export async function getWorkouts(
  uid: string,
  options?: {
    limit?: number;
  },
): Promise<WorkoutEntry[]> {
  let query = adminDb
    .collection("users")
    .doc(uid)
    .collection("workouts")
    .orderBy("date", "desc");

  if (options?.limit && options.limit > 0) {
    query = query.limit(options.limit);
  }

  const snapshot = await query.get();

  return snapshot.docs.map((doc) => ({
    ...(doc.data() as WorkoutEntry),
    id: doc.id,
  }));
}

export async function getWorkoutsReferencingExercise(
  uid: string,
  exerciseId: string,
): Promise<WorkoutEntry[]> {
  const workouts = await getWorkouts(uid);

  return workouts.filter((workout) =>
    workout.exercises.some((exercise) => exercise.exerciseId === exerciseId),
  );
}

export async function getWorkoutsReferencingCombination(
  uid: string,
  combinationId: string,
): Promise<WorkoutEntry[]> {
  const workouts = await getWorkouts(uid);

  return workouts.filter((workout) =>
    workout.combinationIds.includes(combinationId),
  );
}

export async function upsertWorkout(
  uid: string,
  workout: WorkoutEntry,
): Promise<WorkoutEntry> {
  const ref = getWorkoutRef(uid, workout.date);

  await ref.set(
    removeUndefinedDeep({
      ...workout,
      updatedAt: new Date(),
      createdAt: new Date(),
    }),
    {
      merge: true,
    },
  );

  return workout;
}

export async function deleteWorkout(uid: string, date: string) {
  await getWorkoutRef(uid, date).delete();
}
