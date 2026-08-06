"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AreaChart,
  BarChart3,
  ChevronRight,
  Eye,
  EyeOff,
  Goal,
  Grid2x2,
  LineChart,
  ListOrdered,
  Plus,
  Radar,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import SettingsSubNav from "@/components/settings/SettingsSubNav";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import {
  VisualizationDefinition,
  VisualizationScope,
  VisualizationWidget,
} from "@/models/visualization";
import { toast } from "sonner";

const SCOPE_LABELS: Record<VisualizationScope, string> = {
  global: "Global",
  goal: "Goals",
  category: "Categories",
};

const SCOPE_ORDER: VisualizationScope[] = ["global", "goal", "category"];

const SCOPE_COLORS: Record<VisualizationScope, string> = {
  global: "bg-green-500",
  goal: "bg-blue-500",
  category: "bg-orange-500",
};

const WIDGET_ICONS: Record<VisualizationWidget, typeof Goal> = {
  "stat-card": Goal,
  "progress-bar": TrendingUp,
  "progress-ring": TrendingUp,
  "line-chart": LineChart,
  "bar-chart": BarChart3,
  "area-chart": AreaChart,
  heatmap: Grid2x2,
  leaderboard: ListOrdered,
  timeline: Sparkles,
  "radar-chart": Radar,
  "insight-card": Sparkles,
};

export default function VisualizationsPage() {
  const { user } = useAuth();
  const [visualizations, setVisualizations] = useState<
    VisualizationDefinition[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;

      try {
        setLoading(true);
        const data = await apiRequest<VisualizationDefinition[]>(
          user,
          "/api/visualizations",
        );
        setVisualizations(data ?? []);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load visualizations");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

  const grouped = useMemo(() => {
    const groups: Record<VisualizationScope, VisualizationDefinition[]> = {
      global: [],
      goal: [],
      category: [],
    };

    for (const visualization of visualizations) {
      if (!groups[visualization.scope]) {
        continue;
      }

      groups[visualization.scope].push(visualization);
    }

    for (const scope of SCOPE_ORDER) {
      groups[scope].sort((a, b) => a.displayOrder - b.displayOrder);
    }

    return groups;
  }, [visualizations]);

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

        <div className="mb-8">
          <h2 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
            Quick Actions
          </h2>

          <div className="bg-card overflow-hidden rounded-2xl border">
            <Link
              href="/settings/visualizations/new"
              className="hover:bg-accent flex items-center gap-4 p-4 transition-colors"
            >
              <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl">
                <Plus size={20} />
              </div>

              <div className="flex-1">
                <p className="font-medium">Add Visualization</p>

                <p className="text-muted-foreground text-sm">
                  Create a custom visualization
                </p>
              </div>

              <ChevronRight size={18} className="text-muted-foreground" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-muted-foreground p-6 text-sm">
            Loading visualizations...
          </div>
        ) : visualizations.length === 0 ? (
          <div className="bg-card rounded-2xl border p-8 text-center">
            <p className="text-muted-foreground text-sm">
              No visualizations yet.
            </p>

            <Link
              href="/settings/visualizations/new"
              className={cn(buttonVariants({ size: "sm" }), "mt-4")}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Visualization
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {SCOPE_ORDER.map((scope) => {
              const items = grouped[scope];

              if (items.length === 0) {
                return null;
              }

              return (
                <section key={scope}>
                  <div className="mb-3 flex items-center gap-2">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${SCOPE_COLORS[scope]}`}
                    />

                    <h2 className="text-lg font-semibold">
                      {SCOPE_LABELS[scope]}
                    </h2>
                  </div>

                  <div className="bg-card overflow-hidden rounded-2xl border border-zinc-800">
                    {items.map((visualization) => (
                      <VisualizationRow
                        key={visualization.id}
                        visualization={visualization}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function VisualizationRow({
  visualization,
}: {
  visualization: VisualizationDefinition;
}) {
  const Icon = WIDGET_ICONS[visualization.widget] ?? Goal;

  return (
    <Link
      href={`/settings/visualizations/${visualization.id}`}
      className="hover:bg-accent/40 flex items-start gap-4 border-b px-4 py-5 transition-colors last:border-b-0"
    >
      <div className="bg-secondary rounded-xl p-3">
        <Icon size={20} className="text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">{visualization.title}</h3>

            <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
              {visualization.description || "No description provided."}
            </p>
          </div>

          <ChevronRight
            size={18}
            className="text-muted-foreground mt-1 shrink-0"
          />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <SummaryItem
            label="Widget"
            value={toTitleCase(visualization.widget)}
          />
          <SummaryItem
            label="Period"
            value={formatPeriod(visualization.period)}
          />
          <SummaryItem
            label="Display order"
            value={visualization.displayOrder}
          />
          <SummaryItem
            label="State"
            value={
              <span className="inline-flex items-center gap-1.5">
                {visualization.visible ? (
                  <Eye className="h-3.5 w-3.5" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" />
                )}
                <span>
                  {toTitleCase(visualization.aggregation)}
                  {visualization.visible ? "" : " (hidden)"}
                </span>
              </span>
            }
          />
        </div>
      </div>
    </Link>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-muted-foreground text-xs tracking-wide uppercase">
        {label}
      </p>

      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function toTitleCase(value: string) {
  return value
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatPeriod(period: VisualizationDefinition["period"]): string {
  if (period.type === "all") {
    return "All time";
  }

  return `${period.value} day${period.value === 1 ? "" : "s"}`;
}
