"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";

import { apiRequest } from "@/lib/api/client";
import { ICONS, ICON_LABELS } from "@/lib/metric-icons";

import { MetricDefinition } from "@/models/metric";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GoalDetails() {
  const { user } = useAuth();
  const router = useRouter();

  const { id } = useParams<{ id: string }>();

  const [goal, setGoal] = useState<MetricDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    async function loadGoal() {
      if (!user || !id) {
        return;
      }

      try {
        setLoading(true);

        const goal = await apiRequest<MetricDefinition>(
          user,
          `/api/goals/${id}`,
        );

        setGoal(goal);
      } catch (err) {
        console.error(err);
        setError("Failed to load goal.");
      } finally {
        setLoading(false);
      }
    }

    loadGoal();
  }, [id, user]);

  if (loading) {
    return <div className="p-6">Loading goal...</div>;
  }

  if (error || !goal) {
    return <div className="p-6 text-red-500">{error ?? "Goal not found."}</div>;
  }

  const Icon = ICONS[goal.icon] ?? ICONS.goal;

  return (
    <div className="space-y-6 p-4">
      {/* Hero */}

      <div className="bg-card relative overflow-hidden rounded-3xl border">
        {/* Accent */}

        <div className="from-primary/15 via-primary/5 to-background h-28 bg-gradient-to-r" />
        <button
          onClick={() => router.back()}
          className="absolute top-8 left-2 flex w-full"
        >
          <ChevronLeft size={24} /> Back
        </button>
        <div className="-mt-10 px-8 pb-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-5">
              <div className="bg-background ring-background flex h-20 w-20 items-center justify-center rounded-3xl border shadow-sm ring-4">
                <Icon className="text-primary h-10 w-10" />
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {goal.label}
                </h1>

                <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
                  {goal.description || "No description provided."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="bg-muted rounded-full px-4 py-2 text-sm font-medium">
                {capitalize(goal.category)}
              </div>

              <div className="bg-primary/10 text-primary rounded-full px-4 py-2 text-sm font-medium">
                {capitalize(goal.type)}
              </div>

              <div className="bg-secondary rounded-full px-4 py-2 text-sm font-medium">
                {goal.weight} pts
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overview */}

      <div className="bg-card rounded-3xl border">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Overview</h2>
        </div>

        <div className="divide-y">
          <OverviewRow
            label="Target"
            value={`${goal.scoring.type === "boolean" ? (goal.target === true ? "Yes" : "No") : goal.target}${goal.unit ? ` ${goal.unit}` : ""}`}
          />

          <OverviewRow
            label="Default Value"
            value={`${goal.scoring.type === "boolean" ? (goal.defaultValue === true ? "Yes" : "No") : goal.defaultValue}${goal.unit ? ` ${goal.unit}` : ""}`}
          />

          <OverviewRow label="Weight" value={`${goal.weight} pts`} />

          <OverviewRow label="Unit" value={goal.unit || "None"} />
        </div>
      </div>

      {/* Scoring */}

      <div className="bg-card rounded-3xl border">
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold">Scoring</h2>

            <p className="text-muted-foreground mt-1 text-sm">
              How this goal contributes towards your Life Score.
            </p>
          </div>

          <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium">
            {capitalize(goal.scoring.type)}
          </span>
        </div>

        <div className="divide-y">
          {"bonusRate" in goal.scoring && (
            <OverviewRow
              label="Bonus Rate"
              value={`+${goal.scoring.bonusRate}`}
            />
          )}

          {"multiplier" in goal.scoring && (
            <OverviewRow
              label="Multiplier"
              value={`× ${goal.scoring.multiplier}`}
            />
          )}

          {goal.scoring.type === "boolean" && (
            <>
              <OverviewRow label="Yes" value={`${goal.weight} pts`} />
              <OverviewRow label="No" value="0 pts" />
            </>
          )}
        </div>

        {(goal.scoring.ranges?.length ?? 0) > 0 && (
          <div className="border-t p-6">
            <h3 className="mb-4 font-medium">Ranges</h3>

            <div className="overflow-hidden rounded-xl border">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm">From</th>
                    <th className="px-4 py-3 text-left text-sm">To</th>
                    <th className="px-4 py-3 text-right text-sm">Score</th>
                  </tr>
                </thead>

                <tbody>
                  {goal.scoring.ranges!.map((range, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-3">
                        {range.min}
                        {goal.unit && ` ${goal.unit}`}
                      </td>

                      <td className="px-4 py-3">
                        {range.max}
                        {goal.unit && ` ${goal.unit}`}
                      </td>

                      <td className="px-4 py-3 text-right font-semibold">
                        {range.multiplier * goal.weight} pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(goal.scoring.options?.length ?? 0) > 0 && (
          <div className="border-t p-6">
            <h3 className="mb-4 font-medium">Options</h3>

            <div className="divide-y overflow-hidden rounded-xl border">
              {goal.scoring.options!.map((option, index) => (
                <OverviewRow
                  key={index}
                  label={option.label}
                  value={`${option.multiplier * goal.weight} pts`}
                />
              ))}
            </div>
          </div>
        )}
        {(goal.scoring.time?.length ?? 0) > 0 && (
          <div className="border-t p-6">
            <h3 className="mb-4 font-medium">Time ranges</h3>

            <div className="overflow-hidden rounded-xl border">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm">From</th>
                    <th className="px-4 py-3 text-left text-sm">To</th>
                    <th className="px-4 py-3 text-right text-sm">Score</th>
                  </tr>
                </thead>

                <tbody>
                  {goal.scoring.time!.map((time, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-3">
                        {time.from}
                        {goal.unit && ` ${goal.unit}`}
                      </td>

                      <td className="px-4 py-3">
                        {time.to}
                        {goal.unit && ` ${goal.unit}`}
                      </td>

                      <td className="px-4 py-3 text-right font-semibold">
                        {time.multiplier * goal.weight} pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {(goal.scoring.maxScore ?? 0) > 0 && (
          <OverviewRow
            label="Max score"
            value={`${goal.scoring.maxScore} pts`}
          />
        )}
      </div>
    </div>
  );
}

function OverviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-6 py-5">
      <span className="text-muted-foreground">{label}</span>

      <span className="font-semibold">{value}</span>
    </div>
  );
}

function capitalize(value: string) {
  return value
    .replace("-", " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}
