import type { Detection, Project } from "@/lib/projects-store";

/**
 * Bundled featured inspection: same URL as before (`/models/corrosion/pipeline-inspection-01`).
 * Place your demo clip at `public/demo-inspection/demo.mp4` (see README in that folder).
 *
 * After swapping the video, update `duration`, `framesAnalysed`, and each `timestamp` / `box`
 * so they match your clip and real model output (or re-run the app pipeline once and paste JSON).
 */
const DEMO_VIDEO_PATH = "/demo-inspection/demo.mp4";

/** Matches bundled `public/demo-inspection/demo.mp4` (~5s). Expand when you swap in a longer clip. */
const demoDetections: Detection[] = [
  {
    timestamp: 2,
    label: "Corrosion detected",
    confidence: 94,
    area_percent: 4.2,
    box: { x: 18, y: 22, width: 28, height: 30 },
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
  /** Placeholder until `demo.mp4` loads — Timeline uses real duration from metadata when possible. */
  duration: 5,
  fileName: "demo_inspection.mp4",
  framesAnalysed: 5,
};
