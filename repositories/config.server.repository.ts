import { adminDb } from "@/lib/firebase-admin";
import { DEFAULT_METRICS } from "@/lib/defaults";

const CONFIG_DOCUMENT = "metrics";

export async function seedDefaultConfig(uid: string) {
  const collection = adminDb.collection("users").doc(uid).collection("goals");

  DEFAULT_METRICS.map(async (metric) => {
    await collection.doc(metric.id).set(
      {
        ...metric,

        createdAt: new Date(),

        updatedAt: new Date(),
      },
      {
        merge: false,
      },
    );
  });
}

export async function getMetrics(uid: string) {
  const ref = adminDb
    .collection("users")
    .doc(uid)
    .collection("config")
    .doc(CONFIG_DOCUMENT);

  const snapshot = await ref.get();

  if (!snapshot.exists) {
    return null;
  }

  return snapshot.data();
}
