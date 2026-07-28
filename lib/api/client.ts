import { User } from "firebase/auth";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

async function getAuthHeaders(
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

export async function apiRequest<T>(
  user: User,
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetch(url, {
    ...options,

    headers: await getAuthHeaders(user, options.headers),

    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

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
