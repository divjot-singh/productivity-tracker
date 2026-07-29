export interface MetricScoreResult {
  metricId: string;

  value: number | boolean | string;

  score: number;

  weight: number;

  weightedScore: number;

  bonus: number;
}

export interface ScoreResult {
  totalScore: number;

  totalXP: number;

  metrics: MetricScoreResult[];

  totalWeights: number;
}
