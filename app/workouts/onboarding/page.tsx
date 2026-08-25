"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { apiRequest } from "@/lib/api/client";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { WorkoutOnboardingSeedResult } from "@/models/workout";

export default function WorkoutsOnboardingPage() {
  const { user, loading } = useRequireAuth();
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (loading || !user) {
      return;
    }

    const currentUser = user;
    let isCancelled = false;

    async function seedWorkoutSpace() {
      try {
        setFailed(false);

        await apiRequest<WorkoutOnboardingSeedResult>(
          currentUser,
          "/api/workouts/onboarding",
          {
            method: "POST",
          },
        );

        if (isCancelled) {
          return;
        }

        router.replace("/workouts");
        router.refresh();
      } catch (error) {
        console.error(error);

        if (!isCancelled) {
          setFailed(true);
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to set up your workout space",
          );
        }
      }
    }

    seedWorkoutSpace();

    return () => {
      isCancelled = true;
    };
  }, [loading, router, user]);

  return (
    <div className="flex min-h-[60dvh] items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border bg-zinc-950/70 p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <p className="text-muted-foreground text-xs font-semibold tracking-[0.24em] uppercase">
              Workout Setup
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Wait while we set up your workout space.
            </h2>

            <p className="text-muted-foreground mt-2 text-sm leading-6">
              We&apos;re adding your default exercises and combinations.
            </p>
          </div>

          <div className="bg-muted h-3 overflow-hidden rounded-full">
            <div
              className="h-full w-2/3 rounded-full bg-emerald-500 transition-all duration-1000 ease-linear"
              style={{
                animation:
                  "workout-onboarding-progress 1.4s ease-in-out infinite",
              }}
            />
          </div>

          <p className="text-muted-foreground text-xs">
            {failed
              ? "Setup hit a problem. Please reload the page to try again."
              : "This should only take a moment."}
          </p>
        </div>

        <style jsx>{`
          @keyframes workout-onboarding-progress {
            0% {
              transform: translateX(-35%);
            }
            50% {
              transform: translateX(25%);
            }
            100% {
              transform: translateX(75%);
            }
          }
        `}</style>
      </div>
    </div>
  );
}
