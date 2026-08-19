"use client";

import BrandLogo from "@/components/common/BrandLogo";
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
    <Card className="w-full max-w-md border-zinc-700/70 bg-zinc-900/80 shadow-[0_22px_70px_-20px_rgba(0,0,0,0.8)] backdrop-blur-sm">
      <CardContent className="space-y-6 p-6 sm:space-y-7 sm:p-8">
        <div className="space-y-4 text-center">
          <BrandLogo
            size={52}
            className="justify-center"
            textClassName="text-xl font-semibold tracking-tight"
          />

          <p className="text-sm text-zinc-300">Ready when you are.</p>
        </div>

        <Button
          className="h-11 w-full bg-emerald-600 text-white hover:bg-emerald-500"
          onClick={onLogin}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Jump in with Google"}
        </Button>

        <p className="text-center text-xs text-zinc-400">
          Sign in to continue.
        </p>
      </CardContent>
    </Card>
  );
}
