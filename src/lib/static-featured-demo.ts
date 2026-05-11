import type { Detection, Project } from "@/lib/projects-store";

/**
 * Bundled featured inspection: same URL as before (`/models/corrosion/pipeline-inspection-01`).
 * Place your demo clip at `public/demo-inspection/demo.mp4` (see README in that folder).
 *
 * After swapping the video, update `duration`, `framesAnalysed`, and each `timestamp` / `box`
 * so they match your clip and real model output (or re-run the app pipeline once and paste JSON).
 */
const DEMO_VIDEO_PATH = "/demo-inspection/demo.mp4";

const demoDetections: Detection[] = [
  {
    timestamp: 2,
    label: "Corrosion detected",
    confidence: 94,
    area_percent: 4.2,
    box: { x: 18, y: 22, width: 28, height: 30 },
  },
  {
    timestamp: 8,
    label: "Corrosion detected",
    confidence: 88,
    area_percent: 3.1,
    box: { x: 52, y: 34, width: 22, height: 24 },
  },
  {
    timestamp: 14,
    label: "Corrosion detected",
    confidence: 91,
    area_percent: 5.6,
    box: { x: 30, y: 42, width: 32, height: 26 },
  },
  {
    timestamp: 21,
    label: "Corrosion detected",
    confidence: 79,
    area_percent: 2.4,
    box: { x: 62, y: 20, width: 18, height: 22 },
  },
  {
    timestamp: 26,
    label: "Corrosion detected",
    confidence: 86,
    area_percent: 3.9,
    box: { x: 24, y: 48, width: 26, height: 28 },
  },
];

export const STATIC_FEATURED_DEMO_ID = "pipeline-inspection-01";

export const STATIC_FEATURED_DEMO: Project = {
  id: STATIC_FEATURED_DEMO_ID,
  name: "Featured inspection demo",
  videoURL: DEMO_VIDEO_PATH,
  createdAt: "08 May 2025",
  detections: demoDetections,
  status: "Completed",
  /** Placeholder until `demo.mp4` loads — Timeline updates from real metadata when possible. */
  duration: 30,
  fileName: "demo_inspection.mp4",
  framesAnalysed: 15,
};
