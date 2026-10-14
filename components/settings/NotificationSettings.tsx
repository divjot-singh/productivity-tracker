"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api/client";
import {
  TYPE_LABELS,
  type NotificationSettings,
  type NotificationType,
} from "@/lib/notifications/rules";

type PushState = "loading" | "unsupported" | "denied" | "off" | "on";

function urlBase64ToUint8Array(base64: string) {
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));

  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

async function currentRegistration() {
  if (!("serviceWorker" in navigator)) return null;

  return (await navigator.serviceWorker.getRegistration()) ?? null;
}

export default function NotificationSettings() {
  const { user } = useAuth();
  const [state, setState] = useState<PushState>("loading");
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshState = useCallback(async () => {
    const registration = await currentRegistration();

    if (!("Notification" in window) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }

    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }

    const subscription = await registration?.pushManager.getSubscription();

    setState(
      subscription && Notification.permission === "granted" ? "on" : "off",
    );
  }, []);

  useEffect(() => {
    if (!user) return;

    // Browser push state is external; refreshState only sets state after awaiting it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshState();
    apiRequest<NotificationSettings>(user, "/api/notifications/settings")
      .then(setSettings)
      .catch(() => toast.error("Could not load notification settings"));
  }, [user, refreshState]);

  async function enable() {
    if (!user) return;

    setBusy(true);

    try {
      const registration = await currentRegistration();

      if (!registration) {
        toast.error(
          "Notifications work in the installed or production app only.",
        );
        return;
      }

      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        await refreshState();
        return;
      }

      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
          ),
        }));

      await apiRequest(user, "/api/notifications/subscribe", {
        method: "POST",
        body: subscription.toJSON(),
      });

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      if (settings && settings.timezone !== timezone) {
        await save({ ...settings, timezone });
      }

      setState("on");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not enable");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    if (!user) return;

    setBusy(true);

    try {
      const registration = await currentRegistration();
      const subscription = await registration?.pushManager.getSubscription();

      if (subscription) {
        await apiRequest(user, "/api/notifications/subscribe", {
          method: "DELETE",
          body: { endpoint: subscription.endpoint },
        });
        await subscription.unsubscribe();
      }

      setState("off");
    } catch {
      toast.error("Could not turn off notifications");
    } finally {
      setBusy(false);
    }
  }

  async function save(next: NotificationSettings) {
    if (!user) return;

    setSettings(next);

    try {
      await apiRequest(user, "/api/notifications/settings", {
        method: "PUT",
        body: next,
      });
    } catch {
      toast.error("Could not save");
    }
  }

  function update(
    type: NotificationType,
    patch: { enabled?: boolean; time?: string },
  ) {
    if (!settings) return;

    void save({
      ...settings,
      types: {
        ...settings.types,
        [type]: { ...settings.types[type], ...patch },
      },
    });
  }

  async function sendTest() {
    if (!user) return;

    try {
      await apiRequest(user, "/api/notifications/test", { method: "POST" });
      toast.success("Test sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Test failed");
    }
  }

  const ios =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="space-y-4">
      <div className="bg-card space-y-3 rounded-2xl border p-4">
        <p className="text-sm font-medium">
          {state === "on"
            ? "Notifications are on for this device"
            : "Notifications are off for this device"}
        </p>

        {state === "unsupported" && (
          <p className="text-muted-foreground text-sm">
            {ios
              ? "On iPhone, add Daylog to your Home Screen first (Share, then Add to Home Screen), then open it from there."
              : "This browser does not support push notifications."}
          </p>
        )}

        {state === "denied" && (
          <p className="text-muted-foreground text-sm">
            Notifications are blocked. Allow them in your browser or system
            settings, then come back.
          </p>
        )}

        {(state === "off" || state === "on") && (
          <div className="flex gap-2">
            {state === "off" ? (
              <Button onClick={enable} disabled={busy}>
                Turn on
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={sendTest}>
                  Send test
                </Button>
                <Button variant="outline" onClick={disable} disabled={busy}>
                  Turn off
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {settings && (
        <div className="bg-card divide-y overflow-hidden rounded-2xl border">
          {(Object.keys(TYPE_LABELS) as NotificationType[]).map((type) => {
            const label = TYPE_LABELS[type];
            const setting = settings.types[type];

            return (
              <div key={type} className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{label.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {label.description}
                  </p>
                </div>

                {label.scheduled && (
                  <Input
                    type="time"
                    value={setting.time}
                    disabled={!setting.enabled}
                    onChange={(event) =>
                      event.target.value &&
                      update(type, { time: event.target.value })
                    }
                    className="h-9 w-32 shrink-0"
                  />
                )}

                <Switch
                  checked={setting.enabled}
                  onCheckedChange={(enabled) => update(type, { enabled })}
                />
              </div>
            );
          })}
        </div>
      )}

      {settings && (
        <p className="text-muted-foreground text-xs">
          Times are in {settings.timezone}.
        </p>
      )}
    </div>
  );
}
