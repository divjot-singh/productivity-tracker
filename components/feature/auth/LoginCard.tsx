"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface LoginCardProps {
  onLogin: () => void;
  loading?: boolean;
}

export default function LoginCard({
  onLogin,
  loading = false,
}: LoginCardProps) {
  return (
    <Card className="bg-card w-full max-w-screen-sm border-zinc-800 shadow-2xl">
      <CardContent className="space-y-8 p-8">
        <div className="space-y-2 text-center">
          <h1 className="text-foreground text-3xl font-bold tracking-tight">
            Productivity Tracker
          </h1>

          <p className="text-muted-foreground text-sm">
            Build consistency. One day at a time.
          </p>
        </div>

        <Button
          className="h-11 w-full bg-emerald-600 hover:bg-emerald-500"
          onClick={onLogin}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Continue with Google"}
        </Button>

        <p className="text-primary text-center text-xs">
          Secure sign in using your Google account.
        </p>
      </CardContent>
    </Card>
  );
}
