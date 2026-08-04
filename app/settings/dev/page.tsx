"use client";

import { useAuth } from "@/contexts/AuthContext";
import { SeederService } from "@/services/SeederService";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DevSettings() {
  const { user } = useAuth();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  async function reseedConfig() {
    if (!user) return;

    await SeederService.seedDefaults();
    toast.success("Config reseeded");
  }

  async function reseedVisualizations() {
    if (!user) return;

    await SeederService.seedVisualizations();
    toast.success("Visualizations seeded");
  }

  return (
    <div className="flex flex-col items-start gap-4 p-6">
      <Button onClick={reseedConfig}>Reseed Default Config</Button>

      <Button onClick={reseedVisualizations}>Seed Visualizations</Button>
    </div>
  );
}
