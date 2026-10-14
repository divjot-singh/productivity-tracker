import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

import { auth } from "./firebase";
import { clearOfflineData } from "./offline/store";

const provider = new GoogleAuthProvider();

provider.setCustomParameters({
  prompt: "select_account",
});

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function logout() {
  await clearOfflineData();
  await signOut(auth);
}
