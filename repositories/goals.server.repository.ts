// repositories/goals.server.repository.ts

import { adminDb } from "@/lib/firebase-admin";
import { GOAL_SCHEMA_VERSION, mapGoal } from "@/lib/mappers/goal.mapper";
import { FieldValue } from "firebase-admin/firestore";

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

  return mapGoal(snapshot.data() as Record<string, unknown>, snapshot.id);
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

  return snapshot.docs.map((doc) =>
    mapGoal(doc.data() as Record<string, unknown>, doc.id),
  );
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

export async function archiveGoal(
  uid: string,
  goal: MetricDefinition,
  archivedAt: string,
) {
  await getGoalRef(uid, goal.id).set(
    {
      status: "archived",
      archivedAt,
      previousWeight: goal.weight,
      weight: 0,
      schemaVersion: GOAL_SCHEMA_VERSION,
      updatedAt: new Date(),
    },
    { merge: true },
  );
}

export async function reactivateGoal(
  uid: string,
  goalId: string,
  weight: number,
) {
  await getGoalRef(uid, goalId).set(
    {
      status: "active",
      weight,
      archivedAt: FieldValue.delete(),
      previousWeight: FieldValue.delete(),
      schemaVersion: GOAL_SCHEMA_VERSION,
      updatedAt: new Date(),
    },
    { merge: true },
  );
}

export async function deleteGoal(uid: string, goalId: string) {
  const ref = getGoalRef(uid, goalId);

  await ref.delete();
}
