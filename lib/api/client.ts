import type { User } from "firebase/auth";

import {
  enqueueWrite,
  isCacheableGet,
  isQueueableWrite,
  readCache,
  writeCache,
} from "@/lib/offline/store";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function getAuthHeaders(
  user: User,
  headers?: HeadersInit,
): Promise<HeadersInit> {
  const token = await user.getIdToken();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...headers,
  };
}

async function parse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = "Something went wrong.";

    try {
      const error = await response.json();

      message = error.error ?? message;
    } catch {}

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// Reads fall back to the last cached response and safe writes are queued when the network is unreachable.
export async function apiRequest<T>(
  user: User,
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();

  let response: Response;

  try {
    response = await fetch(url, {
      ...options,

      headers: await getAuthHeaders(user, options.headers),

      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch (networkError) {
    if (method === "GET" && isCacheableGet(url)) {
      const cached = await readCache<T>(user.uid, url);

      if (cached) return cached.value;
    }

    if (
      (method === "POST" || method === "PUT") &&
      isQueueableWrite(method, url)
    ) {
      await enqueueWrite(user.uid, method, url, options.body);

      return options.body as T;
    }

    throw networkError;
  }

  const data = await parse<T>(response);

  if (method === "GET" && isCacheableGet(url) && data !== undefined) {
    void writeCache(user.uid, url, data);
  }

  return data;
}
