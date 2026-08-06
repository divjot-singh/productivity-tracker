import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import { VISUALIZATION_HELP_TOPICS } from "@/lib/visualizations/property-help";

export default function VisualizationHelpPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-screen-sm px-4 pt-4 pb-28">
        <Link
          href="/settings/visualizations/new"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ChevronLeft size={18} />
          Back to visualization setup
        </Link>

        <h1 className="mt-6 text-3xl font-bold tracking-tight">
          Visualization Field Guide
        </h1>

        <p className="text-muted-foreground mt-2 text-sm">
          Simple explanations for each visualization property.
        </p>

        <div className="mt-6 space-y-4">
          {VISUALIZATION_HELP_TOPICS.map((topic) => (
            <section
              key={topic.key}
              id={topic.key}
              className="bg-card scroll-mt-24 rounded-2xl border p-5"
            >
              <h2 className="text-lg font-semibold">{topic.title}</h2>

              <p className="text-muted-foreground mt-2 text-sm">
                {topic.whatItMeans}
              </p>

              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">How it works</p>
                <p className="text-muted-foreground text-sm">
                  {topic.howItWorks}
                </p>
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">Example</p>
                <p className="text-muted-foreground text-sm">{topic.example}</p>
              </div>

              {topic.optionDetails && topic.optionDetails.length > 0 && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-medium">Property options</p>

                  <div className="space-y-2">
                    {topic.optionDetails.map((item) => (
                      <div key={item.label} className="rounded-xl border p-3">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
