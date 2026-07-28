// models/metric.ts

import { Date } from "firebase/ai";

export type MetricValue = number | boolean | string;

export type MetricType = "number" | "boolean" | "time";

export type MetricCategory =
  "health" | "fitness" | "lifestyle" | "family" | "routine" | "custom";

// ---------------- SCORING TYPES ----------------

export type ScoringType =
  "boolean" | "goal" | "options" | "range" | "time-range" | "multiplier";

// ---------------- SCORE DEFINITIONS ----------------

export interface OptionScore {
  value: string | number | boolean;
  label: string;
  score: number;
}

export interface TimeRangeScore {
  from: string; // HH:mm
  to: string; // HH:mm
  score: number;
}

export interface RangeScore {
  min: number;
  max: number;
  score: number;
}

export interface ScoringDefinition {
  type: ScoringType;

  options?: OptionScore[];

  ranges?: RangeScore[];

  time?: TimeRangeScore[];

  multiplier?: number;

  bonusRate?: number;
  maxScore?: number;
}

// ---------------- METRIC ----------------

export interface MetricDefinition {
  id: string;

  label: string;
  icon: string;

  description?: string;

  category: MetricCategory;

  displayOrder: number;

  type: MetricType;

  unit?: string;

  defaultValue: MetricValue;

  target: MetricValue;

  weight: number;

  scoring: ScoringDefinition;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Config {
  metrics: MetricDefinition[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
