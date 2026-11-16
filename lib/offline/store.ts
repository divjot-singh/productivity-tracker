import { idbAll, idbClear, idbDelete, idbGet, idbPut } from "./db";

const CACHEABLE_PREFIXES = [
  "/api/workouts",
  "/api/exercises",
  "/api/combinations",
  "/api/exercise-stats",
  "/api/goals",
  "/api/entries",
  "/api/dashboard",
];

const WORKOUT_DATE_PATH = /^\/api\/workouts\/(\d{4}-\d{2}-\d{2})$/;

export interface QueuedWrite {
  key: string;
  uid: string;
  method: "POST" | "PUT";
  url: string;
  body: unknown;
  queuedAt: number;
}

interface CachedResponse {
  key: string;
  value: unknown;
  savedAt: number;
}

type Listener = () => void;

const listeners = new Set<Listener>();
let pendingCount = 0;

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribePending(listener: Listener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export const getPendingCount = () => pendingCount;

export async function refreshPendingCount(uid: string) {
  try {
    const all = await idbAll<QueuedWrite>("queue");

    pendingCount = all.filter((item) => item.uid === uid).length;
  } catch {
    pendingCount = 0;
  }

  notify();
}

export function isCacheableGet(url: string): boolean {
  const path = url.split("?")[0];

  return CACHEABLE_PREFIXES.some((prefix) => path.startsWith(prefix));
}

// Only idempotent "replace this day" writes are queued, so replaying them in order is always safe.
export function isQueueableWrite(method: string, url: string): boolean {
  if (method === "POST" && url === "/api/entries") return true;

  return method === "PUT" && WORKOUT_DATE_PATH.test(url);
}

const cacheKey = (uid: string, url: string) => `${uid}:${url}`;

export async function readCache<T>(uid: string, url: string) {
  try {
    const hit = await idbGet<CachedResponse>("cache", cacheKey(uid, url));

    return hit ? { value: hit.value as T } : undefined;
  } catch {
    return undefined;
  }
}

export async function writeCache(uid: string, url: string, value: unknown) {
  try {
    await idbPut("cache", {
      key: cacheKey(uid, url),
      value,
      savedAt: Date.now(),
    } satisfies CachedResponse);
  } catch {
    // Cache is best-effort; a quota or private-mode failure must never break a request.
  }
}

// Keeps offline reads consistent with what the user just saved.
async function patchCacheForWrite(uid: string, url: string, body: unknown) {
  if (url === "/api/entries") {
    const { date, values } = body as { date: string; values: unknown };

    await writeCache(uid, `/api/entries?date=${date}`, { date, values });
    return;
  }

  const match = WORKOUT_DATE_PATH.exec(url);

  if (match) {
    await writeCache(uid, url, {
      ...(body as object),
      date: match[1],
      id: match[1],
    });
  }
}

export async function enqueueWrite(
  uid: string,
  method: "POST" | "PUT",
  url: string,
  body: unknown,
) {
  // One pending write per target: the newest edit for a day replaces the older one.
  const target =
    url === "/api/entries" ? `${url}:${(body as { date: string }).date}` : url;

  await idbPut("queue", {
    key: `${uid}:${method}:${target}`,
    uid,
    method,
    url,
    body,
    queuedAt: Date.now(),
  } satisfies QueuedWrite);

  await patchCacheForWrite(uid, url, body);
  await refreshPendingCount(uid);
}

export async function listQueue(uid: string): Promise<QueuedWrite[]> {
  try {
    const all = await idbAll<QueuedWrite>("queue");

    return all
      .filter((item) => item.uid === uid)
      .sort((a, b) => a.queuedAt - b.queuedAt);
  } catch {
    return [];
  }
}

export async function removeQueued(uid: string, key: string) {
  await idbDelete("queue", key);
  await refreshPendingCount(uid);
}

export async function clearOfflineData() {
  try {
    await Promise.all([idbClear("cache"), idbClear("queue")]);
  } catch {
    // Nothing stored or storage unavailable.
  }

  pendingCount = 0;
  notify();
}
