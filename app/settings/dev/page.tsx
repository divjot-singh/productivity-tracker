"use client";

import { useAuth } from "@/contexts/AuthContext";
import { SeederService } from "@/services/SeederService";
import { Button } from "@/components/ui/button";

export default function DevSettings() {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }
  const { user } = useAuth();

  async function reseed() {
    if (!user) return;

    await SeederService.seedDefaults();

    alert("Config reseeded");
  }

  return (
    <div className="p-6">
      <Button onClick={reseed}>Reseed Default Config</Button>
    </div>
  );
}
