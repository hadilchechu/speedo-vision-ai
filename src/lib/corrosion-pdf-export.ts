import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Detection, Project } from "@/lib/projects-store";
import { detectionsWithinVideoDuration, formatTimestamp } from "@/lib/projects-store";

const THUMB_W = 380;
const THUMB_H = Math.round((THUMB_W * 9) / 16);
const MODEL_MAP = "0.80";

function paintSnapshot(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  width: number,
  height: number,
  box: Detection["box"],
  variant: "original" | "annotated",
): boolean {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return false;
  const scale = Math.min(width / vw, height / vh);
  const dw = vw * scale;
  const dh = vh * scale;
  const ox = (width - dw) / 2;
  const oy = (height - dh) / 2;
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(video, ox, oy, dw, dh);
  if (variant === "annotated") {
    const bx = ox + (box.x / 100) * dw;
    const by = oy + (box.y / 100) * dh;
    const bw = (box.width / 100) * dw;
    const bh = (box.height / 100) * dh;
    ctx.fillStyle = "rgba(249, 115, 22, 0.35)";
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "#F97316";
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);
  }
  return true;
}

function loadVideo(videoSrc: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const v = document.createElement("video");
    v.crossOrigin = "anonymous";
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    v.src = videoSrc;
    const onMeta = () => {
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("error", onErr);
      resolve(v);
    };
    const onErr = () => {
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("error", onErr);
      reject(
        new Error(
          "Could not load video for PDF export. Ensure the video URL is reachable and allows cross-origin capture.",
        ),
      );
    };
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("error", onErr);
    v.load();
  });
}

function seekVideo(v: HTMLVideoElement, timestamp: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const dur = v.duration;
    if (!Number.isFinite(dur) || dur <= 0) {
      reject(new Error("Invalid video duration"));
      return;
    }
    const safe = Math.max(0, Math.min(timestamp, dur - 1 / 30));

    const onSeeked = () => {
      v.removeEventListener("seeked", onSeeked);
      v.removeEventListener("error", onErr);
      resolve();
    };
    const onErr = () => {
      v.removeEventListener("seeked", onSeeked);
      v.removeEventListener("error", onErr);
      reject(new Error("Video seek failed"));
    };

    if (Math.abs(v.currentTime - safe) < 0.02) {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      return;
    }

    v.addEventListener("seeked", onSeeked, { once: true });
    v.addEventListener("error", onErr, { once: true });
    try {
      v.currentTime = safe;
    } catch (e) {
      reject(e instanceof Error ? e : new Error("Seek error"));
    }
  });
}

function safeFileSlug(name: string) {
  return name.replace(/[^\w-]+/g, "_").slice(0, 80) || "report";
}

/**
 * Builds a corrosion inspection PDF: summary metrics, a precision/score table, and per-detection original + annotated frames.
 */
export async function exportCorrosionPredictionsPdf(project: Project): Promise<void> {
  const detections = detectionsWithinVideoDuration(project.detections, project.duration);
  const margin = 40;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - margin * 2;

  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Corrosion detection — predictions report", margin, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Project: ${project.name}`, margin, y);
  y += 14;
  doc.text(`Video: ${project.fileName ?? project.videoURL}`, margin, y);
  y += 14;
  doc.text(
    `Report date: ${project.createdAt} · Duration: ${formatTimestamp(project.duration)}`,
    margin,
    y,
  );
  y += 22;

  const n = detections.length;
  const avgScore = n
    ? (detections.reduce((s, d) => s + d.confidence / 100, 0) / n).toFixed(2)
    : "0.00";
  const avgArea = n
    ? (detections.reduce((s, d) => s + d.area_percent, 0) / n).toFixed(1) + "%"
    : "0%";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Precision & score summary", margin, y);
  y += 14;

  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: [
      ["Average prediction score", avgScore],
      ["Mean average precision (model)", MODEL_MAP],
      ["Average annotated area", avgArea],
    ],
    theme: "grid",
    headStyles: { fillColor: [46, 134, 171], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 5 },
    margin: { left: margin, right: margin },
  });

  y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 60;
  y += 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Per-detection precision table", margin, y);
  y += 14;

  const tableBody = detections.map((d, i) => [
    String(i + 1),
    formatTimestamp(d.timestamp),
    `Frame_${Math.round(d.timestamp)}`,
    d.confidence.toFixed(1),
    d.area_percent.toFixed(1),
    d.label,
  ]);

  autoTable(doc, {
    startY: y,
    head: [["#", "Timestamp", "Frame", "Score (%)", "Annotated area (%)", "Label"]],
    body: tableBody.length ? tableBody : [["—", "—", "—", "—", "—", "No detections"]],
    theme: "striped",
    headStyles: { fillColor: [46, 134, 171], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 4 },
    margin: { left: margin, right: margin },
  });

  const tableEnd =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 40;
  y = tableEnd + 18;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(80);
  doc.text(
    "Score = model confidence for the detection. Mean average precision is a report-level model metric (same as Predictions tab).",
    margin,
    y,
    { maxWidth: contentW },
  );
  doc.setTextColor(0);
  y += 28;

  if (n === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("No frame thumbnails to export.", margin, y);
    doc.save(`${safeFileSlug(project.name)}_predictions.pdf`);
    return;
  }

  const video = await loadVideo(project.videoURL);
  const canvas = document.createElement("canvas");
  canvas.width = THUMB_W;
  canvas.height = THUMB_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    video.removeAttribute("src");
    video.load();
    throw new Error("Canvas is not available in this browser.");
  }

  const imgGap = 12;
  const rowImgW = (contentW - imgGap) / 2;
  const rowImgH = (rowImgW * 9) / 16;

  for (let i = 0; i < detections.length; i++) {
    const d = detections[i];
    await seekVideo(video, d.timestamp);
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

    if (!paintSnapshot(ctx, video, THUMB_W, THUMB_H, d.box, "original")) {
      throw new Error("Video frame not ready — check that the video has decodable frames.");
    }
    const originalData = canvas.toDataURL("image/jpeg", 0.86);
    paintSnapshot(ctx, video, THUMB_W, THUMB_H, d.box, "annotated");
    const annotatedData = canvas.toDataURL("image/jpeg", 0.86);

    const blockH = 22 + 52 + rowImgH + 24;
    if (y + blockH > pageH - margin) {
      doc.addPage();
      y = margin;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`Detection ${i + 1} of ${n}`, margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const lines = [
      `Name: Frame_${Math.round(d.timestamp)}`,
      `Timestamp: ${formatTimestamp(d.timestamp)}`,
      `Created on: ${project.createdAt}`,
      `Prediction score: ${d.confidence.toFixed(1)}% · Annotated area: ${d.area_percent.toFixed(1)}%`,
      `Label: ${d.label}`,
    ];
    doc.text(lines.join("\n"), margin, y);
    y += 52;

    doc.addImage(originalData, "JPEG", margin, y, rowImgW, rowImgH);
    doc.addImage(annotatedData, "JPEG", margin + rowImgW + imgGap, y, rowImgW, rowImgH);

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("Original", margin, y - 4);
    doc.text("Annotated", margin + rowImgW + imgGap, y - 4);
    doc.setTextColor(0);

    y += rowImgH + 24;
  }

  video.removeAttribute("src");
  video.load();

  doc.save(`${safeFileSlug(project.name)}_predictions.pdf`);
}
