import { Timestamp } from "firebase/firestore";

export interface UserProfile {
  uid: string;

  email: string;

  displayName?: string;

  photoURL?: string;

  /**
   * Future:
   * user can customize goals
   */
  hasCompletedSetup: boolean;

  createdAt?: Timestamp;

  updatedAt?: Timestamp;
}
