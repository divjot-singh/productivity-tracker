import { DEFAULT_VISUALIZATIONS } from "@/lib/defaults";

import { adminDb } from "@/lib/firebase-admin";

import { VisualizationDefinition } from "@/models/visualization";

export async function getVisualizationDefinitions(
  uid: string,
): Promise<VisualizationDefinition[]> {
  try {
    const snapshot = await adminDb
      .collection("users")
      .doc(uid)
      .collection("visualizations")
      .orderBy("displayOrder", "asc")
      .get();

    if (snapshot.empty) {
      return DEFAULT_VISUALIZATIONS;
    }

    return snapshot.docs.map((doc) => ({
      ...(doc.data() as VisualizationDefinition),
      id: doc.id,
    }));
  } catch (error) {
    console.error(error);

    return DEFAULT_VISUALIZATIONS;
  }
}
