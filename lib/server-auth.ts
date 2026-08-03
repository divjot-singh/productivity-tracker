import { NextRequest } from "next/server";

type DecodedUser = {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  [key: string]: unknown;
};

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
    const decodedToken = await verifyToken(token);

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

  const decoded = await verifyToken(token);

  return decoded;
}

async function verifyToken(token: string): Promise<DecodedUser> {
  try {
    const { adminAuth } = await import("@/lib/firebase-admin");
    return await adminAuth.verifyIdToken(token);
  } catch (error) {
    if (!isFirebaseAdminModuleError(error)) {
      throw error;
    }

    return verifyTokenWithIdentityToolkit(token);
  }
}

function isFirebaseAdminModuleError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message = "message" in error ? String(error.message) : "";
  return message.includes("ERR_REQUIRE_ESM") || message.includes("jwks-rsa");
}

async function verifyTokenWithIdentityToolkit(
  token: string,
): Promise<DecodedUser> {
  const apiKey =
    process.env.FIREBASE_WEB_API_KEY ??
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing FIREBASE_WEB_API_KEY (or NEXT_PUBLIC_FIREBASE_API_KEY) for auth fallback.",
    );
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idToken: token,
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to verify Firebase token via Identity Toolkit.");
  }

  const payload = (await response.json()) as {
    users?: Array<{
      localId?: string;
      email?: string;
      displayName?: string;
      photoUrl?: string;
    }>;
  };

  const user = payload.users?.[0];

  if (!user?.localId) {
    throw new Error("Identity Toolkit token verification returned no user.");
  }

  return {
    uid: user.localId,
    email: user.email,
    name: user.displayName,
    picture: user.photoUrl,
  };
}
