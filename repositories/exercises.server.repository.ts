import { adminDb } from "@/lib/firebase-admin";
import { removeUndefinedDeep } from "@/lib/firestore/sanitize";
import { ExerciseDefinition } from "@/models/workout";
import { FieldValue } from "firebase-admin/firestore";

function getExerciseRef(uid: string, exerciseId: string) {
  return adminDb
    .collection("users")
    .doc(uid)
    .collection("exercises")
    .doc(exerciseId);
}

export async function createExercise(
  uid: string,
  exercise: ExerciseDefinition,
): Promise<ExerciseDefinition> {
  const ref = getExerciseRef(uid, exercise.id);

  await ref.set(
    removeUndefinedDeep({
      ...exercise,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    {
      merge: false,
    },
  );

  return exercise;
}

export async function getExercise(
  uid: string,
  exerciseId: string,
): Promise<ExerciseDefinition | null> {
  const snapshot = await getExerciseRef(uid, exerciseId).get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    ...(snapshot.data() as ExerciseDefinition),
    id: snapshot.id,
  };
}

export async function getExercises(
  uid: string,
  options?: {
    includeInactive?: boolean;
  },
): Promise<ExerciseDefinition[]> {
  let query = adminDb
    .collection("users")
    .doc(uid)
    .collection("exercises")
    .orderBy("name", "asc");

  if (!options?.includeInactive) {
    query = query.where("active", "==", true);
  }

  const snapshot = await query.get();

  return snapshot.docs.map((doc) => ({
    ...(doc.data() as ExerciseDefinition),
    id: doc.id,
  }));
}

export async function hasAnyExercises(uid: string): Promise<boolean> {
  const snapshot = await adminDb
    .collection("users")
    .doc(uid)
    .collection("exercises")
    .limit(1)
    .get();

  return !snapshot.empty;
}

export async function updateExercise(
  uid: string,
  exercise: ExerciseDefinition,
): Promise<ExerciseDefinition> {
  const ref = getExerciseRef(uid, exercise.id);

  const payload = removeUndefinedDeep({
    ...exercise,
    updatedAt: new Date(),
  });

  await ref.set(
    {
      ...payload,
      equipment: FieldValue.delete(),
    },
    {
      merge: true,
    },
  );

  return exercise;
}

export async function deactivateExercise(uid: string, exerciseId: string) {
  const ref = getExerciseRef(uid, exerciseId);

  await ref.set(
    {
      active: false,
      updatedAt: new Date(),
    },
    {
      merge: true,
    },
  );
}

export async function deleteExercise(uid: string, exerciseId: string) {
  const ref = getExerciseRef(uid, exerciseId);

  await ref.delete();
}

export async function exerciseExists(uid: string, exerciseId: string) {
  const snapshot = await getExerciseRef(uid, exerciseId).get();
  return snapshot.exists;
}
