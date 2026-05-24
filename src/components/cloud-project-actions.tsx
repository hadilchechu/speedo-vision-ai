import { useNavigate } from "@tanstack/react-router";
import {
  Braces,
  Download,
  FileText,
  Film,
  Image as ImageIcon,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { exportCorrosionPredictionsPdf } from "@/lib/corrosion-pdf-export";
import { exportAnnotatedCorrosionVideo } from "@/lib/corrosion-video-export";
import type { Detection, Project } from "@/lib/projects-store";
import { projectsStore, formatTimestamp } from "@/lib/projects-store";

export type ReviewedDetection = Detection & { id: number; status: string };

function safeFileSlug(name: string): string {
  return (
    name
      .replace(/[^\w-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "project"
  );
}

function clickDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  clickDownload(url, filename);
  URL.revokeObjectURL(url);
}

function loadVideo(videoSrc: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = videoSrc;
    const onMeta = () => {
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("error", onErr);
      resolve(video);
    };
    const onErr = () => {
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("error", onErr);
      reject(new Error("Could not load video for JPEG export."));
    };
    video.addEventListener("loadedmetadata", onMeta, { once: true });
    video.addEventListener("error", onErr, { once: true });
    video.load();
  });
}

function seekVideo(video: HTMLVideoElement, timestamp: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const safe = Math.max(0, Math.min(timestamp, Math.max(0, video.duration - 1 / 30)));
    if (Math.abs(video.currentTime - safe) < 0.02) {
      requestAnimationFrame(() => resolve());
      return;
    }
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onErr);
      resolve();
    };
    const onErr = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onErr);
      reject(new Error("Could not seek video for JPEG export."));
    };
    video.addEventListener("seeked", onSeeked, { once: true });
    video.addEventListener("error", onErr, { once: true });
    video.currentTime = safe;
  });
}

function detectionsNearTime(
  detections: ReviewedDetection[],
  timestamp: number,
): ReviewedDetection[] {
  return detections.filter((d) => Math.abs(d.timestamp - timestamp) <= 0.45);
}

function drawOverlay(
  ctx: CanvasRenderingContext2D,
  detection: ReviewedDetection,
  frameX: number,
  frameY: number,
  frameW: number,
  frameH: number,
): void {
  const x = frameX + (detection.box.x / 100) * frameW;
  const y = frameY + (detection.box.y / 100) * frameH;
  const w = (detection.box.width / 100) * frameW;
  const h = (detection.box.height / 100) * frameH;
  ctx.fillStyle = "rgba(249, 115, 22, 0.22)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#F97316";
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, w, h);
  const label = `#${detection.id + 1} ${detection.label} ${detection.confidence.toFixed(0)}%`;
  ctx.font = "700 22px Inter, Arial, sans-serif";
  const labelW = Math.min(ctx.measureText(label).width + 24, frameW);
  const labelH = 34;
  const labelX = Math.max(frameX, Math.min(x, frameX + frameW - labelW));
  const labelY = Math.max(frameY, y - labelH - 8);
  ctx.fillStyle = "#F97316";
  ctx.beginPath();
  ctx.roundRect(labelX, labelY, labelW, labelH, 8);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  ctx.fillText(label, labelX + 12, labelY + labelH / 2, labelW - 24);
}

