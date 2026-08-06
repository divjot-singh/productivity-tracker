import { MetricDefinition } from "@/models/metric";
import ScoringExplanationInput from "./ScoringExplanationInput";

interface Props {
  goal: MetricDefinition;

  updateGoal: (partial: Partial<MetricDefinition>) => void;
}

export default function BooleanConfig({ goal, updateGoal }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Boolean Configuration</h3>

        <p className="text-muted-foreground mt-1 text-sm">
          This goal is either completed or not completed.
        </p>
      </div>

      <ScoringExplanationInput goal={goal} updateGoal={updateGoal} />

      <div className="bg-muted/40 rounded-xl border p-5">
        <p className="font-medium">No additional configuration required.</p>

        <p className="text-muted-foreground mt-2 text-sm">
          The user will simply mark this goal as completed or not completed.
        </p>
      </div>
    </div>
  );
}
