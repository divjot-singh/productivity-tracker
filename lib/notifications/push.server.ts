import webpush from "web-push";

import type { NotificationMessage } from "@/lib/notifications/rules";
import {
  deleteSubscriptionById,
  getSubscriptions,
  type StoredSubscription,
} from "@/repositories/notifications.server.repository";

let configured = false;

export function isPushConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY &&
    process.env.VAPID_SUBJECT,
  );
}

function configure() {
  if (configured) return;

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT as string,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
    process.env.VAPID_PRIVATE_KEY as string,
  );
  configured = true;
}

// Returns how many devices accepted the push; expired subscriptions (404/410) are removed.
export async function sendToSubscriptions(
  uid: string,
  subscriptions: StoredSubscription[],
  message: NotificationMessage,
): Promise<number> {
  if (!isPushConfigured()) return 0;

  configure();

  const payload = JSON.stringify({
    title: message.title,
    body: message.body,
    url: message.url,
    tag: message.type,
  });

  let delivered = 0;

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          { endpoint: subscription.endpoint, keys: subscription.keys },
          payload,
        );
        delivered += 1;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;

        if (status === 404 || status === 410) {
          await deleteSubscriptionById(uid, subscription.id);
        } else {
          console.error("Push send failed", status ?? error);
        }
      }
    }),
  );

  return delivered;
}

export async function sendToUser(uid: string, message: NotificationMessage) {
  return sendToSubscriptions(uid, await getSubscriptions(uid), message);
}
