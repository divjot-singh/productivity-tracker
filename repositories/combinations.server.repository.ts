import { adminDb } from "@/lib/firebase-admin";
import { removeUndefinedDeep } from "@/lib/firestore/sanitize";
import { WorkoutCombination } from "@/models/workout";

function getCombinationRef(uid: string, combinationId: string) {
  return adminDb
    .collection("users")
    .doc(uid)
    .collection("combinations")
    .doc(combinationId);
}

export async function createCombination(
  uid: string,
  combination: WorkoutCombination,
): Promise<WorkoutCombination> {
  const ref = getCombinationRef(uid, combination.id);

  await ref.set(
    removeUndefinedDeep({
      ...combination,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    {
      merge: false,
    },
  );

  return combination;
}

export async function getCombination(
  uid: string,
  combinationId: string,
): Promise<WorkoutCombination | null> {
  const snapshot = await getCombinationRef(uid, combinationId).get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    ...(snapshot.data() as WorkoutCombination),
    id: snapshot.id,
  };
}

export async function getCombinations(
  uid: string,
  options?: {
    includeInactive?: boolean;
  },
): Promise<WorkoutCombination[]> {
  let query = adminDb
    .collection("users")
    .doc(uid)
    .collection("combinations")
    .orderBy("name", "asc");

  if (!options?.includeInactive) {
    query = query.where("active", "==", true);
  }

  const snapshot = await query.get();

  return snapshot.docs.map((doc) => ({
    ...(doc.data() as WorkoutCombination),
    id: doc.id,
  }));
}

export async function hasAnyCombinations(uid: string): Promise<boolean> {
  const snapshot = await adminDb
    .collection("users")
    .doc(uid)
    .collection("combinations")
    .limit(1)
    .get();

  return !snapshot.empty;
}

export async function updateCombination(
  uid: string,
  combination: WorkoutCombination,
): Promise<WorkoutCombination> {
  const ref = getCombinationRef(uid, combination.id);

  await ref.set(
    removeUndefinedDeep({
      ...combination,
      updatedAt: new Date(),
    }),
    {
      merge: true,
    },
  );

  return combination;
}

export async function deactivateCombination(
  uid: string,
  combinationId: string,
) {
  const ref = getCombinationRef(uid, combinationId);

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

export async function deleteCombination(uid: string, combinationId: string) {
  const ref = getCombinationRef(uid, combinationId);

  await ref.delete();
}

export async function combinationExists(uid: string, combinationId: string) {
  const snapshot = await getCombinationRef(uid, combinationId).get();
  return snapshot.exists;
}
