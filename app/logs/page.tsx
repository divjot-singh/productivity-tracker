"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";

import PageHeader from "@/components/common/PageHeader";
import PageSkeleton from "@/components/common/PageSkeleton";
import AppShell from "@/components/layout/AppShell";
import InsightsSubNav from "@/components/layout/InsightsSubNav";
import { Button, buttonVariants } from "@/components/ui/button";
import { apiRequest } from "@/lib/api/client";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { cn, formatValue } from "@/lib/utils";
import { DailyEntry } from "@/models/entry";
import { MetricDefinition } from "@/models/metric";

const PAGE_SIZE = 30;

const parseDate = (date: string) => new Date(`${date}T00:00:00`);

const dayLabel = (date: string) =>
  parseDate(date).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

const monthLabel = (date: string) =>
  parseDate(date).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

const toneClass = (percent: number) =>
  percent >= 100
    ? "bg-good"
    : percent >= 80
      ? "bg-primary"
      : percent >= 60
        ? "bg-warn"
        : "bg-destructive";

export default function LogsPage() {
  const { user } = useRequireAuth();

  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [goals, setGoals] = useState<MetricDefinition[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        const [entriesResponse, goalsResponse] = await Promise.all([
          apiRequest<DailyEntry[]>(user, "/api/entries"),
          apiRequest<MetricDefinition[]>(user, "/api/goals?status=all"),
        ]);

        setEntries(
          [...entriesResponse].sort((a, b) => b.date.localeCompare(a.date)),
        );
        setGoals(goalsResponse);
      } catch (error) {
        console.error(error);
        toast.error("Fetching logs failed");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  const totalWeights = goals
    .filter((goal) => goal.status !== "archived")
    .reduce((sum, goal) => sum + goal.weight, 0);

  const percentOf = (entry: DailyEntry) => {
    const max = entry.maxScore ?? totalWeights;

    return (
      entry.scorePercent ?? (max > 0 ? ((entry.score ?? 0) / max) * 100 : 0)
    );
  };

  const months = useMemo(() => {
    const groups: { month: string; entries: DailyEntry[] }[] = [];

    for (const entry of entries.slice(0, visible)) {
      const month = monthLabel(entry.date);
      const last = groups[groups.length - 1];

      if (last?.month === month) {
        last.entries.push(entry);
      } else {
        groups.push({ month, entries: [entry] });
      }
    }

    return groups;
  }, [entries, visible]);

  if (loading) {
    return (
      <AppShell>
        <PageSkeleton tabs rows={4} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-screen-sm space-y-4 px-4 pt-4 pb-28">
        <InsightsSubNav />

        <PageHeader title="Logs" description="Every day you have logged" />

        {goals.length === 0 ? (
          <div className="bg-card rounded-2xl border p-8 text-center">
            <h2 className="text-lg font-semibold">No goals yet</h2>

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
        ) : entries.length === 0 ? (
          <div className="text-muted-foreground rounded-2xl border p-8 text-center text-sm">
            No entries yet.
          </div>
        ) : (
          months.map(({ month, entries: monthEntries }) => {
            const average =
              monthEntries.reduce((sum, entry) => sum + percentOf(entry), 0) /
              monthEntries.length;

            return (
              <section key={month} className="space-y-2">
                <div className="flex items-baseline justify-between px-1">
                  <h2 className="text-sm font-semibold">{month}</h2>
                  <span className="text-muted-foreground text-xs">
                    {monthEntries.length} days - avg {average.toFixed(0)}%
                  </span>
                </div>

                <div className="bg-card divide-y overflow-hidden rounded-2xl border">
                  {monthEntries.map((entry) => {
                    const isOpen = expanded === entry.date;
                    const percent = percentOf(entry);
                    const max = entry.maxScore ?? totalWeights;
                    const items = (entry.breakdown ?? []).flatMap((item) => {
                      const goal = goals.find((g) => g.id === item.metricId);

                      return goal ? [{ goal, item }] : [];
                    });
                    const categories = Array.from(
                      new Set(items.map(({ goal }) => goal.category)),
                    );

                    return (
                      <div key={entry.date}>
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          onClick={() =>
                            setExpanded(isOpen ? null : entry.date)
                          }
                          className="active:bg-accent w-full px-4 py-3 text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold">
                                {dayLabel(entry.date)}
                              </p>

                              {(entry.xp ?? 0) > 0 ? (
                                <p className="text-good text-xs">
                                  +{(entry.xp ?? 0).toFixed(0)} bonus
                                </p>
                              ) : null}
                            </div>

                            <p className="text-sm">
                              <span className="font-semibold">
                                {(entry.score ?? 0).toFixed(0)}
                              </span>
                              <span className="text-muted-foreground">
                                {" "}
                                / {max} - {percent.toFixed(0)}%
                              </span>
                            </p>

                            <ChevronDown
                              className={cn(
                                "text-muted-foreground h-4 w-4 shrink-0 transition-transform",
                                isOpen && "rotate-180",
                              )}
                            />
                          </div>

                          <div className="bg-muted mt-2 h-1.5 overflow-hidden rounded-full">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                toneClass(percent),
                              )}
                              style={{ width: `${Math.min(percent, 100)}%` }}
                            />
                          </div>
                        </button>

                        {isOpen ? (
                          <div className="space-y-4 border-t px-4 py-4">
                            {categories.map((category) => (
                              <div key={category}>
                                <h3 className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-wider uppercase">
                                  {category}
                                </h3>

                                <div className="space-y-1.5">
                                  {items
                                    .filter(
                                      ({ goal }) => goal.category === category,
                                    )
                                    .map(({ goal, item }) => (
                                      <div
                                        key={goal.id}
                                        className="bg-background flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5"
                                      >
                                        <div className="min-w-0">
                                          <p className="truncate text-sm font-medium">
                                            {goal.label}
                                            {goal.status === "archived" ? (
                                              <span className="bg-muted text-muted-foreground ml-2 rounded-full px-2 py-0.5 text-[10px] font-normal">
                                                Removed
                                              </span>
                                            ) : null}
                                          </p>

                                          <p className="text-muted-foreground text-xs">
                                            {formatValue(item.value)}
                                            {goal.unit ? ` ${goal.unit}` : ""}
                                          </p>
                                        </div>

                                        <p className="shrink-0 text-sm">
                                          <span className="text-primary font-semibold">
                                            {item.score.toFixed(1)}
                                          </span>
                                          <span className="text-muted-foreground">
                                            {" "}
                                            / {item.weight}
                                          </span>
                                        </p>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            ))}

                            <Link
                              href={`/today?date=${entry.date}`}
                              className={cn(
                                buttonVariants({ variant: "outline" }),
                                "h-11 w-full",
                              )}
                            >
                              Edit this day
                            </Link>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}

        {entries.length > visible ? (
          <Button
            variant="outline"
            className="h-11 w-full"
            onClick={() => setVisible((count) => count + PAGE_SIZE)}
          >
            Show more
          </Button>
        ) : null}
      </div>
    </AppShell>
  );
}
