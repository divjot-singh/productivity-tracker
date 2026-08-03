"use client";

import { useEffect, useMemo, useState } from "react";

import AppShell from "@/components/layout/AppShell";
import MetricInput from "@/components/today/MetricInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";

import { MetricDefinition, MetricValue } from "@/models/metric";

import { calculateScore } from "@/lib/scoring/scoring-engine";
import { apiRequest } from "@/lib/api/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatValue } from "@/lib/utils";

type EntryValues = Record<string, MetricValue>;

export default function TodayPage() {
  const { user } = useAuth();

  const [metrics, setMetrics] = useState<MetricDefinition[]>([]);

  const [values, setValues] = useState<EntryValues>({});

  const [loading, setLoading] = useState(true);

  const [previewOpen, setPreviewOpen] = useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  useEffect(() => {
    async function load() {
      if (!user) {
        return;
      }

      try {
        setLoading(true);

        setError(null);
        const goals = await apiRequest<MetricDefinition[]>(user, "/api/goals");

        setMetrics(goals);

        const initialValues: EntryValues = {};

        goals.forEach((metric) => {
          initialValues[metric.id] = metric.defaultValue;
        });

        setValues(initialValues);
      } catch (err) {
        console.error(err);

        setError("Unable to load today's configuration.");
      } finally {
        setLoading(false);
      }
    }

    load();
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

  const scoreResult = useMemo(() => {
    if (!metrics.length) {
      return {
        totalScore: 0,
        totalXP: 0,
        metrics: [],
        totalWeights: 0,
      };
    }

    return calculateScore(metrics, values);
  }, [metrics, values]);

  function updateValue(metricId: string, value: MetricValue) {
    setValues((previous) => ({
      ...previous,
      [metricId]: value,
    }));
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
          values,
        },
      });

      toast.success(
        `Saved successfully.\nScore: ${data.score}\nXP: ${data.xp}`,
      );
    } catch (err) {
      console.error(err);

      toast.error("Failed to save entry");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="text-muted-foreground p-6 text-sm">
          Loading today&apos;s entry...
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
    <AppShell>
      <div className="mx-auto flex h-[calc(100vh-9rem)] w-full max-w-screen-sm flex-col">
        <div className="bg-background shrink-0 space-y-6 border-b px-4 py-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Today&apos;s Entry
            </h1>

            <p className="text-muted-foreground mt-1 text-sm">
              Record your daily habits
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Date</label>

            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-xl border p-4">
              <p className="text-muted-foreground text-sm">Life Score</p>

              <p className="text-primary mt-2 text-3xl font-bold">
                {scoreResult.totalScore} /{" "}
                <span className="text-2xl font-semibold">
                  {scoreResult.totalWeights}
                </span>
              </p>
            </div>

            <div className="bg-card rounded-xl border p-4">
              <p className="text-muted-foreground text-sm">XP</p>

              <p className="text-primary mt-2 text-3xl font-bold">
                {scoreResult.totalXP}
              </p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {Object.entries(groupedMetrics).map(([category, list]) => (
            <section key={category} className="mb-4 space-y-4">
              <h2 className="text-xl font-semibold capitalize">{category}</h2>

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
        <div className="bg-background shrink-0 border-t p-4">
          <Button className="h-12 w-full" onClick={() => setPreviewOpen(true)}>
            Review & Save
          </Button>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Today&apos;s Entry</DialogTitle>
            <DialogDescription>
              Confirm your entries before saving.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <div className="bg-card flex items-center justify-between rounded-2xl border px-4 py-3">
              <p className="font-medium">Date</p>
              <div className="text-right">
                <p className="text-primary text-m leading-none font-semibold">
                  {selectedDate.split("-").reverse().join("/")}
                </p>
              </div>
            </div>
            {metrics.map((metric) => {
              const result = scoreResult.metrics.find(
                (m) => m.metricId === metric.id,
              );

              return (
                <div
                  key={metric.id}
                  className="bg-card flex items-center justify-between rounded-2xl border px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{metric.label}</p>

                    <p className="text-muted-foreground text-sm">
                      {formatValue(values[metric.id])}
                      {metric.unit && ` ${metric.unit}`}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-primary text-xl leading-none font-semibold">
                      {result?.score.toFixed(1)} /{" "}
                      <span className="text-sm font-normal">
                        {result?.weight}
                      </span>
                    </p>

                    <p className="text-muted-foreground text-xs">pts</p>
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Cancel
            </Button>

            <Button
              disabled={saving}
              onClick={async () => {
                await handleSave();
                setPreviewOpen(false);
              }}
            >
              {saving ? "Saving..." : "Save Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
