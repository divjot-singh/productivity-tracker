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

  valueKind?: "number" | "score" | "duration-hours" | "boolean";

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

  items: {
    date: string;
    label: string;
    value: number;
    delta: number;
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
