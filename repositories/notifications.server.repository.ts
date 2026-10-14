import { createHash } from "node:crypto";

import { adminDb } from "@/lib/firebase-admin";
import {
  mergeSettings,
  type NotificationSettings,
  type SentLog,
} from "@/lib/notifications/rules";

export interface StoredSubscription {
  id: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

function userRef(uid: string) {
  return adminDb.collection("users").doc(uid);
}

function subscriptionsOf(uid: string) {
  return userRef(uid).collection("pushSubscriptions");
}

function configDoc(uid: string, name: "settings" | "log") {
  return userRef(uid).collection("notifications").doc(name);
}

const subscriptionId = (endpoint: string) =>
  createHash("sha256").update(endpoint).digest("hex").slice(0, 40);

export async function saveSubscription(
  uid: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
) {
  await subscriptionsOf(uid).doc(subscriptionId(subscription.endpoint)).set({
    endpoint: subscription.endpoint,
    keys: subscription.keys,
    createdAt: new Date(),
  });
}

export async function deleteSubscription(uid: string, endpoint: string) {
  await subscriptionsOf(uid).doc(subscriptionId(endpoint)).delete();
}

export async function deleteSubscriptionById(uid: string, id: string) {
  await subscriptionsOf(uid).doc(id).delete();
}

export async function getSubscriptions(
  uid: string,
): Promise<StoredSubscription[]> {
  const snapshot = await subscriptionsOf(uid).get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<StoredSubscription, "id">),
  }));
}

// Every user with at least one device, for the scheduled run.
export async function getAllSubscribers(): Promise<
  Map<string, StoredSubscription[]>
> {
  const snapshot = await adminDb.collectionGroup("pushSubscriptions").get();
  const byUser = new Map<string, StoredSubscription[]>();

  for (const doc of snapshot.docs) {
    const uid = doc.ref.parent.parent?.id;

    if (!uid) continue;

    const list = byUser.get(uid) ?? [];

    list.push({
      id: doc.id,
      ...(doc.data() as Omit<StoredSubscription, "id">),
    });
    byUser.set(uid, list);
  }

  return byUser;
}

export async function getNotificationSettings(
  uid: string,
): Promise<NotificationSettings> {
  const snapshot = await configDoc(uid, "settings").get();

  return mergeSettings(
    snapshot.exists ? (snapshot.data() as Partial<NotificationSettings>) : null,
  );
}

export async function saveNotificationSettings(
  uid: string,
  settings: NotificationSettings,
) {
  await configDoc(uid, "settings").set(settings);
}

export async function getSentLog(uid: string): Promise<SentLog> {
  const snapshot = await configDoc(uid, "log").get();

  return snapshot.exists ? (snapshot.data() as SentLog) : {};
}

export async function markSent(uid: string, type: keyof SentLog, date: string) {
  await configDoc(uid, "log").set({ [type]: date }, { merge: true });
}
