import type { Detection } from "./projects-store";

/** Seconds between sampled frames for corrosion inference (smaller = denser timeline, more API calls). */
export const CORROSION_SAMPLE_INTERVAL_SEC = 0.25;

/**
 * IoU threshold for per-timestamp NMS: if two boxes overlap at least this much, the lower-confidence
 * one is dropped (same frame only — does not merge across time).
 */
/**
 * IoU threshold for merging the same physical defect across frames: boxes linking into one
 * region (transitive overlap) become a single output row.
 */
export const CORROSION_SPATIAL_MERGE_IOU_THRESHOLD = 0.4;

export type Frame = { blob: Blob; timestamp: number };

export async function extractFrames(
  videoFile: File,
  intervalSec = CORROSION_SAMPLE_INTERVAL_SEC,
): Promise<{ frames: Frame[]; duration: number; videoURL: string }> {
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

function iouPercentBox(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): number {
  const ax2 = a.x + a.width;
  const ay2 = a.y + a.height;
  const bx2 = b.x + b.width;
  const by2 = b.y + b.height;
  const ix1 = Math.max(a.x, b.x);
  const iy1 = Math.max(a.y, b.y);
  const ix2 = Math.min(ax2, bx2);
  const iy2 = Math.min(ay2, by2);
  const iw = Math.max(0, ix2 - ix1);
  const ih = Math.max(0, iy2 - iy1);
  const inter = iw * ih;
  const areaA = Math.max(0, a.width) * Math.max(0, a.height);
  const areaB = Math.max(0, b.width) * Math.max(0, b.height);
  const union = areaA + areaB - inter;
  return union > 0 ? inter / union : 0;
}

function nmsOneTimestamp(detections: Detection[], iouThreshold: number): Detection[] {
  const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
  const kept: Detection[] = [];
  while (sorted.length > 0) {
    const best = sorted.shift()!;
    kept.push(best);
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (iouPercentBox(best.box, sorted[i].box) >= iouThreshold) {
        sorted.splice(i, 1);
      }
    }
  }
  return kept;
}

function timestampBucket(t: number): number {
  return Math.round(t * 1e6) / 1e6;
}

/** Greedy NMS within each timestamp: overlapping same-area duplicates → single best confidence. */
export function dedupeOverlappingDetectionsPerTimestamp(
  detections: Detection[],
  iouThreshold = CORROSION_NMS_IOU_THRESHOLD,
): Detection[] {
  const groups = new Map<number, Detection[]>();
  for (const d of detections) {
    const k = timestampBucket(d.timestamp);
    const arr = groups.get(k) ?? [];
    arr.push(d);
    groups.set(k, arr);
  }
  const out: Detection[] = [];
  for (const group of groups.values()) {
    out.push(...nmsOneTimestamp(group, iouThreshold));
  }
  out.sort((a, b) => a.timestamp - b.timestamp || b.confidence - a.confidence);
  return out;
}

function ufFind(parent: number[], i: number): number {
  const p = parent[i]!;
  if (p === i) return i;
  parent[i] = ufFind(parent, p);
  return parent[i]!;
}

function ufUnite(parent: number[], i: number, j: number): void {
  const ri = ufFind(parent, i);
  const rj = ufFind(parent, j);
  if (ri !== rj) parent[ri] = rj;
}

/**
 * One output row per spatial region over the whole clip: overlapping boxes (any time) are merged.
 * Uses union–find on IoU; each cluster keeps the highest-confidence box, timestamp = first time seen.
 */
export function mergeDetectionsAcrossTimeIntoDistinctRegions(
  detections: Detection[],
  iouThreshold = CORROSION_SPATIAL_MERGE_IOU_THRESHOLD,
): Detection[] {
  const n = detections.length;
  if (n === 0) return [];
  const parent = Array.from({ length: n }, (_, i) => i);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (iouPercentBox(detections[i]!.box, detections[j]!.box) >= iouThreshold) {
        ufUnite(parent, i, j);
      }
    }
  }
  const byRoot = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const r = ufFind(parent, i);
    const arr = byRoot.get(r) ?? [];
    arr.push(i);
    byRoot.set(r, arr);
  }
  const out: Detection[] = [];
  for (const idxs of byRoot.values()) {
    const members = idxs.map((idx) => detections[idx]!);
    const tMin = Math.min(...members.map((m) => m.timestamp));
    const best = members.reduce((a, b) => (a.confidence >= b.confidence ? a : b));
    const confMax = Math.max(...members.map((m) => m.confidence));
    out.push({
      ...best,
      timestamp: tMin,
      confidence: confMax,
    });
  }
  out.sort((a, b) => a.timestamp - b.timestamp || b.confidence - a.confidence);
  return out;
}

/** Per-frame NMS, then merge same physical region across time (expected PDF / timeline shape). */
export function finalizeCorrosionDetections(detections: Detection[]): Detection[] {
  return mergeDetectionsAcrossTimeIntoDistinctRegions(
    dedupeOverlappingDetectionsPerTimestamp(detections),
  );
}
