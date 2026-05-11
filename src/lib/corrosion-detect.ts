import type { Detection } from "./projects-store";

export type Frame = { blob: Blob; timestamp: number };

export async function extractFrames(videoFile: File, intervalSec = 2): Promise<{ frames: Frame[]; duration: number; videoURL: string }> {
  const videoURL = URL.createObjectURL(videoFile);
  const video = document.createElement("video");
  video.src = videoURL;
  video.muted = true;
  video.playsInline = true;
  await new Promise<void>((resolve, reject) => {
    video.addEventListener("loadedmetadata", () => resolve(), { once: true });
    video.addEventListener("error", () => reject(new Error("video load error")), { once: true });
    video.load();
  });
  const duration = video.duration;
  const frames: Frame[] = [];
  for (let t = 0; t < duration; t += intervalSec) {
    await new Promise<void>((r) => {
      const onSeeked = () => { video.removeEventListener("seeked", onSeeked); r(); };
      video.addEventListener("seeked", onSeeked);
      video.currentTime = t;
    });
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.8));
    if (blob) frames.push({ blob, timestamp: t });
  }
  return { frames, duration, videoURL };
}

const API_URL = "https://hadilc-speedo-vision-api.hf.space/detect";

export async function detectFrame(blob: Blob): Promise<any> {
  const formData = new FormData();
  formData.append("file", blob, "frame.jpg");
  const res = await fetch(API_URL, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return await res.json();
}

// Normalize an API detection into our Detection shape.
// API box may be in pixels or normalized; we coerce to percentage 0-100.
export function normalizeDetections(apiJson: any, timestamp: number, imgW?: number, imgH?: number): Detection[] {
  const arr: any[] = Array.isArray(apiJson?.detections) ? apiJson.detections : [];
  return arr.map((d) => {
    const rawBox = d.box ?? d.bbox ?? {};
    let x = Number(rawBox.x ?? rawBox.left ?? rawBox[0] ?? 0);
    let y = Number(rawBox.y ?? rawBox.top ?? rawBox[1] ?? 0);
    let w = Number(rawBox.width ?? rawBox.w ?? rawBox[2] ?? 0);
    let h = Number(rawBox.height ?? rawBox.h ?? rawBox[3] ?? 0);
    // If values look like pixels (>1), convert to percent using image size
    const W = imgW || apiJson?.image_width || 1;
    const H = imgH || apiJson?.image_height || 1;
    if (x > 1 || y > 1 || w > 1 || h > 1) {
      if (W > 1 && H > 1) {
        x = (x / W) * 100;
        y = (y / H) * 100;
        w = (w / W) * 100;
        h = (h / H) * 100;
      }
    } else {
      x *= 100; y *= 100; w *= 100; h *= 100;
    }
    const conf = Number(d.confidence ?? d.score ?? 0);
    return {
      timestamp,
      label: d.label ?? "Corrosion Detected",
      confidence: conf <= 1 ? conf * 100 : conf,
      area_percent: Number(d.area_percent ?? d.area ?? (w * h) / 100),
      box: { x, y, width: w, height: h },
    };
  });
}
