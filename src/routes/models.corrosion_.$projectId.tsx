import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { CorrosionProjectDetail } from "@/components/corrosion-project-detail";
import { CloudProjectToolbar, SaveToCloudButton } from "@/components/cloud-project-actions";
import { useProjects } from "@/lib/projects-store";
import { fetchCloudProject } from "@/lib/projects-api";

export const Route = createFileRoute("/models/corrosion_/$projectId")({
  component: ProjectPage,
});

function ProjectPage() {
  const { projectId } = Route.useParams();
  const localProjects = useProjects();
  const local = localProjects.find((p) => p.id === projectId);

  const cloudQ = useQuery({
    queryKey: ["cloud-project", projectId],
    queryFn: () => fetchCloudProject(projectId),
    retry: false,
    enabled: !!projectId,
  });

  const project = cloudQ.data ?? local;
  const fromCloud = !!cloudQ.data;
  const loading = cloudQ.isLoading && !local;

  if (loading) {
    return (
      <AppShell>
        <Link to="/models/corrosion" className="text-sm text-[#2E86AB] hover:underline">
          ← Models
        </Link>
        <div className="mt-8 text-sm text-gray-600">Loading project…</div>
      </AppShell>
    );
  }

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
    <CorrosionProjectDetail
      project={project}
      defaultReviewStatus={fromCloud ? "confirmed" : "pending"}
      headerExtra={
        fromCloud ? (
          <CloudProjectToolbar projectId={project.id} />
        ) : (
          <SaveToCloudButton project={project} />
        )
      }
    />
  );
}
