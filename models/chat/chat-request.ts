export interface ChatRequest {
  message: string;
  conversationId?: string;
  filters?: ChatRequestFilters;
  devUserId?: string;
}

export interface ChatRequestFilters {
  domains?: "entries" | "goals" | "visualizations" | "all";
  dateFrom?: string;
  dateTo?: string;
  goalIds?: string[];
  metricIds?: string[];
  categories?: string[];
  tags?: string[];
  minScore?: number;
  maxScore?: number;
}

export type ChatDomainType = "entries" | "goals" | "visualizations" | "all";

export type ChatDomains = "entries" | "goals" | "visualizations";
