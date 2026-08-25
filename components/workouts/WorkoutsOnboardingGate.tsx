"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import { apiRequest } from "@/lib/api/client";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { WorkoutOnboardingStatus } from "@/models/workout";

interface WorkoutsOnboardingGateProps {
  children: ReactNode;
}

export default function WorkoutsOnboardingGate({
  children,
}: WorkoutsOnboardingGateProps) {
  const { user, loading } = useRequireAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      setReady(false);
      return;
    }

    const isOnboardingRoute = pathname === "/workouts/onboarding";
    const currentUser = user;
    let isCancelled = false;

    async function loadStatus() {
      try {
        setReady(false);

        const status = await apiRequest<WorkoutOnboardingStatus>(
          currentUser,
          "/api/workouts/onboarding",
        );

        if (isCancelled) {
          return;
        }

        if (status.requiresOnboarding && !isOnboardingRoute) {
          router.replace("/workouts/onboarding");
          return;
        }

        if (!status.requiresOnboarding && isOnboardingRoute) {
          router.replace("/workouts");
          return;
        }

        setReady(true);
      } catch (error) {
        console.error(error);

        if (!isCancelled) {
          toast.error("Failed to load workout setup");
          setReady(true);
        }
      }
    }

    loadStatus();

    return () => {
      isCancelled = true;
    };
  }, [loading, pathname, router, user]);

  if (loading || !user || !ready) {
    return (
      <div className="text-muted-foreground flex min-h-[40dvh] items-center justify-center text-sm">
        Loading workout space...
      </div>
    );
  }

  return <>{children}</>;
}
