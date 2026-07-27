"use client";

import { useEffect, useState } from "react";

import AppShell from "@/components/layout/AppShell";

import { useAuth } from "@/contexts/AuthContext";

import { DailyEntry } from "@/models/entry";

export default function LogsPage() {
  const { user } = useAuth();

  const [entries, setEntries] = useState<DailyEntry[]>([]);

  const [expanded, setExpanded] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;

      const token = await user.getIdToken();

      const response = await fetch("/api/entries", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setLoading(false);
        return;
      }

      const data = await response.json();

      setEntries(data);

      setLoading(false);
    }

    load();
  }, [user]);

  if (loading) {
    return (
      <AppShell>
        <div className="text-muted-foreground p-6 text-sm">Loading logs...</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-screen-sm space-y-6 px-4 pt-4 pb-28">
        <div>
          <h1 className="text-3xl font-bold">Logs</h1>

          <p className="text-muted-foreground mt-1 text-sm">
            Review your daily performance
          </p>
        </div>

        {entries.map((entry) => {
          const isOpen = expanded === entry.id;

          return (
            <div
              key={entry.id}
              className="bg-card overflow-hidden rounded-xl border"
            >
              {/* Summary */}

              <button
                className="w-full p-4 text-left"
                onClick={() => setExpanded(isOpen ? null : (entry.id ?? null))}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-primary font-semibold">{entry.date}</p>

                    <p className="text-muted-foreground mt-1 text-sm">
                      <b>{entry.xp}</b> XP earned
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-primary text-2xl font-bold">
                      {entry.score}
                    </p>

                    <p className="text-muted-foreground text-xs">Score</p>
                  </div>
                </div>
              </button>

              {/* Details */}

              {isOpen && (
                <div className="space-y-6 border-t p-4">
                  <div>
                    <h3 className="text-muted-foreground mb-3 font-semibold">
                      Metric Breakdown
                    </h3>

                    <div className="space-y-3">
                      {entry.breakdown?.map((item) => (
                        <div
                          key={item.metricId}
                          className="text-muted-foreground flex justify-between rounded-lg border p-3"
                        >
                          <div>
                            <p className="font-medium">
                              {formatMetricName(item.metricId)}
                            </p>

                            <p className="text-muted-foreground text-sm">
                              Value: {String(item.value)}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="font-semibold">{item.score}/10</p>

                            <p className="text-muted-foreground text-xs">
                              +{item.xp} XP
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground text-xs">
                        Total Score
                      </p>

                      <p className="text-primary text-xl font-bold">
                        {entry.score}
                      </p>
                    </div>

                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground text-xs">Total XP</p>

                      <p className="text-primary text-xl font-bold">
                        {entry.xp}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {entries.length === 0 && (
          <div className="text-muted-foreground rounded-xl border p-6 text-center text-sm">
            No entries yet.
          </div>
        )}
      </div>
    </AppShell>
  );
}

function formatMetricName(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
}
