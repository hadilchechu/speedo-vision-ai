import type { Detection, Project } from "@/lib/projects-store";

type ListResponse = { projects: CloudProjectSummary[] };

export type CloudProjectSummary = {
  id: string;
  name: string;
  created_at: string;
  duration: number;
  status: string;
  file_name: string | null;
  frames_analysed: number | null;
  detection_count: number;
};

export async function fetchCloudProjectSummaries(): Promise<CloudProjectSummary[]> {
  const res = await fetch("/api/projects");
  if (!res.ok) {
    if (res.status === 503) return [];
    throw new Error(`List projects failed: ${res.status}`);
  }
  const data = (await res.json()) as ListResponse;
  return data.projects ?? [];
}

export async function fetchCloudProject(id: string): Promise<Project> {
  const res = await fetch(`/api/projects/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Project not found: ${res.status}`);
  const data = (await res.json()) as { project: Project };
  return data.project;
}

function resolvePlaybackUrl(project: Project): string | undefined {
  if (typeof window === "undefined") return undefined;
  const v = project.videoURL;
  if (v.startsWith("/")) return new URL(v, window.location.origin).href;
  if (v.startsWith("https://") || v.startsWith("http://")) return v;
  return undefined;
}

export async function saveProjectToCloud(project: Project, videoBlob: Blob): Promise<void> {
  const payload = JSON.stringify({
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
  });
  const fileName = project.fileName ?? "inspection.mp4";
  const form = new FormData();
  form.set("payload", payload);
  const playback = resolvePlaybackUrl(project);
  if (playback) form.set("playbackUrl", playback);
  if (videoBlob.size > 0) {
    const videoFile = new File([videoBlob], fileName, { type: videoBlob.type || "video/mp4" });
    form.set("video", videoFile);
  }
  const res = await fetch("/api/projects", { method: "POST", body: form });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `Save failed: ${res.status}`);
  }
}

export async function importProjectToCloud(manifestJson: string, videoFile: File): Promise<void> {
  const form = new FormData();
  form.set("manifest", manifestJson);
  form.set("video", videoFile);
  const res = await fetch("/api/projects/import", { method: "POST", body: form });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `Import failed: ${res.status}`);
  }
}

export function exportProjectManifestUrl(projectId: string): string {
  return `/api/projects/${encodeURIComponent(projectId)}/export`;
}

export function exportProjectVideoUrl(projectId: string): string {
  return `/api/projects/${encodeURIComponent(projectId)}/video`;
}

export async function deleteCloudProject(id: string): Promise<void> {
  const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
}
