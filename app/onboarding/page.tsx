"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft } from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import GoalBuilder from "@/components/settings/GoalBuilder";
import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { apiRequest } from "@/lib/api/client";
import { GoalTemplate } from "@/lib/goals/templates";
import { setOnboardingSkipped } from "@/lib/onboarding";
import { MetricDefinition } from "@/models/metric";
import { toast } from "sonner";

type OnboardingMode = "choose" | "templates" | "custom";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useRequireAuth();

  const [mode, setMode] = useState<OnboardingMode>("choose");
  const [templates, setTemplates] = useState<GoalTemplate[]>([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [savingTemplates, setSavingTemplates] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      return;
    }

    const currentUser = user;

    async function load() {
      try {
        setLoadingPage(true);

        const goals = await apiRequest<MetricDefinition[]>(
          currentUser,
          "/api/goals",
        );

        if (goals.length > 0) {
          setOnboardingSkipped(false);
          router.replace("/dashboard");
          return;
        }

        const defaultTemplates = await apiRequest<GoalTemplate[]>(
          currentUser,
          "/api/goals/templates",
        );

        setTemplates(defaultTemplates ?? []);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load onboarding data");
      } finally {
        setLoadingPage(false);
      }
    }

    load();
  }, [authLoading, router, user]);

  const selectedCount = selectedTemplateIds.length;

  const selectedLabel = useMemo(() => {
    if (selectedCount === 0) {
      return "No default goals selected";
    }

    if (selectedCount === 1) {
      return "1 default goal selected";
    }

    return `${selectedCount} default goals selected`;
  }, [selectedCount]);

  function toggleTemplate(templateId: string) {
    setSelectedTemplateIds((previous) => {
      if (previous.includes(templateId)) {
        return previous.filter((id) => id !== templateId);
      }

      return [...previous, templateId];
    });
  }

  function handleSkip() {
    setOnboardingSkipped(true);
    router.push("/dashboard");
  }

  async function handleFinalizeTemplates() {
    if (!user || selectedTemplateIds.length === 0) {
      return;
    }

    try {
      setSavingTemplates(true);

      const response = await apiRequest<{
        created: number;
        skipped: number;
      }>(user, "/api/goals/templates", {
        method: "POST",
        body: {
          templateIds: selectedTemplateIds,
        },
      });

      setOnboardingSkipped(false);

      if (response.created > 0) {
        toast.success(
          response.created === 1
            ? "1 goal added from template"
            : `${response.created} goals added from templates`,
        );
      } else {
        toast.success("Goals are already configured");
      }

      router.push("/today");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create goals from templates",
      );
    } finally {
      setSavingTemplates(false);
    }
  }

  if (authLoading || loadingPage) {
    return (
      <AppShell>
        <div className="p-6 text-sm text-zinc-400">Loading onboarding...</div>
      </AppShell>
    );
  }

  if (mode === "custom") {
    return (
      <AppShell>
        <div className="mx-auto w-full max-w-screen-md px-4 pt-4 pb-28">
          <button
            onClick={() => setMode("choose")}
            className="inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-zinc-100"
          >
            <ChevronLeft size={18} />
            Back
          </button>

          <h1 className="mt-5 text-3xl font-bold tracking-tight">
            Create your first goal
          </h1>

          <p className="mt-2 mb-8 text-sm text-zinc-400">
            Add one goal to start tracking. You can edit goal settings later.
          </p>

          <GoalBuilder
            redirectPath="/today"
            onSuccess={() => setOnboardingSkipped(false)}
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-screen-md px-4 pt-4 pb-28">
        {mode === "choose" ? (
          <>
            <h1 className="text-3xl font-bold tracking-tight">Welcome</h1>

            <p className="mt-2 text-sm text-zinc-400">
              Start by creating goals. You can always edit them later from
              settings.
            </p>

            <div className="mt-6 space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
              <Button
                className="h-11 w-full"
                onClick={() => setMode("templates")}
              >
                Choose from default goals
              </Button>

              <Button
                variant="outline"
                className="h-11 w-full"
                onClick={() => setMode("custom")}
              >
                Create a custom goal
              </Button>
            </div>

            <div className="mt-5 rounded-xl border border-emerald-900/40 bg-emerald-900/10 p-3 text-xs text-emerald-300">
              Tip: defaults are templates only. You will be able to edit goals
              after setup.
            </div>

            <Button
              variant="ghost"
              className="mt-4 w-full text-zinc-400 hover:text-zinc-100"
              onClick={handleSkip}
            >
              Skip for now
            </Button>
          </>
        ) : (
          <>
            <button
              onClick={() => setMode("choose")}
              className="inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-zinc-100"
            >
              <ChevronLeft size={18} />
              Back
            </button>

            <h1 className="mt-5 text-3xl font-bold tracking-tight">
              Select default goals
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              Pick at least one goal to get started. You can edit these later.
            </p>

            <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-300">
              {selectedLabel}
            </div>

            <div className="mt-4 space-y-3">
              {templates.map((template) => {
                const selected = selectedTemplateIds.includes(
                  template.templateId,
                );

                return (
                  <label
                    key={template.templateId}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
                      selected
                        ? "border-emerald-500/60 bg-emerald-500/10"
                        : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4"
                      checked={selected}
                      onChange={() => toggleTemplate(template.templateId)}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-medium">{template.label}</p>
                        {selected && (
                          <CheckCircle2
                            size={16}
                            className="text-emerald-400"
                          />
                        )}
                      </div>

                      <p className="mt-1 text-xs text-zinc-400">
                        {template.description || "No description provided"}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-300">
                        <span className="rounded-full bg-zinc-800 px-2 py-1">
                          {template.category}
                        </span>
                        <span className="rounded-full bg-zinc-800 px-2 py-1">
                          {template.type}
                        </span>
                        <span className="rounded-full bg-zinc-800 px-2 py-1">
                          {template.weight} pts
                        </span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <Button
              className="mt-6 h-11 w-full"
              onClick={handleFinalizeTemplates}
              disabled={savingTemplates || selectedTemplateIds.length === 0}
            >
              {savingTemplates ? "Finalizing..." : "Finalize and continue"}
            </Button>

            <Button
              variant="ghost"
              className="mt-3 w-full text-zinc-400 hover:text-zinc-100"
              onClick={handleSkip}
              disabled={savingTemplates}
            >
              Skip for now
            </Button>
          </>
        )}
      </div>
    </AppShell>
  );
}
