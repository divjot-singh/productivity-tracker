import { Timestamp } from "firebase/firestore";

export type EntryValue = number | boolean | string;

export interface MetricScoreBreakdown {
  metricId: string;

  value: EntryValue;

  score: number;

  weight: number;

  weightedScore: number;

  bonus: number;

  xp: number;
}

export interface DailyEntry {
  id?: string;
  date: string;

  /**
   * Raw values entered by user
   *
   * Example:
   * {
   *   sleep: 8,
   *   protein: 3,
   *   steps: 9000
   * }
   */
  values: Record<string, EntryValue>;

  /**
   * Calculated by backend scoring engine
   */
  score?: number;

  /**
   * Calculated by backend scoring engine
   */
  xp?: number;

  /**
   * Detailed metric level scoring
   */
  breakdown?: MetricScoreBreakdown[];

  createdAt?: Timestamp;

  updatedAt?: Timestamp;
}
