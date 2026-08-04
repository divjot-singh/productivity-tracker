"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Eye, EyeOff } from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import SettingsSubNav from "@/components/settings/SettingsSubNav";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import {
  VisualizationDefinition,
  VisualizationScope,
} from "@/models/visualization";
import { toast } from "sonner";

const SCOPE_LABELS: Record<VisualizationScope, string> = {
  global: "Global",
  goal: "Goals",
  category: "Categories",
};

const SCOPE_ORDER: VisualizationScope[] = ["global", "goal", "category"];

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

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Visualizations</h2>

          <Link
            href="/settings/visualizations/new"
            className={buttonVariants({ size: "sm" })}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Visualization
          </Link>
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

              if (items.length === 0) return null;

              return (
                <section key={scope}>
                  <h3 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
                    {SCOPE_LABELS[scope]}
                  </h3>

                  <div className="space-y-3">
                    {items.map((visualization) => (
                      <VisualizationCard
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

function VisualizationCard({
  visualization,
}: {
  visualization: VisualizationDefinition;
}) {
  return (
    <Link href={`/settings/visualizations/${visualization.id}`}>
      <Card className="hover:bg-accent/40 transition-colors">
        <div className="flex items-start justify-between gap-4 p-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">{visualization.title}</h4>

              {visualization.visible ? (
                <Eye className="text-muted-foreground h-4 w-4" />
              ) : (
                <EyeOff className="text-muted-foreground h-4 w-4" />
              )}
            </div>

            {visualization.description && (
              <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                {visualization.description}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Badge>{toTitleCase(visualization.widget)}</Badge>
              <Badge>{toTitleCase(visualization.aggregation)}</Badge>
              <Badge>{formatPeriod(visualization.period)}</Badge>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 font-medium">
      {children}
    </span>
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
