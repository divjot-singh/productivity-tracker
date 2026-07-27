import { adminDb } from "@/lib/firebase-admin";
import { DEFAULT_METRICS } from "@/lib/defaults";

const CONFIG_DOCUMENT = "metrics";

export async function seedDefaultConfig(uid: string) {
  const ref = adminDb
    .collection("users")
    .doc(uid)
    .collection("config")
    .doc(CONFIG_DOCUMENT);

  await ref.set(
    {
      metrics: DEFAULT_METRICS,

      version: 1,

      createdAt: new Date(),

      updatedAt: new Date(),
    },
    {
      merge: false,
    },
  );
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