async function exportInspectionJpeg(
  project: Project,
  detections: ReviewedDetection[],
  activeTab: string,
): Promise<void> {
  const video = await loadVideo(project.videoURL);
  const timestamp = detections[0]?.timestamp ?? 0;
  await seekVideo(video, timestamp);

  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 1500;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");

  ctx.fillStyle = "#F0F2F7";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#111827";
  ctx.font = "700 42px Inter, Arial, sans-serif";
  ctx.fillText(project.name, 72, 88);
  ctx.fillStyle = "#6B7280";
  ctx.font = "500 22px Inter, Arial, sans-serif";
  ctx.fillText(`Corrosion Detection - Video · ${project.createdAt} · ${activeTab}`, 72, 126);

  const confirmed = detections.filter((d) => d.status === "confirmed").length;
  const dismissed = detections.filter((d) => d.status === "dismissed").length;
  const pending = detections.filter((d) => d.status === "pending").length;
  const summary = [
    `${detections.length} detections`,
    `${confirmed} confirmed`,
    `${dismissed} dismissed`,
    `${pending} pending`,
    `Duration ${formatTimestamp(project.duration)}`,
  ];
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(72, 164, 1456, 86, 12);
  ctx.fill();
  ctx.fillStyle = "#374151";
  ctx.font = "600 24px Inter, Arial, sans-serif";
  ctx.fillText(summary.join("   ·   "), 104, 216);

  const frameX = 72;
  const frameY = 286;
  const frameW = 1456;
  const frameH = 819;
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(frameX, frameY, frameW, frameH);
  const scale = Math.min(frameW / video.videoWidth, frameH / video.videoHeight);
  const drawW = video.videoWidth * scale;
  const drawH = video.videoHeight * scale;
  const drawX = frameX + (frameW - drawW) / 2;
  const drawY = frameY + (frameH - drawH) / 2;
  ctx.drawImage(video, drawX, drawY, drawW, drawH);
  for (const detection of detectionsNearTime(detections, timestamp)) {
    drawOverlay(ctx, detection, drawX, drawY, drawW, drawH);
  }

  ctx.fillStyle = "#111827";
  ctx.font = "700 28px Inter, Arial, sans-serif";
  ctx.fillText("Detection cards", 72, 1168);
  const cards = detections.slice(0, 5);
  cards.forEach((d, index) => {
    const y = 1200 + index * 52;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(72, y, 1456, 40, 8);
    ctx.fill();
    ctx.fillStyle = "#111827";
    ctx.font = "700 18px Inter, Arial, sans-serif";
    ctx.fillText(`Image ${index + 1}`, 96, y + 26);
    ctx.fillStyle = "#2E86AB";
    ctx.font = "600 17px Inter, Arial, sans-serif";
    ctx.fillText(
      `${formatTimestamp(d.timestamp)} · ${d.confidence.toFixed(1)}% · ${d.status}`,
      260,
      y + 26,
    );
    ctx.fillStyle = "#6B7280";
    ctx.fillText(`Area ${d.area_percent.toFixed(1)}%`, 560, y + 26);
  });

  video.removeAttribute("src");
  video.load();

  await new Promise<void>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not encode JPEG export."));
          return;
        }
        downloadBlob(blob, `${safeFileSlug(project.name)}-inspection.jpg`);
        resolve();
      },
      "image/jpeg",
      0.94,
    );
  });
}

/** Browser download of inspection manifest. */
export function downloadProjectManifest(project: Project, detections?: ReviewedDetection[]) {
  const body = {
    version: 2 as const,
    project: {
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
      duration: project.duration,
      status: project.status,
      fileName: project.fileName,
      framesAnalysed: project.framesAnalysed,
    },
    summary: {
      detections: detections?.length ?? project.detections.length,
      confirmed: detections?.filter((d) => d.status === "confirmed").length ?? 0,
      dismissed: detections?.filter((d) => d.status === "dismissed").length ?? 0,
      pending:
        detections?.filter((d) => d.status === "pending").length ?? project.detections.length,
    },
    detections:
      detections?.map((d) => ({
        id: d.id,
        status: d.status,
        timestamp: d.timestamp,
        label: d.label,
        confidence: d.confidence,
        area_percent: d.area_percent,
        box: d.box,
      })) ?? project.detections,
  };
  const blob = new Blob([JSON.stringify(body, null, 2)], { type: "application/json" });
  downloadBlob(blob, `${safeFileSlug(project.name)}-inspection.json`);
}

const actionButton =
  "inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-lg border bg-white px-3 text-[11px] font-semibold tracking-wide uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/30 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:text-xs";

function TooltipIconButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="group relative">
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-300 bg-white text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <span className="pointer-events-none absolute right-0 top-full z-30 mt-2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        {label}
      </span>
    </div>
  );
}

export function ProjectDownloadVideoButton({ project }: { project: Project }) {
  const [exportingVideo, setExportingVideo] = useState(false);

  const onDownloadVideo = async () => {
    if (exportingVideo) return;
    setExportingVideo(true);
    const toastId = toast.loading("Rendering video export...");
    try {
      await exportAnnotatedCorrosionVideo(project);
      toast.success("Annotated video downloaded.", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not export annotated video.", {
        id: toastId,
      });
    } finally {
      setExportingVideo(false);
    }
  };

  return (
    <button
      type="button"
      disabled={exportingVideo}
      onClick={() => void onDownloadVideo()}
      className={`${actionButton} flex-1 border-[#2E86AB] text-[#2E86AB] hover:bg-[#EEF2FF] sm:flex-none`}
    >
      <Film className="h-4 w-4" />
      <span className="hidden sm:inline">Download </span>Video
    </button>
  );
}

