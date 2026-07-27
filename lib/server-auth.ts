import { headers } from "next/headers";

import { adminAuth } from "@/lib/firebase-admin";
import { NextRequest } from "next/server";

export async function getServerUser(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return null;
  }

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.split("Bearer ")[1];

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);

    return decodedToken;
  } catch (error) {
    console.error("Invalid auth token", error);

    return null;
  }
}

export async function verifyAuthToken(token: string | undefined) {
  if (!token) {
    throw new Error("Missing auth token");
  }

  const decoded = await adminAuth.verifyIdToken(token);

  return decoded;
}
