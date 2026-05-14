import type { Detection, Project } from "@/lib/projects-store";

const OVERLAY_TIME_WINDOW_SEC = 0.45;
const FALLBACK_EXPORT_FPS = 30;

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
      reject(new Error("Could not load video for annotated export."));
    };

    video.addEventListener("loadedmetadata", onMeta, { once: true });
    video.addEventListener("error", onErr, { once: true });
    video.load();
  });
}

function pickMimeType(): { mimeType: string; extension: string } {
  const candidates = [
    { mimeType: "video/mp4;codecs=h264", extension: "mp4" },
    { mimeType: "video/mp4", extension: "mp4" },
    { mimeType: "video/webm;codecs=vp9", extension: "webm" },
    { mimeType: "video/webm;codecs=vp8", extension: "webm" },
    { mimeType: "video/webm", extension: "webm" },
  ];
  return (
    candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate.mimeType)) ?? {
      mimeType: "",
      extension: "webm",
    }
  );
}

function safeFileSlug(name: string): string {
  return name.replace(/[^\w-]+/g, "_").slice(0, 80) || "annotated-video";
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function detectionsNearTime(
  detections: Detection[],
  time: number,
  windowSec = OVERLAY_TIME_WINDOW_SEC,
): Array<Detection & { exportId: number }> {
  return detections
    .map((d, index) => ({ ...d, exportId: index + 1 }))
    .filter((d) => Math.abs(d.timestamp - time) <= windowSec)
    .sort(
      (a, b) =>
        Math.abs(a.timestamp - time) - Math.abs(b.timestamp - time) ||
        b.confidence - a.confidence,
    );
}

function drawRoundedLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxRight: number,
): void {
  const fontSize = 14;
  const padX = 8;
  const padY = 5;
  const radius = 7;
  ctx.font = `600 ${fontSize}px Inter, Arial, sans-serif`;
  const width = Math.min(ctx.measureText(text).width + padX * 2, maxRight);
  const height = fontSize + padY * 2;
  const lx = Math.max(0, Math.min(x, maxRight - width));
  const ly = Math.max(0, y - height - 4);

  ctx.beginPath();
  ctx.roundRect(lx, ly, width, height, radius);
  ctx.fillStyle = "#F97316";
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  ctx.fillText(text, lx + padX, ly + height / 2, width - padX * 2);
}

function drawAnnotatedFrame(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  detections: Detection[],
): void {
  const width = video.videoWidth;
  const height = video.videoHeight;
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(video, 0, 0, width, height);

  for (const detection of detectionsNearTime(detections, video.currentTime)) {
    const box = detection.box;
    const x = (box.x / 100) * width;
    const y = (box.y / 100) * height;
    const w = (box.width / 100) * width;
    const h = (box.height / 100) * height;

    ctx.fillStyle = "rgba(249, 115, 22, 0.2)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#F97316";
    ctx.lineWidth = Math.max(2, Math.round(width / 640) * 2);
    ctx.strokeRect(x, y, w, h);

    drawRoundedLabel(
      ctx,
      `#${detection.exportId} ${detection.label} — ${detection.confidence.toFixed(0)}%`,
      x,
      y,
      width,
    );
  }
}

function stopStream(stream: MediaStream): void {
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

export async function exportAnnotatedCorrosionVideo(project: Project): Promise<void> {
  if (typeof MediaRecorder === "undefined") {
    throw new Error("Annotated video export is not supported in this browser.");
  }

  const video = await loadVideo(project.videoURL);
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) {
    video.removeAttribute("src");
    video.load();
    throw new Error("Could not read source video dimensions.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    video.removeAttribute("src");
    video.load();
    throw new Error("Canvas is not available in this browser.");
  }

  const supportsManualFrames = "requestVideoFrameCallback" in video;
  const stream = canvas.captureStream(supportsManualFrames ? 0 : FALLBACK_EXPORT_FPS);
  const videoTrack = stream.getVideoTracks()[0] as
    | (MediaStreamTrack & { requestFrame?: () => void })
    | undefined;
  const { mimeType, extension } = pickMimeType();
  const chunks: BlobPart[] = [];
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

  const recording = new Promise<Blob>((resolve, reject) => {
    recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    });
    recorder.addEventListener("stop", () => {
      resolve(new Blob(chunks, { type: recorder.mimeType || mimeType || "video/webm" }));
    });
    recorder.addEventListener("error", () => {
      reject(new Error("Annotated video encoding failed."));
    });
  });

  let frameCallbackId = 0;
  let rafId = 0;
  const paintManualFrame = () => {
    drawAnnotatedFrame(ctx, video, project.detections);
    videoTrack?.requestFrame();
    frameCallbackId = video.requestVideoFrameCallback(paintManualFrame);
  };
  const paintFallbackFrame = () => {
    drawAnnotatedFrame(ctx, video, project.detections);
    rafId = requestAnimationFrame(paintFallbackFrame);
  };

  try {
    video.currentTime = 0;
    await new Promise<void>((resolve) => {
      if (Math.abs(video.currentTime) < 0.02) {
        resolve();
        return;
      }
      video.addEventListener("seeked", () => resolve(), { once: true });
    });

    drawAnnotatedFrame(ctx, video, project.detections);
    videoTrack?.requestFrame();

    recorder.start(250);
    if (supportsManualFrames) {
      frameCallbackId = video.requestVideoFrameCallback(paintManualFrame);
    } else {
      rafId = requestAnimationFrame(paintFallbackFrame);
    }

    await new Promise<void>((resolve, reject) => {
      video.addEventListener("ended", () => resolve(), { once: true });
      video.addEventListener("error", () => reject(new Error("Source video playback failed.")), {
        once: true,
      });
      void video.play().catch((error: unknown) => {
        reject(error instanceof Error ? error : new Error("Could not play source video."));
      });
    });

    if (recorder.state !== "inactive") {
      recorder.stop();
    }
    const blob = await recording;
    downloadBlob(blob, `${safeFileSlug(project.name)}_annotated.${extension}`);
  } finally {
    if (frameCallbackId) video.cancelVideoFrameCallback(frameCallbackId);
    if (rafId) cancelAnimationFrame(rafId);
    if (recorder.state !== "inactive") recorder.stop();
    stopStream(stream);
    video.pause();
    video.removeAttribute("src");
    video.load();
  }
}
