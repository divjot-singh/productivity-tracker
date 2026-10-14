"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";

import AppShell from "@/components/layout/AppShell";
import PageSkeleton from "@/components/common/PageSkeleton";
import MetricInput, { EntryFormValue } from "@/components/today/MetricInput";
import { Eraser, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

import { useRequireAuth } from "@/lib/hooks/useRequireAuth";

import { MetricDefinition, MetricValue } from "@/models/metric";

import { resolveGoalsForDate } from "@/lib/mappers/goal.mapper";
import { calculateScore } from "@/lib/scoring/scoring-engine";
import { apiRequest } from "@/lib/api/client";
import TodayStatusBar from "@/components/today/TodayStatusBar";
import DateSelector from "@/components/today/DateSelector";
import WorkoutSummaryCard from "@/components/today/WorkoutSummaryCard";
import { buttonVariants } from "@/components/ui/button";
import {
  getEmptyFormValues,
  hasEntryValues,
  normalizeEntryValues,
} from "@/lib/today/utils";
import { cn } from "@/lib/utils";
import { localDate } from "@/lib/dates";

type EntryValues = Record<string, EntryFormValue>;

type SaveState = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_DELAY_MS = 900;

interface ExistingEntry {
  date: string;
  values: Record<string, MetricValue>;
  score: number;
  xp: number;
}

export default function TodayPage() {
  const { user } = useRequireAuth();

  const [allGoals, setAllGoals] = useState<MetricDefinition[]>([]);

  const [values, setValues] = useState<EntryValues>({});

  const [loading, setLoading] = useState(true);

  const [saveState, setSaveState] = useState<SaveState>("idle");

  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState(localDate());

  const [entryDates, setEntryDates] = useState<Set<string>>(new Set());

  const [currentEntryExists, setCurrentEntryExists] = useState(false);
  const [isDateRefreshing, setIsDateRefreshing] = useState(false);

  const selectedDateRef = useRef(selectedDate);
  const requestIdRef = useRef(0);
  const dirtyRef = useRef(false);
  const valuesRef = useRef<EntryValues>({});
  const metricsRef = useRef<MetricDefinition[]>([]);

  const metrics = useMemo(
    () => resolveGoalsForDate(allGoals, selectedDate),
    [allGoals, selectedDate],
  );

  useEffect(() => {
    selectedDateRef.current = selectedDate;
  }, [selectedDate]);

  const loadEntryDates = useCallback(
    async (date: string) => {
      if (!user) return;

      try {
        const start = format(startOfMonth(parseISO(date)), "yyyy-MM-dd");
        const end = format(endOfMonth(parseISO(date)), "yyyy-MM-dd");

        const response = await apiRequest<{ dates: string[] }>(
          user,
          `/api/entries?from=${start}&to=${end}`,
        );

        if (date !== selectedDateRef.current) {
          return;
        }

        setEntryDates(new Set(response.dates));
      } catch (err) {
        console.error("Failed to load entry dates", err);
      }
    },
    [user],
  );

  const loadEntryForDate = useCallback(
    async (date: string, currentMetrics: MetricDefinition[]) => {
      if (!user) return;

      try {
        const entry = await apiRequest<ExistingEntry | null>(
          user,
          `/api/entries?date=${date}`,
        );

        if (date !== selectedDateRef.current) {
          return;
        }

        if (entry?.values) {
          const nextValues: EntryValues = getEmptyFormValues(currentMetrics);

          currentMetrics.forEach((metric) => {
            const saved = entry.values[metric.id];
            if (saved !== undefined) {
              nextValues[metric.id] = saved;
            }
          });

          setValues(nextValues);
          setCurrentEntryExists(true);
        } else {
          setValues(getEmptyFormValues(currentMetrics));
          setCurrentEntryExists(false);
        }
      } catch (err) {
        console.error("Failed to load entry", err);

        if (date !== selectedDateRef.current) {
          return;
        }

        setValues(getEmptyFormValues(currentMetrics));
        setCurrentEntryExists(false);
      }
    },
    [user],
  );

  useEffect(() => {
    async function loadAll() {
      if (!user) return;

      const requestId = ++requestIdRef.current;
      setIsDateRefreshing(true);

      await Promise.all([
        loadEntryForDate(selectedDate, metrics),
        loadEntryDates(selectedDate),
      ]);

      if (
        requestId === requestIdRef.current &&
        selectedDate === selectedDateRef.current
      ) {
        setIsDateRefreshing(false);
      }
    }

    loadAll();
  }, [user, metrics, selectedDate, loadEntryForDate, loadEntryDates]);

  useEffect(() => {
    async function loadMetrics() {
      if (!user) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const goals = await apiRequest<MetricDefinition[]>(
          user,
          "/api/goals?status=all",
        );

        setAllGoals(goals);
      } catch (err) {
        console.error(err);
        setError("Unable to load today's configuration.");
      } finally {
        setLoading(false);
      }
    }

    loadMetrics();
  }, [user]);

  const groupedMetrics = useMemo(() => {
    return metrics.reduce(
      (acc, metric) => {
        if (!acc[metric.category]) {
          acc[metric.category] = [];
        }

        acc[metric.category].push(metric);

        return acc;
      },
      {} as Record<string, MetricDefinition[]>,
    );
  }, [metrics]);

  const normalizedValues = useMemo(
    () => normalizeEntryValues(metrics, values),
    [metrics, values],
  );

  const scoreResult = useMemo(() => {
    if (!metrics.length) {
      return {
        totalScore: 0,
        totalXP: 0,
        metrics: [],
        totalWeights: 0,
      };
    }

    return calculateScore(metrics, normalizedValues);
  }, [metrics, normalizedValues]);

  function updateValue(metricId: string, value: EntryFormValue) {
    dirtyRef.current = true;
    setSaveState("idle");

    setValues((previous) => ({
      ...previous,
      [metricId]: value,
    }));
  }

  const persist = useCallback(async () => {
    if (!user || !dirtyRef.current) {
      return;
    }

    const date = selectedDateRef.current;
    const payload = normalizeEntryValues(metricsRef.current, valuesRef.current);

    dirtyRef.current = false;
    setSaveState("saving");

    try {
      await apiRequest(user, "/api/entries", {
        method: "POST",
        body: { date, values: payload },
      });

      setCurrentEntryExists(true);
      setEntryDates((previous) => new Set(previous).add(date));
      setSaveState(date === selectedDateRef.current ? "saved" : "idle");
    } catch (err) {
      console.error(err);
      dirtyRef.current = true;
      setSaveState("error");
      toast.error("Could not save. Will retry on your next change.");
    }
  }, [user]);

  useEffect(() => {
    valuesRef.current = values;
    metricsRef.current = metrics;
  }, [values, metrics]);

  useEffect(() => {
    if (!dirtyRef.current) {
      return;
    }

    const timer = setTimeout(persist, AUTOSAVE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [values, persist]);

  async function handleDateChange(next: string) {
    await persist();
    setSaveState("idle");
    setSelectedDate(next);
  }

  async function handleReset() {
    if (!user) {
      return;
    }

    const previous = values;
    const date = selectedDate;

    dirtyRef.current = false;
    setValues(getEmptyFormValues(metrics));

    if (currentEntryExists) {
      try {
        await apiRequest(user, `/api/entries?date=${date}`, {
          method: "DELETE",
        });

        setCurrentEntryExists(false);
        setEntryDates((existing) => {
          const next = new Set(existing);
          next.delete(date);
          return next;
        });
      } catch (err) {
        console.error(err);
        setValues(previous);
        toast.error("Could not clear the entry");
        return;
      }
    }

    setSaveState("idle");

    toast("Entry cleared", {
      action: {
        label: "Undo",
        onClick: () => {
          if (selectedDateRef.current !== date) {
            return;
          }

          dirtyRef.current = true;
          setValues(previous);
        },
      },
    });
  }
  const dateLabel = format(parseISO(selectedDate), "d MMM yyyy");

  if (loading) {
    return (
      <AppShell>
        <PageSkeleton rows={6} />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="p-6 text-sm text-red-400">{error}</div>
      </AppShell>
    );
  }

  if (metrics.length === 0) {
    return (
      <AppShell>
        <div className="mx-auto w-full max-w-screen-sm px-4 pt-4 pb-28">
          <div className="bg-card rounded-2xl border p-8 text-center">
            <h1 className="text-xl font-semibold">No goals yet</h1>

            <p className="text-muted-foreground mt-2 text-sm">
              Create at least one goal to start logging daily entries.
            </p>

            <Link
              href="/settings/add"
              className={cn(buttonVariants({ size: "sm" }), "mt-4")}
            >
              Create goals
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto flex h-[calc(100dvh-5rem-4rem-env(safe-area-inset-bottom))] min-h-0 w-full max-w-screen-sm flex-col overflow-hidden lg:h-[calc(100dvh-4rem)]">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mb-2 flex items-start justify-between gap-3 px-4 pt-3 pb-2">
            <div className="min-w-0">
              <h1 className="mb-1 text-xl font-bold tracking-tight">
                {dateLabel}&apos;s Entry
              </h1>

              <p className="text-muted-foreground text-xs">
                Record your daily habits
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <span
                aria-live="polite"
                className={cn(
                  "text-xs",
                  saveState === "error"
                    ? "text-destructive"
                    : "text-muted-foreground",
                )}
              >
                {saveState === "saving"
                  ? "Saving..."
                  : saveState === "saved"
                    ? "Saved"
                    : saveState === "error"
                      ? "Not saved"
                      : ""}
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Day options"
                  className="text-muted-foreground hover:text-foreground hover:bg-accent flex h-9 w-9 items-center justify-center rounded-full transition-colors"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={!hasEntryValues(metrics, values)}
                    onClick={handleReset}
                  >
                    <Eraser className="mr-2 h-4 w-4" />
                    Clear this day
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="px-4 pb-3">
            <DateSelector
              selectedDate={selectedDate}
              hasEntry={currentEntryExists}
              entryDates={entryDates}
              onChange={handleDateChange}
            />
          </div>

          <div className="px-4 pb-3">
            <WorkoutSummaryCard date={selectedDate} />
          </div>

          {/* Status bar - ONLY sticky element */}
          <TodayStatusBar
            dateLabel={dateLabel}
            totalScore={scoreResult.totalScore}
            totalWeights={scoreResult.totalWeights}
            totalXP={scoreResult.totalXP}
            isRefreshing={isDateRefreshing}
          />

          {/* Metrics - scroll */}
          <div className="px-4 py-4">
            {Object.entries(groupedMetrics).map(([category, list]) => (
              <section key={category} className="mb-5 space-y-3">
                <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  {category}
                </h2>

                {list
                  .toSorted((a, b) => a.displayOrder - b.displayOrder)
                  .map((metric) => (
                    <MetricInput
                      key={metric.id}
                      metric={metric}
                      value={values[metric.id]}
                      onChange={(value) => updateValue(metric.id, value)}
                    />
                  ))}
              </section>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
