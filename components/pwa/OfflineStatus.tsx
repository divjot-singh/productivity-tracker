"use client";

import { useEffect, useSyncExternalStore } from "react";
import { CloudOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import {
  getPendingCount,
  refreshPendingCount,
  subscribePending,
} from "@/lib/offline/store";
import { flushQueue } from "@/lib/offline/sync";

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);

  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

const isOnline = () => navigator.onLine;

// Shows connection state and replays offline writes when the connection returns or the app opens.
export default function OfflineStatus() {
  const { user } = useAuth();
  const online = useSyncExternalStore(subscribeOnline, isOnline, () => true);
  const pending = useSyncExternalStore(
    subscribePending,
    getPendingCount,
    () => 0,
  );

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function sync(currentUser: NonNullable<typeof user>) {
      await refreshPendingCount(currentUser.uid);

      if (cancelled || !navigator.onLine) return;

      const sent = await flushQueue(currentUser);

      if (sent > 0 && !cancelled) {
        toast.success(`Synced ${sent} offline change${sent === 1 ? "" : "s"}`);
      }
    }

    void sync(user);

    const onOnline = () => void sync(user);

    window.addEventListener("online", onOnline);

    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
    };
  }, [user]);

  if (online && pending === 0) {
    return null;
  }

  return (
    <div
      role="status"
      className="bg-card text-foreground border-border fixed top-[4.5rem] left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border px-3 py-1.5 text-xs shadow-md"
    >
      {online ? (
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <CloudOff className="h-3.5 w-3.5" />
      )}

      {online
        ? `Syncing ${pending} change${pending === 1 ? "" : "s"}...`
        : pending > 0
          ? `Offline, ${pending} change${pending === 1 ? "" : "s"} will sync`
          : "Offline"}
    </div>
  );
}
