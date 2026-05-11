import type { Detection, Project } from "@/lib/projects-store";
import { finalizeCorrosionDetections } from "@/lib/corrosion-detect";

/**
 * Bundled featured inspection: `/models/corrosion/pipeline-inspection-01`.
 * Video: `public/demo-inspection/demo.mp4`.
 *
 * Raw rows below are model output on `demo.mp4`; `finalizeCorrosionDetections` is applied when
 * building `STATIC_FEATURED_DEMO` so the hub matches new-project behaviour (one row per region).
 */
const DEMO_VIDEO_PATH = "/demo-inspection/demo.mp4";

/** Raw model boxes before merge (same source as historical export). */
const rawDemoDetections: Detection[] = [
  {
    timestamp: 0,
    label: "Corrosion Detected",
    confidence: 86.7,
    area_percent: 1.9,
    box: { x: 60.3, y: 56, width: 16, height: 11.8 },
  },
  {
    timestamp: 2,
    label: "Corrosion Detected",
    confidence: 86.2,
    area_percent: 1.9,
    box: { x: 60, y: 46.4, width: 16.3, height: 11.7 },
  },
  {
    timestamp: 2,
    label: "Corrosion Detected",
    confidence: 67.4,
    area_percent: 0.9,
    box: { x: 61.7, y: 91.4, width: 11, height: 8.6 },
  },
  {
    timestamp: 4,
    label: "Corrosion Detected",
    confidence: 83.2,
    area_percent: 1.8,
    box: { x: 60.3, y: 38.8, width: 15.9, height: 11.4 },
  },
  {
    timestamp: 4,
    label: "Corrosion Detected",
    confidence: 37.5,
    area_percent: 1.7,
    box: { x: 61.8, y: 83.6, width: 10.7, height: 16.2 },
  },
];

const demoDetections = finalizeCorrosionDetections(rawDemoDetections);

export const STATIC_FEATURED_DEMO_ID = "pipeline-inspection-01";

export const STATIC_FEATURED_DEMO: Project = {
  id: STATIC_FEATURED_DEMO_ID,
  name: "Featured inspection demo",
  videoURL: DEMO_VIDEO_PATH,
  createdAt: "12 May 2026",
  detections: demoDetections,
  status: "Completed",
  duration: 5.515011,
  fileName: "demo.mp4",
  framesAnalysed: 3,
};
