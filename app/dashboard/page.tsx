"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/common/PageHeader";
import InsightsSubNav from "@/components/layout/InsightsSubNav";
import DashboardVisualizationRenderer from "@/components/dashboard/visualization-renderer";
import { buttonVariants } from "@/components/ui/button";

import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { apiRequest } from "@/lib/api/client";
import { getOnboardingSkipped } from "@/lib/onboarding";
import { cn } from "@/lib/utils";
import { MetricDefinition } from "@/models/metric";
import { VisualizationResponse } from "@/models/visualization";
import {
  matchesScoreView,
  type ScoreView,
} from "@/lib/visualizations/auto-presets";

const SCORE_VIEW_KEY = "daylog-score-view";

const SCORE_VIEWS: { id: ScoreView; label: string }[] = [
  { id: "score", label: "Score" },
  { id: "percent", label: "Percent" },
  { id: "both", label: "Both" },
];

function readScoreView(): ScoreView {
  try {
    const stored = localStorage.getItem(SCORE_VIEW_KEY);

    return stored === "score" || stored === "percent" ? stored : "both";
  } catch {
    return "both";
  }
}

export default function Dashboard() {
  const { user, loading } = useRequireAuth();
  const router = useRouter();

  const [visualizations, setVisualizations] = useState<VisualizationResponse[]>(
    [],
  );

  const [loadingDashboard, setLoadingDashboard] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Only rendered after client-side loading, so reading storage here cannot mismatch server HTML.
  const [scoreView, setScoreView] = useState<ScoreView>(readScoreView);

  function changeScoreView(next: ScoreView) {
    setScoreView(next);

    try {
      localStorage.setItem(SCORE_VIEW_KEY, next);
    } catch {
      // Storage can be blocked; the choice still applies for this visit.
    }
  }

  const shown = visualizations.filter((visualization) =>
    matchesScoreView(visualization.id, scoreView),
  );

  useEffect(() => {
    async function load() {
      if (!user) {
        return;
      }

      try {
        setLoadingDashboard(true);
        setError(null);

        const goals = await apiRequest<MetricDefinition[]>(
          user,
          "/api/goals?status=all",
        );

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
        setError("Unable to load insights.");
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
          title="Insights"
          description="Monitor your daily consistency and long-term progress."
        />

        <InsightsSubNav />

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
        title="Insights"
        description="Monitor your daily consistency and long-term progress."
      />

      <InsightsSubNav />

      {error ? (
        <div className="border-destructive text-destructive mt-6 rounded-xl border p-4">
          {error}
        </div>
      ) : visualizations.length === 0 ? (
        <div className="bg-card mt-6 rounded-2xl border p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Add a goal and log a day to see your insights.
          </p>

          <Link
            href="/settings/add"
            className={cn(buttonVariants({ size: "sm" }), "mt-4")}
          >
            Add a goal
          </Link>
        </div>
      ) : (
        <>
          <div
            role="group"
            aria-label="Score display"
            className="bg-muted/60 border-border mt-2 inline-flex gap-1 rounded-xl border p-1"
          >
            {SCORE_VIEWS.map((view) => (
              <button
                key={view.id}
                type="button"
                aria-pressed={scoreView === view.id}
                onClick={() => changeScoreView(view.id)}
                className={cn(
                  "min-h-8 rounded-lg px-3 text-sm font-medium transition-colors",
                  scoreView === view.id
                    ? "bg-primary/15 text-primary ring-primary/30 font-semibold ring-1 ring-inset"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {view.label}
              </button>
            ))}
          </div>

          <div className="mt-4 grid min-w-0 gap-4 pb-26 sm:gap-6 xl:grid-cols-2">
            {shown.map((visualization) => (
              <DashboardVisualizationRenderer
                key={visualization.id}
                visualization={visualization}
              />
            ))}
          </div>
        </>
      )}
    </AppShell>
  );
}
