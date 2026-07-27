import MetricRow from "./metric-row";
import { MetricDefinition } from "@/models/metric";

const COLORS: Record<string, string> = {
  health: "bg-green-500",
  fitness: "bg-blue-500",
  lifestyle: "bg-violet-500",
  family: "bg-orange-500",
  routine: "bg-yellow-400",
};

interface Props {
  category: string;
  metrics: MetricDefinition[];
}

export default function Section({ category, metrics }: Props) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <div
          className={`h-2.5 w-2.5 rounded-full ${
            COLORS[category] ?? "bg-white"
          }`}
        />

        <h2 className="text-lg font-semibold capitalize">{category}</h2>
      </div>

      <div className="bg-card overflow-hidden rounded-2xl border border-zinc-800">
        {metrics.map((metric) => (
          <MetricRow key={metric.id} metric={metric} />
        ))}
      </div>
    </section>
  );
}
