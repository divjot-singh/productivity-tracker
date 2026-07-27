"use client";

import { useEffect, useMemo, useState } from "react";

import AppShell from "@/components/layout/AppShell";
import MetricInput from "@/components/today/MetricInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useAuth } from "@/contexts/AuthContext";

import { MetricDefinition, MetricValue } from "@/models/metric";

import { calculateScore } from "@/lib/scoring/scoring-engine";

type EntryValues = Record<string, MetricValue>;

export default function TodayPage() {
  const { user } = useAuth();

  const [metrics, setMetrics] = useState<MetricDefinition[]>([]);

  const [values, setValues] = useState<EntryValues>({});

  const [loading, setLoading] = useState(true);

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
        const token = await user.getIdToken();

        const response = await fetch("/api/config", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load configuration");
        }

        const config = await response.json();

        const loadedMetrics = (config?.metrics as MetricDefinition[]) ?? [];

        setMetrics(loadedMetrics);

        const initialValues: EntryValues = {};

        loadedMetrics.forEach((metric) => {
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
      const token = await user.getIdToken();

      const response = await fetch("/api/entries", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          date: selectedDate,

          values,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save entry");
      }

      const data = await response.json();

      alert(`Saved successfully.\nScore: ${data.score}\nXP: ${data.xp}`);
    } catch (err) {
      console.error(err);

      alert("Failed to save entry");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="text-muted-foreground p-6 text-sm">
          Loading today's entry...
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
      <div className="mx-auto w-full max-w-screen-sm space-y-8 px-4 pt-4 pb-28">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Today's Entry</h1>

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
              {scoreResult.totalScore}
            </p>
          </div>

          <div className="bg-card rounded-xl border p-4">
            <p className="text-muted-foreground text-sm">XP</p>

            <p className="text-primary mt-2 text-3xl font-bold">
              {scoreResult.totalXP}
            </p>
          </div>
        </div>

        {Object.entries(groupedMetrics).map(([category, list]) => (
          <section key={category} className="space-y-4">
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

        <Button className="h-12 w-full" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Entry"}
        </Button>
      </div>
    </AppShell>
  );
}
