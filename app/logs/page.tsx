"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, CalendarDays } from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import { buttonVariants } from "@/components/ui/button";

import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { toast } from "sonner";

import { DailyEntry } from "@/models/entry";
import { apiRequest } from "@/lib/api/client";
import { MetricDefinition } from "@/models/metric";
import { formatValue } from "@/lib/utils";
import { cn } from "@/lib/utils";

function formatEntryDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function LogsPage() {
  const { user } = useRequireAuth();

  const [entries, setEntries] = useState<DailyEntry[]>([]);

  const [goals, setGoals] = useState<MetricDefinition[]>([]);

  const [expanded, setExpanded] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const totalWeights = goals.reduce((sum, goal) => sum + goal.weight, 0);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const [entriesResponse, goalsResponse] = await Promise.all([
          apiRequest<DailyEntry[]>(user, "/api/entries"),
          apiRequest<MetricDefinition[]>(user, "/api/goals"),
        ]);

        setEntries(entriesResponse);
        setGoals(goalsResponse);
        setLoading(false);
      } catch (e) {
        console.log(e);
        setLoading(false);
        toast.error("Fetching logs failed");
        return;
      }
    }

    loadData();
  }, [user]);

  if (loading) {
    return (
      <AppShell>
        <div className="text-muted-foreground p-6 text-sm">Loading logs...</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-screen-sm space-y-6 px-4 pt-4 pb-28">
        <div>
          <h1 className="text-3xl font-bold">Logs</h1>

          <p className="text-muted-foreground mt-1 text-sm">
            Review your daily performance
          </p>

          <Link
            href="/logs/backfill"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "mt-3",
            )}
          >
            Backfill zero-weight goals
          </Link>
        </div>

        {goals.length === 0 && (
          <div className="bg-card rounded-2xl border p-8 text-center">
            <h2 className="text-xl font-semibold">No goals yet</h2>

            <p className="text-muted-foreground mt-2 text-sm">
              Create goals first to start saving entries and viewing logs.
            </p>

            <Link
              href="/settings/add"
              className={cn(buttonVariants({ size: "sm" }), "mt-4")}
            >
              Create goals
            </Link>
          </div>
        )}

        {goals.length > 0 &&
          entries.map((entry) => {
            const isOpen = expanded === entry.id;

            const grouped = goals.reduce(
              (acc, goal) => {
                const item = entry.breakdown?.find(
                  (b) => b.metricId === goal.id,
                );

                if (!item) {
                  return acc;
                }

                if (!acc[goal.category]) {
                  acc[goal.category] = [];
                }

                acc[goal.category].push({
                  goal,
                  item,
                });

                return acc;
              },
              {} as Record<
                string,
                {
                  goal: MetricDefinition;
                  item: NonNullable<DailyEntry["breakdown"]>[number];
                }[]
              >,
            );

            const percentage = ((entry.score ?? 0) / totalWeights) * 100;
            const progressClass =
              percentage >= 100
                ? "bg-gradient-to-r from-emerald-400 to-green-500"
                : percentage >= 80
                  ? "bg-gradient-to-r from-sky-400 to-blue-500"
                  : percentage >= 60
                    ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                    : "bg-gradient-to-r from-red-400 to-red-500";

            return (
              <div
                key={entry.id}
                className="bg-card overflow-hidden rounded-3xl border"
              >
                <button
                  className="via-card to-card w-full rounded-3xl border border-blue-500/15 bg-gradient-to-br from-blue-500/8 p-5 text-left transition-all hover:border-blue-500/30"
                  onClick={() =>
                    setExpanded(isOpen ? null : (entry.id ?? null))
                  }
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="text-muted-foreground h-4 w-4" />

                        <p className="font-semibold">
                          {formatEntryDate(entry.date)}
                        </p>
                      </div>

                      <p className="text-muted-foreground mt-1 text-sm">
                        {entry.xp} XP earned
                      </p>
                    </div>

                    <ChevronDown
                      className={`text-muted-foreground h-5 w-5 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Life Score
                      </span>

                      <span className="text-primary text-2xl font-bold">
                        {entry.score}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/8">
                      <div
                        className={`h-full rounded-full transition-all ${progressClass}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <div className="mt-4 flex items-end gap-2">
                      <span className="text-primary text-4xl leading-none font-bold">
                        {(entry.score ?? 0).toFixed(0)}
                      </span>

                      <span className="text-muted-foreground mb-1 text-lg">
                        / {totalWeights}
                      </span>

                      {(entry.xp ?? 0) > 0 && (
                        <span className="mb-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500">
                          +{(entry.xp ?? 0).toFixed(0)} Bonus
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t px-5 py-5">
                    {Object.entries(grouped).map(([category, items]) => (
                      <div key={category} className="mb-6 last:mb-0">
                        <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                          {category}
                        </h3>

                        <div className="space-y-2">
                          {items.map(({ goal, item }) => (
                            <div
                              key={goal.id}
                              className="bg-background flex items-center justify-between rounded-2xl border px-4 py-3"
                            >
                              <div>
                                <p className="font-medium">{goal.label}</p>

                                <p className="text-muted-foreground text-sm">
                                  {formatValue(item.value)}
                                  {goal.unit && ` ${goal.unit}`}
                                </p>
                              </div>

                              <div className="text-right">
                                <p className="text-primary text-lg font-semibold">
                                  {item.score.toFixed(1)}
                                </p>

                                <p className="text-muted-foreground text-xs">
                                  / {goal.weight}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

        {goals.length > 0 && entries.length === 0 && (
          <div className="text-muted-foreground rounded-3xl border p-8 text-center">
            No entries yet.
          </div>
        )}
      </div>
    </AppShell>
  );
}
