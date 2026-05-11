import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Download, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import type { Project } from "@/lib/projects-store";
import {
  deleteCloudProject,
  exportProjectManifestUrl,
  exportProjectVideoUrl,
  saveProjectToCloud,
} from "@/lib/projects-api";

export function SaveToCloudButton({ project }: { project: Project }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const onSave = async () => {
    setBusy(true);
    try {
      const res = await fetch(project.videoURL);
      if (!res.ok) throw new Error("Could not read video from this session. Re-upload and save before closing the tab.");
      const blob = await res.blob();
      await saveProjectToCloud(project, blob);
      await qc.invalidateQueries({ queryKey: ["cloud-projects"] });
      await qc.invalidateQueries({ queryKey: ["cloud-project", project.id] });
      toast.success("Project saved to Cloudflare storage.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void onSave()}
      className="inline-flex items-center gap-2 border border-[#2E9E8F] bg-[#2E9E8F] px-5 py-2.5 text-xs font-semibold tracking-wide text-white uppercase transition-colors hover:bg-[#268579] disabled:opacity-50"
      style={{ borderRadius: 0 }}
    >
      <UploadCloud className="h-4 w-4" />
      {busy ? "Saving…" : "Save to cloud"}
    </button>
  );
}

export function CloudProjectToolbar({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const onDelete = async () => {
    if (!confirm("Delete this project from cloud storage? This cannot be undone.")) return;
    setBusy(true);
    try {
      await deleteCloudProject(projectId);
      await qc.invalidateQueries({ queryKey: ["cloud-projects"] });
      toast.success("Project deleted.");
      window.location.href = "/models/corrosion";
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={exportProjectManifestUrl(projectId)}
        download
        className="inline-flex items-center gap-2 border border-[#2E86AB] bg-white px-4 py-2.5 text-xs font-semibold tracking-wide text-[#2E86AB] uppercase transition-colors hover:bg-[#EEF2FF]"
        style={{ borderRadius: 0 }}
      >
        <Download className="h-4 w-4" />
        Export JSON
      </a>
      <a
        href={exportProjectVideoUrl(projectId)}
        download={`project-${projectId}.mp4`}
        className="inline-flex items-center gap-2 border border-[#2E86AB] bg-white px-4 py-2.5 text-xs font-semibold tracking-wide text-[#2E86AB] uppercase transition-colors hover:bg-[#EEF2FF]"
        style={{ borderRadius: 0 }}
      >
        <Download className="h-4 w-4" />
        Download video
      </a>
      <button
        type="button"
        disabled={busy}
        onClick={() => void onDelete()}
        className="inline-flex items-center gap-2 border border-red-300 bg-white px-4 py-2.5 text-xs font-semibold tracking-wide text-red-700 uppercase transition-colors hover:bg-red-50 disabled:opacity-50"
        style={{ borderRadius: 0 }}
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </button>
    </div>
  );
}
