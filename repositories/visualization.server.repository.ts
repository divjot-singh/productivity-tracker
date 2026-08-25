import { adminDb } from "@/lib/firebase-admin";
import { removeUndefinedDeep } from "@/lib/firestore/sanitize";

import { VisualizationDefinition } from "@/models/visualization";

function getVisualizationRef(uid: string, visualizationId: string) {
  return adminDb
    .collection("users")
    .doc(uid)
    .collection("visualizations")
    .doc(visualizationId);
}

export async function getVisualizationDefinitions(
  uid: string,
): Promise<VisualizationDefinition[]> {
  const snapshot = await adminDb
    .collection("users")
    .doc(uid)
    .collection("visualizations")
    .orderBy("displayOrder", "asc")
    .get();

  return snapshot.docs.map((doc) => ({
    ...(doc.data() as VisualizationDefinition),
    id: doc.id,
  }));
}

export async function getVisualizationDefinition(
  uid: string,
  visualizationId: string,
): Promise<VisualizationDefinition | null> {
  const snapshot = await getVisualizationRef(uid, visualizationId).get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    ...(snapshot.data() as VisualizationDefinition),
    id: snapshot.id,
  };
}

function removeUndefined<T extends Record<string, unknown>>(
  value: T,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value)) {
    if (entry !== undefined) {
      result[key] = entry;
    }
  }

  return result;
}

export async function createVisualization(
  uid: string,
  visualization: VisualizationDefinition,
): Promise<VisualizationDefinition> {
  const ref = getVisualizationRef(uid, visualization.id);

  await ref.set(
    {
      ...removeUndefined(visualization as unknown as Record<string, unknown>),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      merge: false,
    },
  );

  return visualization;
}

export async function updateVisualization(
  uid: string,
  visualization: VisualizationDefinition,
): Promise<VisualizationDefinition> {
  const ref = getVisualizationRef(uid, visualization.id);

  await ref.set(
    {
      ...removeUndefinedDeep(
        visualization as unknown as Record<string, unknown>,
      ),
      updatedAt: new Date(),
    },
    {
      merge: false,
    },
  );

  return visualization;
}

export async function deleteVisualization(
  uid: string,
  visualizationId: string,
) {
  const ref = getVisualizationRef(uid, visualizationId);

  await ref.delete();
}

export async function getNextDisplayOrder(
  uid: string,
  scope: VisualizationDefinition["scope"],
): Promise<number> {
  const snapshot = await adminDb
    .collection("users")
    .doc(uid)
    .collection("visualizations")
    .where("scope", "==", scope)
    .orderBy("displayOrder", "desc")
    .limit(1)
    .get();

  if (snapshot.empty) {
    return 1;
  }

  const highest = snapshot.docs[0].data().displayOrder ?? 0;

  return highest + 1;
}
