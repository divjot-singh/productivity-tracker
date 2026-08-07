"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import AppShell from "@/components/layout/AppShell";
import GoalWeightBreakdownChart from "@/components/settings/GoalWeightBreakdownChart";
import { buttonVariants } from "@/components/ui/button";

import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { MetricDefinition } from "@/models/metric";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export default function WeightBreakdownPage() {
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
      } catch (error) {
        console.error(error);
        toast.error("Failed to load goal breakdown");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

  if (loading) {
    return (
      <AppShell>
        <div className="text-muted-foreground p-6 text-sm">
          Loading breakdown...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-screen-sm px-4 pt-4 pb-28">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Goal Weight Breakdown
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Weight distribution across goals
            </p>
          </div>

          <Link
            href="/settings"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Back
          </Link>
        </div>

        <GoalWeightBreakdownChart metrics={metrics} />
      </div>
    </AppShell>
  );
}
