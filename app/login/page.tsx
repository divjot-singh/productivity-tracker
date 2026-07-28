"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

import LoginCard from "@/components/feature/auth/LoginCard";
import { signInWithGoogle } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  async function handleLogin() {
    try {
      setLoading(true);

      await signInWithGoogle();

      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      toast.error("Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950">
        Loading...
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <LoginCard onLogin={handleLogin} loading={loading} />
    </main>
  );
}
