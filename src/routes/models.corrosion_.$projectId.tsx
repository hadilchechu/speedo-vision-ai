import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { CorrosionProjectDetail } from "@/components/corrosion-project-detail";
import { ProjectToolbar } from "@/components/cloud-project-actions";
import { useProjects } from "@/lib/projects-store";

export const Route = createFileRoute("/models/corrosion_/$projectId")({
  component: ProjectPage,
});

function ProjectPage() {
  const { projectId } = Route.useParams();
  const localProjects = useProjects();
  const project = localProjects.find((p) => p.id === projectId);

  if (!project) {
    return (
      <AppShell>
        <Link to="/models/corrosion" className="text-sm text-[#2E86AB] hover:underline">
          ← Models
        </Link>
        <div className="mt-6 text-sm text-gray-600">Project not found. It may have been removed.</div>
      </AppShell>
    );
  }

  return (
    <CorrosionProjectDetail project={project} headerExtra={<ProjectToolbar project={project} />} />
  );
}
