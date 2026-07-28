import AppShell from "@/components/layout/AppShell";
import GoalBuilder from "@/components/settings/GoalBuilder";

export default function AddGoalPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-screen-md px-4 py-6">
        <h1 className="text-3xl font-bold tracking-tight">Add Goal</h1>

        <p className="text-muted-foreground mt-2 mb-8">
          Create a custom productivity goal.
        </p>

        <GoalBuilder />
      </div>
    </AppShell>
  );
}
