"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, Share } from "lucide-react";

import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const noopSubscribe = () => () => {};

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent);

export default function InstallPrompt() {
  const standalone = useSyncExternalStore(
    noopSubscribe,
    isStandalone,
    () => true,
  );
  const ios = useSyncExternalStore(noopSubscribe, isIos, () => false);
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (standalone || (!ios && !installEvent)) {
    return null;
  }

  return (
    <div className="bg-card mb-8 rounded-2xl border p-4">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
          <Download size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-medium">Install Daylog</p>

          <p className="text-muted-foreground text-sm">
            {installEvent ? (
              "Add it to your home screen for a full-screen app."
            ) : (
              <>
                Tap <Share className="inline h-4 w-4 align-text-bottom" /> in
                Safari, then &quot;Add to Home Screen&quot;.
              </>
            )}
          </p>
        </div>

        {installEvent ? (
          <Button
            size="sm"
            onClick={async () => {
              await installEvent.prompt();
              setInstallEvent(null);
            }}
          >
            Install
          </Button>
        ) : null}
      </div>
    </div>
  );
}
