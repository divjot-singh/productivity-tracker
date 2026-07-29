"use client";

import { MetricDefinition } from "@/models/metric";

interface Props {
  goal: MetricDefinition;
}

export default function ReviewStep({ goal }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Review Goal</h2>

        <p className="text-muted-foreground mt-1 text-sm">
          Verify everything before creating your goal.
        </p>
      </div>

      <div className="bg-muted/40 rounded-xl border">
        <div className="divide-border divide-y">
          <Row label="Name" value={goal.label} />

          <Row label="Description" value={goal.description} />

          <Row label="Category" value={capitalize(goal.category)} />

          <Row label="Metric Type" value={capitalize(goal.type)} />

          <Row label="Scoring Type" value={capitalize(goal.scoring.type)} />

          <Row label="Target" value={formatValue(goal.target)} />

          <Row label="Default Value" value={formatValue(goal.defaultValue)} />

          <Row label="Unit" value={goal.unit || "-"} />

          <Row label="Weight" value={goal.weight} />

          <Row label="Bonus Rate" value={goal.scoring?.bonusRate || "-"} />
        </div>
      </div>

      <ScoringConfiguration goal={goal} />
    </div>
  );
}

function ScoringConfiguration({ goal }: { goal: MetricDefinition }) {
  switch (goal.scoring.type) {
    case "goal":
      return (
        <ConfigCard title="Target Configuration">
          <Row label="Target" value={goal.target} />
        </ConfigCard>
      );

    case "multiplier":
      return (
        <ConfigCard title="Multiplier Configuration">
          <Row label="Target" value={goal.target} />

          <Row label="Multiplier" value={goal.scoring.multiplier || "-"} />
        </ConfigCard>
      );

    case "range":
      return (
        <ConfigCard title="Range Configuration">
          {goal.scoring.ranges?.length ? (
            goal.scoring.ranges.map((range, index) => (
              <Row
                key={index}
                label={`${range.min} - ${range.max}`}
                value={`${range.multiplier * goal.weight} pts`}
              />
            ))
          ) : (
            <Empty />
          )}
        </ConfigCard>
      );

    case "options":
      return (
        <ConfigCard title="Options Configuration">
          {goal.scoring.options?.length ? (
            goal.scoring.options.map((value, index) => (
              <Row
                key={index}
                label={String(value.value)}
                value={`${value.multiplier * goal.weight} pts`}
              />
            ))
          ) : (
            <Empty />
          )}
        </ConfigCard>
      );

    case "time-range":
      return (
        <ConfigCard title="Time Range Configuration">
          {goal.scoring.time?.length ? (
            goal.scoring.time.map((time, index) => (
              <Row
                key={index}
                label={`${time.from} - ${time.to}`}
                value={`${time.multiplier * goal.weight} pts`}
              />
            ))
          ) : (
            <Empty />
          )}
        </ConfigCard>
      );

    case "boolean":
      return (
        <ConfigCard title="Boolean Configuration">
          <div className="px-5 py-4 text-sm">
            Goal awards points when marked complete.
          </div>
        </ConfigCard>
      );

    default:
      return null;
  }
}

function ConfigCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border">
      <div className="border-b px-5 py-4">
        <h3 className="font-semibold">{title}</h3>
      </div>

      <div className="divide-border divide-y">{children}</div>
    </div>
  );
}

function Empty() {
  return (
    <div className="text-muted-foreground px-5 py-4 text-sm">
      No configuration added.
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <p className="text-muted-foreground text-sm">{label}</p>

      <p className="text-right font-medium">{formatValue(value)}</p>
    </div>
  );
}

function formatValue(value: unknown) {
  if (value === "" || value === undefined || value === null) {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

function capitalize(value: string) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
