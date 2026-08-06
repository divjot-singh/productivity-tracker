"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { MetricDefinition } from "@/models/metric";

import LoginCard from "@/components/feature/auth/LoginCard";
import { signInWithGoogle } from "@/lib/auth";
import { apiRequest } from "@/lib/api/client";
import { getOnboardingSkipped, setOnboardingSkipped } from "@/lib/onboarding";

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();

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
      <main className="flex min-h-dvh items-center justify-center bg-zinc-950">
        Loading...
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-zinc-950 px-4">
      <LoginCard onLogin={handleLogin} loading={loading} />
    </main>
  );
}
