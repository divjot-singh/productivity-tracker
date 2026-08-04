import { adminDb } from "@/lib/firebase-admin";

import { DailyEntry } from "@/models/entry";

interface CreateEntryPayload {
  date: string;

  values: Record<string, unknown>;

  score: number;

  xp: number;

  breakdown: unknown[];
}

function getEntryRef(uid: string, date: string) {
  return adminDb.collection("users").doc(uid).collection("entries").doc(date);
}

export async function createEntry(uid: string, entry: CreateEntryPayload) {
  const ref = getEntryRef(uid, entry.date);

  await ref.set(
    {
      ...entry,

      createdAt: new Date(),

      updatedAt: new Date(),
    },
    {
      merge: true,
    },
  );

  return {
    id: entry.date,
    ...entry,
  };
}

export async function getEntry(
  uid: string,
  date: string,
): Promise<DailyEntry | null> {
  const ref = getEntryRef(uid, date);

  const snapshot = await ref.get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,
    ...(snapshot.data() as DailyEntry),
  };
}

export async function entryExists(uid: string, date: string) {
  const ref = getEntryRef(uid, date);

  const snapshot = await ref.get();

  return snapshot.exists;
}

export async function getEntries(uid: string): Promise<DailyEntry[]> {
  const snapshot = await adminDb
    .collection("users")
    .doc(uid)
    .collection("entries")
    .orderBy("date", "desc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,

    ...(doc.data() as DailyEntry),
  }));
}

export async function goalHasHistory(
  uid: string,
  goalId: string,
): Promise<boolean> {
  const entries = await getEntries(uid);

  return entries.some((entry) =>
    Object.prototype.hasOwnProperty.call(entry.values ?? {}, goalId),
  );
}
