"use client";

import { useEffect, useMemo, useState } from "react";

import AppShell from "@/components/layout/AppShell";
import Section from "@/components/ui/section";

import { useAuth } from "@/contexts/AuthContext";
import { MetricDefinition } from "@/models/metric";
import QuickActions from "@/components/settings/QuickActions";
import SettingsSubNav from "@/components/settings/SettingsSubNav";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api/client";

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
        const goals = await apiRequest<MetricDefinition[]>(user, "/api/goals");
        setMetrics(goals ?? []);
      } catch (e) {
        console.log(e);
        toast.error("Fetching logs failed");
        return;
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
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

          <p className="text-muted-foreground mt-1 text-sm">
            Manage your goals and dashboard visualizations
          </p>
        </div>

        <SettingsSubNav />

        <QuickActions />

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
