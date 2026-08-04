export interface ComparisonData {
  label: string;

  value: number;

  direction: "up" | "down" | "neutral";
}

export interface StatCardData {
  value: number | string;

  unit?: string;

  comparison?: ComparisonData;
}

export interface ProgressBarData {
  value: number;

  target: number;

  percentage: number;

  unit?: string;

  label?: string;
}

export interface ProgressRingData {
  value: number;

  target?: number;

  percentage: number;

  unit?: string;

  label?: string;
}

export interface TrendChartData {
  labels: string[];

  rawLabels?: string[];

  unit?: string;

  valueKind?: "number" | "score" | "time-of-day" | "boolean";

  domain?: {
    min: number;
    max: number;
  };

  datasets: {
    label: string;
    data: number[];
  }[];
}

export interface LeaderboardData {
  items: {
    label: string;
    value: number;
    score?: number;
    weight?: number;
    percentage?: number;
  }[];
}

export interface HeatmapData {
  cells: {
    date: string;
    label: string;
    value: number;
    intensity: number;
  }[];

  maxValue: number;
}

export interface TimelineData {
  unit?: string;

  label?: string;

  valueKind?: "number" | "time-of-day" | "boolean";

  items: {
    date: string;
    label: string;
    value: number;
    valueLabel?: string;
    delta: number;
    deltaLabel?: string;
    direction: "up" | "down" | "neutral";
  }[];
}

export interface InsightCardData {
  tone: "positive" | "neutral" | "negative";

  headline: string;

  message: string;

  stats: {
    label: string;
    value: string;
  }[];
}
