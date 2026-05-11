import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PlannedPage } from "@/components/planned-page";

export const Route = createFileRoute("/team")({
  component: TeamPage,
});

function TeamPage() {
  return (
    <AppShell>
      <PlannedPage title="Team">
        Shared workspaces, roles, and invitations will land here. For now, projects stay on this
        device for your session.
      </PlannedPage>
    </AppShell>
  );
}
