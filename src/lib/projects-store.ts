import { useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase";

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

// Load projects from Supabase for the logged-in user
export async function loadProjectsFromSupabase() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("inserted_at", { ascending: false });

  if (error || !data) return;

  projects = data.map((row) => ({
    id: row.id,
    name: row.name,
    videoURL: row.video_url,
    createdAt: row.created_at,
    detections: row.detections ?? [],
    status: row.status,
    duration: row.duration,
    fileName: row.file_name,
    framesAnalysed: row.frames_analysed,
  }));
  emit();
}

export const projectsStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getSnapshot() {
    return projects;
  },
  async add(p: Project) {
    const { data: { user } } = await supabase.auth.getUser();
    projects = [p, ...projects.filter((project) => project.id !== p.id)];
    emit();

    if (user) {
      await supabase.from("projects").upsert({
        id: p.id,
        user_id: user.id,
        name: p.name,
        video_url: p.videoURL,
        file_name: p.fileName,
        created_at: p.createdAt,
        status: p.status,
        duration: p.duration,
        frames_analysed: p.framesAnalysed,
        detections: p.detections,
      });
    }
  },
  get(id: string) {
    return projects.find((p) => p.id === id);
  },
  async remove(id: string) {
    projects = projects.filter((p) => p.id !== id);
    emit();
    await supabase.from("projects").delete().eq("id", id);
  },
};

export function useProjects() {
  return useSyncExternalStore(projectsStore.subscribe, projectsStore.getSnapshot, () => projects);
}

export function formatTimestamp(t: number) {
  const m = Math.floor(t / 60).toString().padStart(2, "0");
  const s = Math.floor(t % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function formatCreatedAt(d = new Date()) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}