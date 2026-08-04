import { apiRequest } from "@/lib/api/client";
import { auth } from "@/lib/firebase";

export class SeederService {
  static async seedDefaults() {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      return apiRequest(user, "/api/config", {
        method: "POST",
      });
    } catch (e) {
      console.error(e);
      throw new Error("Failed to seed config");
    }
  }

  static async seedVisualizations() {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      return apiRequest(user, "/api/config/visualizations", {
        method: "POST",
      });
    } catch (e) {
      console.error(e);
      throw new Error("Failed to seed visualizations");
    }
  }
}
