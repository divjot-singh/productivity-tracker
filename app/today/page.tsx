"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";

import AppShell from "@/components/layout/AppShell";
import MetricInput, { EntryFormValue } from "@/components/today/MetricInput";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";

import { MetricDefinition, MetricValue } from "@/models/metric";

import { calculateScore } from "@/lib/scoring/scoring-engine";
import { apiRequest } from "@/lib/api/client";
import TodayStatusBar from "@/components/today/TodayStatusBar";
import DateSelector from "@/components/today/DateSelector";
import ReviewEntrySheet from "@/components/today/ReviewEntrySheet";
import {
  getEmptyFormValues,
  hasEntryValues,
  normalizeEntryValues,
} from "@/lib/today/utils";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type EntryValues = Record<string, EntryFormValue>;

interface ExistingEntry {
  date: string;
  values: Record<string, MetricValue>;
  score: number;
  xp: number;
}

export default function TodayPage() {
  const { user } = useAuth();

  const [metrics, setMetrics] = useState<MetricDefinition[]>([]);

  const [values, setValues] = useState<EntryValues>({});

  const [loading, setLoading] = useState(true);

  const [previewOpen, setPreviewOpen] = useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [entryDates, setEntryDates] = useState<Set<string>>(new Set());

  const [currentEntryExists, setCurrentEntryExists] = useState(false);

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
        setValues(getEmptyFormValues(currentMetrics));
        setCurrentEntryExists(false);
      }
    },
    [user],
  );

  useEffect(() => {
    async function loadAll() {
      if (!user) return;

      await loadEntryForDate(selectedDate, metrics);
      await loadEntryDates(selectedDate);
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

        const goals = await apiRequest<MetricDefinition[]>(user, "/api/goals");

        setMetrics(goals);
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
    setValues((previous) => ({
      ...previous,
      [metricId]: value,
    }));
  }

  function handleReset() {
    setValues(getEmptyFormValues(metrics));
    setResetDialogOpen(false);
  }

  async function handleSave() {
    if (!user) {
      return;
    }

    try {
      setSaving(true);

      const data = await apiRequest<{
        score: number;
        xp: number;
      }>(user, "/api/entries", {
        method: "POST",
        body: {
          date: selectedDate,
          values: normalizedValues,
        },
      });

      toast.success(
        `Saved successfully.\nScore: ${data.score}\nXP: ${data.xp}`,
      );

      setPreviewOpen(false);
      //setValues(getEmptyFormValues(metrics));
      setCurrentEntryExists(true);
      setEntryDates((previous) => new Set(previous).add(selectedDate));
    } catch (err) {
      console.error(err);
      toast.error("Failed to save entry");
    } finally {
      setSaving(false);
    }
  }
  const dateLabel = format(parseISO(selectedDate), "d MMM yyyy");

  if (loading) {
    return (
      <AppShell>
        <div className="text-muted-foreground p-6 text-sm">
          Loading {dateLabel}&apos;s entry...
        </div>
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

  return (
    <AppShell mainClass="overflow-hidden">
      <div className="mx-auto flex h-[calc(100dvh-5rem-4rem-env(safe-area-inset-bottom))] min-h-0 w-full max-w-screen-sm flex-col overflow-hidden lg:h-[calc(100dvh-4rem)]">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mb-2 px-4 pt-3 pb-2">
            <h1 className="mb-1 text-xl font-bold tracking-tight">
              {dateLabel}&apos;s Entry
            </h1>

            <p className="text-muted-foreground text-xs">
              Record your daily habits
            </p>
          </div>

          <div className="px-4 pb-3">
            <DateSelector
              selectedDate={selectedDate}
              hasEntry={currentEntryExists}
              entryDates={entryDates}
              onChange={setSelectedDate}
            />
          </div>

          {/* Status bar - ONLY sticky element */}
          <TodayStatusBar
            dateLabel={dateLabel}
            totalScore={scoreResult.totalScore}
            totalWeights={scoreResult.totalWeights}
            totalXP={scoreResult.totalXP}
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

        {/* Buttons - always visible */}
        <div className="bg-background shrink-0 border-t p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="flex gap-3">
            <AlertDialog
              open={resetDialogOpen}
              onOpenChange={setResetDialogOpen}
            >
              <Button
                variant="outline"
                className="h-12 flex-1"
                disabled={!hasEntryValues(metrics, values)}
                onClick={() => setResetDialogOpen(true)}
              >
                Reset
              </Button>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset entry?</AlertDialogTitle>

                  <AlertDialogDescription>
                    All currently entered values will be cleared. This will not
                    delete any previously saved entry.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>

                  <AlertDialogAction onClick={handleReset}>
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              className="h-12 flex-[2]"
              onClick={() => setPreviewOpen(true)}
            >
              Review & Save
            </Button>
          </div>
        </div>
      </div>

      <ReviewEntrySheet
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        selectedDate={selectedDate}
        metrics={metrics}
        values={values}
        scoreResult={scoreResult}
        saving={saving}
        onSave={handleSave}
      />
    </AppShell>
  );
}
