"use client";

import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/common/PageHeader";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return null;
  }

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description="Monitor your daily consistency and long-term progress."
      />
    </AppShell>
  );
}
