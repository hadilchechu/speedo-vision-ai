import { useSyncExternalStore } from "react";

export type DetectionBox = { x: number; y: number; width: number; height: number };
export type Detection = {
  timestamp: number;
  label: string;
  confidence: number;
  area_percent: number;
  box: DetectionBox;
};
export type Project = {
  id: string;
  name: string;
  videoURL: string;
  createdAt: string;
  detections: Detection[];
  status: string;
  duration: number;
  fileName?: string;
  framesAnalysed?: number;
};

let projects: Project[] = [];
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

export const projectsStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getSnapshot() {
    return projects;
  },
  add(p: Project) {
    projects = [p, ...projects];
    emit();
  },
  get(id: string) {
    return projects.find((p) => p.id === id);
  },
};

export function useProjects() {
  return useSyncExternalStore(projectsStore.subscribe, projectsStore.getSnapshot, () => projects);
}

export function formatTimestamp(t: number) {
  const m = Math.floor(t / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(t % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

/** Small slack so floating-point video duration does not drop the last frame's detection. */
export const DETECTION_DURATION_EPSILON_SEC = 0.05;

/**
 * Detections with timestamps past the clip length are dropped (e.g. baked JSON from a long run
 * paired with a shorter replacement video, or stale `duration` before metadata loads).
 */
export function detectionsWithinVideoDuration(
  detections: Detection[],
  durationSeconds: number,
): Detection[] {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return detections;
  return detections.filter((d) => d.timestamp <= durationSeconds + DETECTION_DURATION_EPSILON_SEC);
}

export function formatCreatedAt(d = new Date()) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