function ProjectActionsMenuItem({
  icon: Icon,
  label,
  tone = "default",
  disabled,
  onClick,
}: {
  icon: typeof Download;
  label: string;
  tone?: "default" | "danger";
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      className={`flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-50 ${
        tone === "danger" ? "text-red-700" : "text-gray-800"
      }`}
      onClick={onClick}
    >
      <Icon
        className={`h-4 w-4 shrink-0 ${tone === "danger" ? "text-red-600" : "text-gray-600"}`}
        aria-hidden
      />
      {label}
    </button>
  );
}

export function ProjectActionGroup({
  project,
  detections,
  activeTab,
}: {
  project: Project;
  detections: ReviewedDetection[];
  activeTab: string;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [exportingVideo, setExportingVideo] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onRemove = () => {
    if (project.id === "pipeline-inspection-01") {
      toast.info("Featured demo projects cannot be removed.");
      return;
    }
    if (
      !confirm("Remove this project from your list? The video stays only in this browser session.")
    )
      return;
    projectsStore.remove(project.id);
    toast.success("Project removed.");
    void navigate({ to: "/models/corrosion" });
  };

  const runExport = async (kind: "pdf" | "jpeg" | "json") => {
    setOpen(false);
    setBusy(true);
    try {
      if (kind === "pdf") {
        await exportCorrosionPredictionsPdf(project);
        toast.success("PDF report downloaded.");
      } else if (kind === "jpeg") {
        await exportInspectionJpeg(project, detections, activeTab);
        toast.success("JPEG inspection image downloaded.");
      } else {
        downloadProjectManifest(project, detections);
        toast.success("JSON downloaded.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setBusy(false);
    }
  };

  const runVideoExport = async () => {
    setOpen(false);
    if (exportingVideo) return;
    setExportingVideo(true);
    const toastId = toast.loading("Rendering video export...");
    try {
      await exportAnnotatedCorrosionVideo(project);
      toast.success("Annotated video downloaded.", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not export annotated video.", {
        id: toastId,
      });
    } finally {
      setExportingVideo(false);
    }
  };

  return (
    <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
      <div className="hidden flex-nowrap items-center justify-end gap-2 sm:flex">
        <TooltipIconButton label="Remove Project" onClick={onRemove} />
        <ProjectDownloadVideoButton project={project} />
      </div>
      <div className="relative flex-1 sm:flex-none" ref={ref}>
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          disabled={busy}
          onClick={() => setOpen((o) => !o)}
          className={`${actionButton} ml-auto h-9 w-9 border-transparent bg-transparent px-0 text-gray-500 hover:bg-gray-100 hover:text-[#2E86AB] sm:h-10 sm:w-auto sm:border-[#2E86AB] sm:bg-white sm:px-4 sm:text-[#2E86AB] sm:hover:bg-[#EEF2FF]`}
        >
          <MoreHorizontal className="h-5 w-5 sm:hidden" />
          <Download className="hidden h-4 w-4 sm:block" />
          <span className="hidden sm:inline">Export</span>
        </button>
        <div
          role="menu"
          className={`absolute right-0 top-full z-50 mt-2 min-w-[210px] origin-top-right rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-md transition duration-150 ${
            open
              ? "pointer-events-auto scale-100 opacity-100"
              : "pointer-events-none scale-95 opacity-0"
          }`}
        >
          <div className="sm:hidden">
            <ProjectActionsMenuItem
              icon={Trash2}
              label="Remove project"
              tone="danger"
              disabled={busy || exportingVideo}
              onClick={onRemove}
            />
            <ProjectActionsMenuItem
              icon={Film}
              label="Download video"
              disabled={busy || exportingVideo}
              onClick={() => void runVideoExport()}
            />
            <div className="my-1 border-t border-[#F0F2F7]" />
          </div>
          <ProjectActionsMenuItem
            icon={FileText}
            label="Export as PDF"
            disabled={busy}
            onClick={() => void runExport("pdf")}
          />
          <ProjectActionsMenuItem
            icon={ImageIcon}
            label="Export as JPEG"
            disabled={busy}
            onClick={() => void runExport("jpeg")}
          />
          <ProjectActionsMenuItem
            icon={Braces}
            label="Export as JSON"
            disabled={busy}
            onClick={() => void runExport("json")}
          />
        </div>
      </div>
    </div>
  );
}
