// repositories/goals.server.repository.ts

import { adminDb } from "@/lib/firebase-admin";

import { MetricDefinition } from "@/models/metric";

function getGoalRef(uid: string, goalId: string) {
  return adminDb.collection("users").doc(uid).collection("goals").doc(goalId);
}

export async function createGoal(
  uid: string,
  goal: MetricDefinition,
): Promise<MetricDefinition> {
  const ref = getGoalRef(uid, goal.id);

  await ref.set(
    {
      ...goal,

      createdAt: new Date(),

      updatedAt: new Date(),
    },
    {
      merge: false,
    },
  );

  return goal;
}

export async function getGoal(
  uid: string,
  goalId: string,
): Promise<MetricDefinition | null> {
  const ref = getGoalRef(uid, goalId);

  const snapshot = await ref.get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    ...(snapshot.data() as MetricDefinition),
    id: snapshot.id,
  };
}

export async function goalExists(uid: string, goalId: string) {
  const ref = getGoalRef(uid, goalId);

  const snapshot = await ref.get();

  return snapshot.exists;
}

export async function getGoals(uid: string): Promise<MetricDefinition[]> {
  const snapshot = await adminDb
    .collection("users")
    .doc(uid)
    .collection("goals")
    .orderBy("displayOrder", "asc")
    .get();

  return snapshot.docs.map((doc) => ({
    ...(doc.data() as MetricDefinition),
    id: doc.id,
  }));
}

export async function updateGoal(
  uid: string,
  goal: MetricDefinition,
): Promise<MetricDefinition> {
  const ref = getGoalRef(uid, goal.id);

  await ref.set(
    {
      ...goal,

      updatedAt: new Date(),
    },
    {
      merge: true,
    },
  );

  return goal;
}

export async function deleteGoal(uid: string, goalId: string) {
  const ref = getGoalRef(uid, goalId);

  await ref.delete();
}
