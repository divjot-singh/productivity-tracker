"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/common/PageHeader";
import DashboardVisualizationRenderer from "@/components/dashboard/visualization-renderer";
import { buttonVariants } from "@/components/ui/button";

import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { apiRequest } from "@/lib/api/client";
import { getOnboardingSkipped } from "@/lib/onboarding";
import { cn } from "@/lib/utils";
import { MetricDefinition } from "@/models/metric";
import { VisualizationResponse } from "@/models/visualization";

export default function Dashboard() {
  const { user, loading } = useRequireAuth();
  const router = useRouter();

  const [visualizations, setVisualizations] = useState<VisualizationResponse[]>(
    [],
  );

  const [loadingDashboard, setLoadingDashboard] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!user) {
        return;
      }

      try {
        setLoadingDashboard(true);
        setError(null);

        const goals = await apiRequest<MetricDefinition[]>(user, "/api/goals");

        if (goals.length === 0 && !getOnboardingSkipped()) {
          router.replace("/onboarding");
          return;
        }

        const response = await apiRequest<VisualizationResponse[]>(
          user,
          "/api/dashboard",
        );

        setVisualizations(response);
      } catch (err) {
        console.error(err);
        setError("Unable to load dashboard.");
      } finally {
        setLoadingDashboard(false);
      }
    }

    load();
  }, [router, user]);

  if (loading || loadingDashboard || !user) {
    return (
      <AppShell>
        <PageHeader
          title="Dashboard"
          description="Monitor your daily consistency and long-term progress."
        />

        <div className="mt-6 grid min-w-0 gap-4 pb-28 sm:gap-6 xl:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className={`bg-card/75 animate-pulse rounded-[28px] border border-white/8 p-5 ${
                index >= 4 ? "xl:col-span-2" : ""
              }`}
            >
              <div className="bg-muted h-4 w-28 rounded" />
              <div className="bg-muted mt-3 h-9 w-20 rounded" />
              <div className="bg-muted mt-6 h-32 rounded-2xl" />
            </div>
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description="Monitor your daily consistency and long-term progress."
      />

      {error ? (
        <div className="border-destructive text-destructive mt-6 rounded-xl border p-4">
          {error}
        </div>
      ) : visualizations.length === 0 ? (
        <div className="bg-card mt-6 rounded-2xl border p-8 text-center">
          <p className="text-muted-foreground text-sm">
            No visualizations yet.
          </p>

          <Link
            href="/settings/visualizations/new"
            className={cn(buttonVariants({ size: "sm" }), "mt-4")}
          >
            Create visualization
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid min-w-0 gap-4 pb-26 sm:gap-6 xl:grid-cols-2">
          {visualizations.map((visualization) => (
            <DashboardVisualizationRenderer
              key={visualization.id}
              visualization={visualization}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
