import { auth } from "@/lib/firebase";

export class SeederService {
  static async seedDefaults() {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("User not authenticated");
    }

    const token = await user.getIdToken();

    const response = await fetch("/api/config", {
      method: "POST",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to seed config");
    }

    return response.json();
  }
}
