import { getAuthHeaders } from "@/lib/api/client";
import { listQueue, removeQueued } from "@/lib/offline/store";
import type { User } from "firebase/auth";

let flushing = false;

// Replays queued offline writes oldest-first. Stops on a network failure; drops writes the server rejects (4xx) so one bad item can't block the rest.
export async function flushQueue(user: User): Promise<number> {
  if (flushing) return 0;

  flushing = true;
  let sent = 0;

  try {
    for (const item of await listQueue(user.uid)) {
      let response: Response;

      try {
        response = await fetch(item.url, {
          method: item.method,
          headers: await getAuthHeaders(user),
          body: JSON.stringify(item.body),
        });
      } catch {
        break;
      }

      if (response.ok || (response.status >= 400 && response.status < 500)) {
        await removeQueued(user.uid, item.key);
        sent += response.ok ? 1 : 0;
        continue;
      }

      break;
    }
  } finally {
    flushing = false;
  }

  return sent;
}
