"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { MetricDefinition } from "@/models/metric";

import BrandLogo from "@/components/common/BrandLogo";
import LoginCard from "@/components/feature/auth/LoginCard";
import { signInWithGoogle } from "@/lib/auth";
import { apiRequest } from "@/lib/api/client";
import { getOnboardingSkipped, setOnboardingSkipped } from "@/lib/onboarding";
import { CheckCircle2, Target, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const features = [
    {
      icon: CheckCircle2,
      text: "Daily entries in a minute or two.",
    },
    {
      icon: Target,
      text: "Goal-based scoring to measure consistency, not perfection.",
    },
    {
      icon: Sparkles,
      text: "Chat insights grounded in your own data.",
    },
  ];

  const resolvePostLoginRoute = useCallback(async () => {
    if (!user) {
      return;
    }

    const goals = await apiRequest<MetricDefinition[]>(user, "/api/goals");

    if (goals.length > 0) {
      setOnboardingSkipped(false);
      router.replace("/dashboard");
      return;
    }

    if (getOnboardingSkipped()) {
      router.replace("/dashboard");
      return;
    }

    router.replace("/onboarding");
  }, [router, user]);

  useEffect(() => {
    if (!authLoading && user) {
      resolvePostLoginRoute().catch((error) => {
        console.error(error);
        toast.error("Unable to load goals.");
      });
    }
  }, [authLoading, resolvePostLoginRoute, user]);

  async function handleLogin() {
    try {
      setLoading(true);

      await signInWithGoogle();
    } catch (error) {
      console.error(error);
      toast.error("Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-zinc-950">
        <div className="absolute -top-16 -left-16 h-72 w-72 rounded-full bg-emerald-600/20 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <p className="relative text-sm text-zinc-300">Loading...</p>
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-zinc-950 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <div className="absolute -top-16 -left-16 h-72 w-72 rounded-full bg-emerald-600/20 blur-3xl" />
      <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto grid min-h-[calc(100dvh-3rem)] w-full max-w-6xl grid-cols-1 items-center gap-6 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
        <section className="order-2 hidden space-y-6 lg:order-1 lg:block">
          <BrandLogo
            size={44}
            textClassName="text-2xl font-semibold tracking-tight"
          />

          <div className="space-y-4">
            <h1 className="max-w-2xl text-3xl leading-tight font-semibold text-zinc-100 sm:text-4xl">
              Track the tiny daily wins that quietly change everything.
            </h1>

            <p className="max-w-xl text-base leading-7 text-zinc-300">
              This app keeps your routine simple: log your day, stay honest with
              your goals, and spot your patterns without overthinking.
            </p>
          </div>

          <ul className="space-y-3">
            {features.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 transition-all duration-200 hover:border-emerald-500/30 hover:bg-zinc-900/70"
              >
                <div className="rounded-full bg-emerald-500/15 p-2">
                  <Icon className="h-4 w-4 text-emerald-400" />
                </div>

                <span className="text-sm text-zinc-300">{text}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="order-1 flex justify-center lg:order-2 lg:justify-end">
          <div className="mb-3 w-full max-w-md space-y-4 lg:mb-0 lg:space-y-0">
            <LoginCard onLogin={handleLogin} loading={loading} />

            <ul className="space-y-3 lg:hidden">
              {features.map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 transition-all duration-200 hover:border-emerald-500/30 hover:bg-zinc-900/70"
                >
                  <div className="rounded-full bg-emerald-500/15 p-2">
                    <Icon className="h-4 w-4 text-emerald-400" />
                  </div>

                  <span className="text-sm text-zinc-300">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
