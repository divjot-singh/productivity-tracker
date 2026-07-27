import {
  Moon,
  Salad,
  Dumbbell,
  HeartPulse,
  Footprints,
  StretchHorizontal,
  WineOff,
  Target,
  Baby,
  House,
  Sunrise,
  Sunset,
  Smile,
} from "lucide-react";

import { MetricDefinition } from "@/models/metric";

const ICONS: Record<string, any> = {
  sleep: Moon,
  protein: Salad,
  weightTraining: Dumbbell,
  cardio: HeartPulse,
  steps: Footprints,
  stretching: StretchHorizontal,
  healthyEating: Salad,
  noAlcohol: WineOff,
  primaryGoal: Target,
  helpedWifeExercise: Baby,
  householdHelp: House,
  wakeTime: Sunrise,
  bedTime: Sunset,
  oralHygiene: Smile,
};

export default function MetricRow({ metric }: { metric: MetricDefinition }) {
  const Icon = ICONS[metric.id];

  return (
    <div className="flex items-start gap-4 border-b border-zinc-800 px-4 py-5 last:border-b-0">
      <div className="bg-secondary rounded-xl p-3">
        <Icon size={20} className="text-muted-foreground" />
      </div>

      <div className="flex-1">
        <h3 className="text-base font-semibold">{metric.label}</h3>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-m text-muted-foreground font-semibold tracking-wide uppercase">
            Goal
          </p>

          <p className="text-lg font-medium">
            {typeof metric.target == "boolean"
              ? metric.target
                ? "Yes"
                : "No"
              : String(metric.target)}

            {metric.unit && ` ${metric.unit}`}
          </p>
        </div>
      </div>
    </div>
  );
}
