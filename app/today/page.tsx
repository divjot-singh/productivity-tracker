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
import GettingStarted from "@/components/today/GettingStarted";
import { buttonVariants } from "@/components/ui/button";
import {
  getEmptyFormValues,
  hasEntryValues,
  normalizeEntryValues,
} from "@/lib/today/utils";
import { cn } from "@/lib/utils";
import { localDate } from "@/lib/dates";
import { isMorningGoal, orderTodayGoals } from "@/lib/today/goal-order";

type EntryValues = Record<string, EntryFormValue>;

type SaveState = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_DELAY_MS = 900;

interface ExistingEntry {
  date: string;
  values: Record<string, MetricValue>;
  score: number;
  xp: number;
  answeredGoalIds?: string[];
}

export default function TodayPage() {
  const { user } = useRequireAuth();

  const [allGoals, setAllGoals] = useState<MetricDefinition[]>([]);

  const [hasAnyWorkout, setHasAnyWorkout] = useState<boolean | null>(null);

  const [values, setValues] = useState<EntryValues>({});
  const [answeredGoalIds, setAnsweredGoalIds] = useState<Set<string>>(
    new Set(),
  );

  const [loading, setLoading] = useState(true);

  const [saveState, setSaveState] = useState<SaveState>("idle");

  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState(() => {
    const requested =
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("date");

    return requested &&
      /^\d{4}-\d{2}-\d{2}$/.test(requested) &&
      requested <= localDate()
      ? requested
      : localDate();
  });

  const [entryDates, setEntryDates] = useState<Set<string>>(new Set());

  const [currentEntryExists, setCurrentEntryExists] = useState(false);
  const [isDateRefreshing, setIsDateRefreshing] = useState(false);

  const selectedDateRef = useRef(selectedDate);
  const requestIdRef = useRef(0);
  const dirtyRef = useRef(false);
  const valuesRef = useRef<EntryValues>({});
  const answeredGoalIdsRef = useRef<Set<string>>(new Set());
  const editedMorningRef = useRef<Set<string>>(new Set());
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
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
          const answered = new Set(entry.answeredGoalIds ?? []);
          answeredGoalIdsRef.current = answered;
          setAnsweredGoalIds(answered);
          editedMorningRef.current.clear();
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
          answeredGoalIdsRef.current = new Set();
          setAnsweredGoalIds(new Set());
          editedMorningRef.current.clear();
          setValues(getEmptyFormValues(currentMetrics));
          setCurrentEntryExists(false);
        }
      } catch (err) {
        console.error("Failed to load entry", err);

        if (date !== selectedDateRef.current) {
          return;
        }

        answeredGoalIdsRef.current = new Set();
        setAnsweredGoalIds(new Set());
        editedMorningRef.current.clear();
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
    if (!user) {
      return;
    }

    apiRequest<unknown[]>(user, "/api/workouts?limit=1")
      .then((workouts) => setHasAnyWorkout(workouts.length > 0))
      .catch(() => setHasAnyWorkout(true));
  }, [user]);

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

  const orderedMetrics = useMemo(
    () => orderTodayGoals(metrics, answeredGoalIds),
    [metrics, answeredGoalIds],
  );

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

  function markAnswered(metricId: string) {
    if (answeredGoalIdsRef.current.has(metricId)) return;
    const next = new Set(answeredGoalIdsRef.current).add(metricId);
    answeredGoalIdsRef.current = next;
    setAnsweredGoalIds(next);
    dirtyRef.current = true;
    setSaveState("idle");
  }

  function unmarkAnswered(metricId: string) {
    if (!answeredGoalIdsRef.current.has(metricId)) return;
    const next = new Set(answeredGoalIdsRef.current);
    next.delete(metricId);
    answeredGoalIdsRef.current = next;
    setAnsweredGoalIds(next);
    dirtyRef.current = true;
    setSaveState("idle");
  }

  function updateValue(metric: MetricDefinition, value: EntryFormValue) {
    dirtyRef.current = true;
    setSaveState("idle");

    const next = { ...valuesRef.current, [metric.id]: value };
    valuesRef.current = next;
    setValues(next);
    if (metric.type === "boolean") markAnswered(metric.id);
    if (isMorningGoal(metric)) editedMorningRef.current.add(metric.id);
  }

  const persist = useCallback(async () => {
    if (!user) {
      return;
    }

    if (!dirtyRef.current) {
      await saveQueueRef.current;
      return;
    }

    const date = selectedDateRef.current;
    const payload = normalizeEntryValues(metricsRef.current, valuesRef.current);
    const answered = [...answeredGoalIdsRef.current];

    dirtyRef.current = false;
    setSaveState("saving");

    const save = saveQueueRef.current.then(async () => {
      try {
        await apiRequest(user, "/api/entries", {
          method: "POST",
          body: { date, values: payload, answeredGoalIds: answered },
        });

        setEntryDates((previous) => new Set(previous).add(date));
        if (date === selectedDateRef.current) {
          setCurrentEntryExists(true);
          if (!dirtyRef.current) setSaveState("saved");
        }
      } catch (err) {
        console.error(err);
        if (date === selectedDateRef.current) {
          dirtyRef.current = true;
          setSaveState("error");
          toast.error("Could not save. Will retry on your next change.");
        }
      }
    });
    saveQueueRef.current = save;
    await save;
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
  }, [values, answeredGoalIds, persist]);

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
    const previousAnswered = answeredGoalIds;
    const date = selectedDate;

    dirtyRef.current = false;
    await saveQueueRef.current;
    dirtyRef.current = false;
    const empty = getEmptyFormValues(metrics);
    valuesRef.current = empty;
    setValues(empty);
    answeredGoalIdsRef.current = new Set();
    setAnsweredGoalIds(new Set());
    editedMorningRef.current.clear();

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
        valuesRef.current = previous;
        setValues(previous);
        answeredGoalIdsRef.current = previousAnswered;
        setAnsweredGoalIds(previousAnswered);
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
          valuesRef.current = previous;
          setValues(previous);
          answeredGoalIdsRef.current = previousAnswered;
          setAnsweredGoalIds(previousAnswered);
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
                    disabled={
                      !hasEntryValues(metrics, values) &&
                      answeredGoalIds.size === 0
                    }
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

          <div className="space-y-3 px-4 pb-3">
            <GettingStarted
              hasGoals={allGoals.length > 0}
              hasEntry={entryDates.size > 0 || currentEntryExists}
              hasWorkout={hasAnyWorkout}
            />

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
            <div className="space-y-3">
              {orderedMetrics.map((metric) => (
                <div
                  key={metric.id}
                  onBlur={(event) => {
                    if (event.currentTarget.contains(event.relatedTarget))
                      return;
                    if (editedMorningRef.current.delete(metric.id)) {
                      if (valuesRef.current[metric.id] === "")
                        unmarkAnswered(metric.id);
                      else markAnswered(metric.id);
                    }
                  }}
                >
                  <MetricInput
                    metric={metric}
                    value={values[metric.id]}
                    onChange={(value) => updateValue(metric, value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
