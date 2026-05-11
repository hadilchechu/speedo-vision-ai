import type { Detection, Project } from "@/lib/projects-store";

/**
 * Bundled featured inspection: `/models/corrosion/pipeline-inspection-01`.
 * Video: `public/demo-inspection/demo.mp4` (~5s clip).
 *
 * Detections are placed **within the real duration** so Timeline scrubbing and thumbnails match
 * frames you can actually seek to (not placeholder timestamps past the file end).
 * After swapping the MP4, re-measure duration and adjust timestamps/boxes or paste model JSON.
 */
const DEMO_VIDEO_PATH = "/demo-inspection/demo.mp4";

/** Five hits spread across the bundled ~5s clip (same count as a typical model run; each time is seekable). */
const demoDetections: Detection[] = [
  {
    timestamp: 0.6,
    label: "Corrosion detected",
    confidence: 94,
    area_percent: 4.2,
    box: { x: 18, y: 22, width: 28, height: 30 },
  },
  {
    timestamp: 1.5,
    label: "Corrosion detected",
    confidence: 88,
    area_percent: 3.1,
    box: { x: 52, y: 34, width: 22, height: 24 },
  },
  {
    timestamp: 2.4,
    label: "Corrosion detected",
    confidence: 91,
    area_percent: 5.6,
    box: { x: 30, y: 42, width: 32, height: 26 },
  },
  {
    timestamp: 3.4,
    label: "Corrosion detected",
    confidence: 79,
    area_percent: 2.4,
    box: { x: 62, y: 20, width: 18, height: 22 },
  },
  {
    timestamp: 4.5,
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
  /** Matches bundled clip length; Timeline refreshes from `<video>` metadata when it loads. */
  duration: 5,
  fileName: "demo_inspection.mp4",
  framesAnalysed: 5,
};
