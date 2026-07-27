"use client";

import { useEffect, useMemo, useState } from "react";

import AppShell from "@/components/layout/AppShell";
import Section from "@/components/ui/section";

import { useAuth } from "@/contexts/AuthContext";
import { MetricDefinition } from "@/models/metric";

export default function SettingsPage() {
  const { user } = useAuth();

  const [metrics, setMetrics] = useState<MetricDefinition[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) {
        return;
      }

      try {
        const token = await user.getIdToken();

        const response = await fetch("/api/config", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load config");
        }

        const config = await response.json();

        setMetrics(config?.metrics ?? []);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

  const grouped = useMemo(() => {
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

  if (loading) {
    return (
      <AppShell>
        <div className="text-muted-foreground p-6 text-sm">
          Loading configuration...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-screen-sm px-4 pt-4 pb-28">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Goals</h1>

          <p className="text-muted-foreground mt-1 text-sm">
            Current productivity configuration
          </p>
        </div>

        <div className="space-y-8">
          {Object.entries(grouped).map(([category, values]) => (
            <Section
              key={category}
              category={category}
              metrics={values.sort((a, b) => a.displayOrder - b.displayOrder)}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
