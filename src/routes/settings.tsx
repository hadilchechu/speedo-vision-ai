import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PlannedPage } from "@/components/planned-page";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <AppShell>
      <PlannedPage title="Settings">
        Organization defaults, API keys, and notification preferences will be configurable here in a
        future update.
      </PlannedPage>
    </AppShell>
  );
}
