import { useNavigate } from "@tanstack/react-router";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Project } from "@/lib/projects-store";
import { projectsStore } from "@/lib/projects-store";

function clickDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/** Browser download of inspection manifest (same shape as historical cloud export). */
export function downloadProjectManifest(project: Project) {
  const body = {
    version: 1 as const,
    project: {
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
      duration: project.duration,
      status: project.status,
      fileName: project.fileName,
      framesAnalysed: project.framesAnalysed,
    },
    detections: project.detections,
  };
  const blob = new Blob([JSON.stringify(body, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  clickDownload(url, `project-${project.id}.json`);
  URL.revokeObjectURL(url);
}

export function ProjectToolbar({ project }: { project: Project }) {
  const navigate = useNavigate();
  const videoName = project.fileName ?? `project-${project.id}.mp4`;

  const onRemove = () => {
    if (!confirm("Remove this project from your list? The video stays only in this browser session.")) return;
    projectsStore.remove(project.id);
    toast.success("Project removed.");
    void navigate({ to: "/models/corrosion" });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => downloadProjectManifest(project)}
        className="inline-flex items-center gap-2 border border-[#2E86AB] bg-white px-4 py-2.5 text-xs font-semibold tracking-wide text-[#2E86AB] uppercase transition-colors hover:bg-[#EEF2FF]"
        style={{ borderRadius: 0 }}
      >
        <Download className="h-4 w-4" />
        Export JSON
      </button>
      <a
        href={project.videoURL}
        download={videoName}
        className="inline-flex items-center gap-2 border border-[#2E86AB] bg-white px-4 py-2.5 text-xs font-semibold tracking-wide text-[#2E86AB] uppercase transition-colors hover:bg-[#EEF2FF]"
        style={{ borderRadius: 0 }}
      >
        <Download className="h-4 w-4" />
        Download video
      </a>
      <button
        type="button"
        onClick={() => void onRemove()}
        className="inline-flex items-center gap-2 border border-red-300 bg-white px-4 py-2.5 text-xs font-semibold tracking-wide text-red-700 uppercase transition-colors hover:bg-red-50"
        style={{ borderRadius: 0 }}
      >
        <Trash2 className="h-4 w-4" />
        Remove
      </button>
    </div>
  );
}
