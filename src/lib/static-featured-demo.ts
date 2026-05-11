import type { Detection, Project } from "@/lib/projects-store";

/**
 * Bundled featured inspection: `/models/corrosion/pipeline-inspection-01`.
 * Video: `public/demo-inspection/demo.mp4` (~5s clip).
 *
 * Bounding boxes are **illustrative** (hand-placed on the stock hood shot). Uploaded projects use
 * your real model output and are usually tighter on rust. To refresh this demo from the pipeline,
 * run analysis on `demo.mp4` and paste the resulting `detections` JSON here.
 */
const DEMO_VIDEO_PATH = "/demo-inspection/demo.mp4";

/** Five hits across ~5s — boxes biased toward left/right rust bands typical of this b-roll. */
const demoDetections: Detection[] = [
  {
    timestamp: 0.6,
    label: "Corrosion detected",
    confidence: 92,
    area_percent: 5.8,
    box: { x: 4, y: 28, width: 32, height: 38 },
  },
  {
    timestamp: 1.5,
    label: "Corrosion detected",
    confidence: 89,
    area_percent: 4.5,
    box: { x: 22, y: 32, width: 28, height: 30 },
  },
  {
    timestamp: 2.4,
    label: "Corrosion detected",
    confidence: 87,
    area_percent: 5.2,
    box: { x: 36, y: 44, width: 30, height: 26 },
  },
  {
    timestamp: 3.4,
    label: "Corrosion detected",
    confidence: 84,
    area_percent: 4.1,
    box: { x: 54, y: 30, width: 26, height: 32 },
  },
  {
    timestamp: 4.5,
    label: "Corrosion detected",
    confidence: 90,
    area_percent: 6.0,
    box: { x: 68, y: 26, width: 30, height: 36 },
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
  /** Matches bundled clip length; Timeline refreshes from `<video>` metadata when it loads. */
  duration: 5,
  fileName: "demo_inspection.mp4",
  framesAnalysed: 5,
};
