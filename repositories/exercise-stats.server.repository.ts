import { adminDb } from "@/lib/firebase-admin";
import { removeUndefinedDeep } from "@/lib/firestore/sanitize";
import type { ExerciseStats } from "@/lib/workouts/exercise-stats";

function statsCollection(uid: string) {
  return adminDb.collection("users").doc(uid).collection("exerciseStats");
}

export async function getExerciseStats(
  uid: string,
  exerciseId: string,
): Promise<ExerciseStats | null> {
  const snapshot = await statsCollection(uid).doc(exerciseId).get();

  return snapshot.exists ? (snapshot.data() as ExerciseStats) : null;
}

export async function getAllExerciseStats(uid: string): Promise<ExerciseStats[]> {
  const snapshot = await statsCollection(uid).get();

  return snapshot.docs.map((doc) => ({
    ...(doc.data() as ExerciseStats),
    exerciseId: doc.id,
  }));
}

export async function saveExerciseStats(uid: string, stats: ExerciseStats) {
  await statsCollection(uid)
    .doc(stats.exerciseId)
    .set(removeUndefinedDeep({ ...stats, updatedAt: new Date() }));
}

export async function deleteExerciseStats(uid: string, exerciseId: string) {
  await statsCollection(uid).doc(exerciseId).delete();
}
