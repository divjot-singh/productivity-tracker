import { cn } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return <div className={cn("bg-muted animate-pulse rounded-md", className)} />;
}

// Placeholder that mirrors the usual page shape: heading, optional tab strip, then stacked cards.
export default function PageSkeleton({
  rows = 5,
  tabs = false,
}: {
  rows?: number;
  tabs?: boolean;
}) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="mx-auto w-full max-w-screen-sm space-y-4 px-4 pt-4 pb-28"
    >
      <div className="space-y-2">
        <Bar className="h-8 w-40" />
        <Bar className="h-4 w-60" />
      </div>

      {tabs ? <Bar className="h-11 w-full rounded-xl" /> : null}

      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="bg-card space-y-3 rounded-2xl border p-4"
          style={{ opacity: 1 - index * 0.12 }}
        >
          <Bar className="h-4 w-1/3" />
          <Bar className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}
