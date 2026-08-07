"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import AppShell from "@/components/layout/AppShell";
import Section from "@/components/ui/section";
import { buttonVariants } from "@/components/ui/button";

import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { MetricDefinition } from "@/models/metric";
import QuickActions from "@/components/settings/QuickActions";
import SettingsSubNav from "@/components/settings/SettingsSubNav";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

export default function SettingsPage() {
  const { user } = useRequireAuth();

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

        <Link
          href="/settings/weight-breakdown"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "mb-6 w-full py-1",
          )}
        >
          See breakdown
          <ChevronRight size={18} />
        </Link>

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
