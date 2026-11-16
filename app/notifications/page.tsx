import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/common/PageHeader";
import NotificationSettings from "@/components/settings/NotificationSettings";

export default function NotificationsPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-screen-sm px-4 pt-4 pb-28">
        <PageHeader
          title="Notifications"
          description="Reminders and milestones, sent to this device."
        />

        <NotificationSettings />
      </div>
    </AppShell>
  );
}
