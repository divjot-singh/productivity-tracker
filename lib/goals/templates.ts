import { MetricDefinition } from "@/models/metric";

export type GoalTemplate = Omit<
  MetricDefinition,
  "id" | "createdAt" | "updatedAt" | "isProtected"
> & {
  templateId: string;
};

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function toGoalTemplate(metric: MetricDefinition): GoalTemplate {
  const {
    id: templateId,
    createdAt,
    updatedAt,
    isProtected,
    ...payload
  } = deepClone(metric) as MetricDefinition & {
    isProtected?: boolean;
  };

  void createdAt;
  void updatedAt;
  void isProtected;

  return {
    templateId,
    ...payload,
  };
}

export function createGoalFromTemplate(
  template: GoalTemplate,
  displayOrder: number,
): MetricDefinition {
  const { templateId, ...payload } = deepClone(template);

  void templateId;

  return {
    ...payload,
    id: crypto.randomUUID(),
    displayOrder,
  };
}
