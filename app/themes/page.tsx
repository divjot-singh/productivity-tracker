import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/common/PageHeader";
import ThemePicker from "@/components/settings/ThemePicker";

export default function ThemesPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-screen-sm px-4 pt-4 pb-28">
        <PageHeader
          title="Themes"
          description="Pick the colours that suit you. Saved on this device."
        />

        <ThemePicker />
      </div>
    </AppShell>
  );
}
