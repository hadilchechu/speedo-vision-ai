import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import type { ComponentType } from "react";
import {
  Target,
  Film,
  AlertTriangle,
  Search,
  Folder,
  ChevronRight,
  X,
  UploadCloud,
  CheckCircle2,
  FileDown,
  LayoutGrid,
  List,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";

import {
  projectsStore,
  formatCreatedAt,
  type Detection,
  type Project,
  useProjects,
} from "@/lib/projects-store";

import {
  extractFrames,
  detectFrame,
  normalizeDetections,
  finalizeCorrosionDetections,
} from "@/lib/corrosion-detect";

import { STATIC_FEATURED_DEMO } from "@/lib/static-featured-demo";

import { supabase, uploadVideo } from "@/lib/supabase";
import { MAX_UPLOAD_MB, validateInspectionVideo } from "@/lib/upload-constraints";

const AVG_SECS_PER_FRAME = 7;
const CONCURRENCY = 2;

export const Route = createFileRoute("/models/corrosion")({
  component: CorrosionModelPage,
});

const projectsToolbarBtn =
  "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border px-4 text-xs font-semibold uppercase tracking-wide transition-colors";

type ProjectsViewMode = "list" | "grid";

function ProjectVideoFrame({ project }: { project: Project }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [project.videoURL]);

  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#EEF2FF]">
        <Folder className="h-8 w-8 text-[#2E86AB]" />
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      src={project.videoURL}
      muted
      playsInline
      preload="metadata"
      className="h-full w-full object-cover"
      onLoadedMetadata={() => {
        const video = videoRef.current;
        if (!video) return;
        const timestamp = project.detections[0]?.timestamp ?? 0;
        const duration = Number.isFinite(video.duration) ? video.duration : timestamp;
        video.currentTime = Math.max(0, Math.min(timestamp, Math.max(0, duration - 0.05)));
      }}
      onError={() => setFailed(true)}
      aria-hidden
    />
  );
}

async function importManifestIntoSession(manifestJson: string, videoFile: File): Promise<void> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(manifestJson);
  } catch {
    throw new Error("Manifest is not valid JSON.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid manifest.");
  }

  const root = parsed as Record<string, unknown>;

  const proj = root.project as Record<string, unknown> | undefined;
  const detections = root.detections;

  if (!proj || typeof proj.name !== "string") {
    throw new Error("Invalid manifest: expected project.name.");
  }

  if (!Array.isArray(detections)) {
    throw new Error("Invalid manifest: expected detections array.");
  }

  const id = typeof proj.id === "string" && proj.id.length > 0 ? proj.id : crypto.randomUUID();

  if (projectsStore.get(id)) {
    projectsStore.remove(id);
  }

  let videoURL = URL.createObjectURL(videoFile);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userId = session?.user?.id ?? null;

  if (userId) {
    try {
      videoURL = await uploadVideo(videoFile, id);
    } catch (err) {
      console.warn("Video upload failed, using local blob URL:", err);
    }
  }

  const project: Project = {
    id,
    name: proj.name,
    videoURL,
    createdAt: typeof proj.createdAt === "string" ? proj.createdAt : formatCreatedAt(),
    detections: finalizeCorrosionDetections(detections as Detection[]),
    status: typeof proj.status === "string" ? proj.status : "Completed",
    duration: typeof proj.duration === "number" ? proj.duration : 0,
    fileName: typeof proj.fileName === "string" ? proj.fileName : videoFile.name,
    framesAnalysed: typeof proj.framesAnalysed === "number" ? proj.framesAnalysed : undefined,
  };

  projectsStore.add(project, { persist: !!userId, userId });
}

function CorrosionModelPage() {
  const [openNew, setOpenNew] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectsViewMode, setProjectsViewMode] = useState<ProjectsViewMode>("list");

  const sessionProjects = useProjects();
  const normalizedProjectSearch = projectSearch.trim().toLowerCase();
  const filteredSessionProjects = normalizedProjectSearch
    ? sessionProjects.filter((p) => p.name.toLowerCase().includes(normalizedProjectSearch))
    : sessionProjects;
  const showBundledDemo =
    !normalizedProjectSearch ||
    STATIC_FEATURED_DEMO.name.toLowerCase().includes(normalizedProjectSearch);
  const hasProjectResults = filteredSessionProjects.length > 0 || showBundledDemo;

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Corrosion Detection — Video</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[18px] font-bold text-gray-900">Projects</h2>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOpenImport(true)}
                className={`${projectsToolbarBtn} border-[#2E86AB] bg-white text-[#2E86AB] hover:bg-[#EEF2FF]`}
              >
                <FileDown className="h-4 w-4 shrink-0" aria-hidden />
                Import
              </button>

              <button
                type="button"
                onClick={() => setOpenNew(true)}
                className={`${projectsToolbarBtn} border-[#2E9E8F] bg-[#2E9E8F] text-white hover:border-[#268579] hover:bg-[#268579]`}
              >
                + New Project
              </button>
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="relative w-1/3 min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                type="text"
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                placeholder="Search projects"
                className="h-9 w-full rounded-md border border-[#E5E7EB] bg-white pl-8 pr-3 text-sm focus:border-[#2E86AB] focus:outline-none"
              />
            </div>

            <div className="flex h-9 items-center rounded-lg border border-[#E5E7EB] bg-white p-1">
              <button
                type="button"
                aria-label="List view"
                onClick={() => setProjectsViewMode("list")}
                className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                  projectsViewMode === "list"
                    ? "bg-[#EEF2FF] text-[#2E86AB]"
                    : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Grid view"
                onClick={() => setProjectsViewMode("grid")}
                className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                  projectsViewMode === "grid"
                    ? "bg-[#EEF2FF] text-[#2E86AB]"
                    : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>

          {projectsViewMode === "list" ? (
            <div className="space-y-3">
              {filteredSessionProjects.map((p) => (
                <Link
                  key={p.id}
                  to="/models/corrosion/$projectId"
                  params={{ projectId: p.id }}
                  className="group flex items-center gap-4 rounded-lg border border-[#E5E7EB] bg-white/95 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#2E86AB]/45 hover:bg-white hover:shadow-[0_14px_32px_rgba(15,23,42,0.08)] hover:ring-1 hover:ring-[#2E86AB]/10"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#EEF2FF] transition-colors group-hover:bg-[#E1F1F8]">
                    <Folder className="h-5 w-5 text-[#2E86AB]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-gray-900">{p.name}</div>

                    <div className="mt-0.5 text-xs text-gray-500">
                      Last inspected: {p.createdAt}
                    </div>
                  </div>

                  <span className="shrink-0 rounded bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">
                    {p.detections.length} detections
                  </span>

                  <span className="shrink-0 rounded bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                    {p.status}
                  </span>

                  <ChevronRight className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#2E86AB]" />
                </Link>
              ))}

              {showBundledDemo && (
                <Link
                  to="/models/corrosion/pipeline-inspection-01"
                  className="group flex items-center gap-4 rounded-lg border border-[#2E86AB]/25 bg-white/95 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-[#2E86AB]/10 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#2E86AB]/55 hover:bg-white hover:shadow-[0_14px_32px_rgba(15,23,42,0.08)] hover:ring-[#2E86AB]/20"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#EEF2FF] transition-colors group-hover:bg-[#E1F1F8]">
                    <Folder className="h-5 w-5 text-[#2E86AB]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold uppercase tracking-wide text-[#2E86AB]">
                      Bundled demo
                    </div>

                    <div className="truncate text-sm font-bold text-gray-900">
                      {STATIC_FEATURED_DEMO.name}
                    </div>

                    <div className="mt-0.5 text-xs text-gray-500">
                      Video and analysis ship with this deploy · {STATIC_FEATURED_DEMO.createdAt}
                    </div>
                  </div>

                  <span className="shrink-0 rounded bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">
                    {STATIC_FEATURED_DEMO.detections.length} detections
                  </span>

                  <span className="shrink-0 rounded bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                    {STATIC_FEATURED_DEMO.status}
                  </span>

                  <ChevronRight className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#2E86AB]" />
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {filteredSessionProjects.map((p) => (
                <Link
                  key={p.id}
                  to="/models/corrosion/$projectId"
                  params={{ projectId: p.id }}
                  className="group overflow-hidden rounded-lg border border-[#E5E7EB] bg-white/95 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#2E86AB]/45 hover:shadow-[0_14px_32px_rgba(15,23,42,0.08)] hover:ring-1 hover:ring-[#2E86AB]/10"
                >
                  <div className="relative aspect-video overflow-hidden bg-[#EEF2FF]">
                    <ProjectVideoFrame project={p} />
                  </div>
                  <div className="p-4">
                    <div className="truncate text-sm font-bold text-gray-900">{p.name}</div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-500">{p.createdAt}</span>
                      <span className="rounded bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">
                        {p.detections.length} detections
                      </span>
                    </div>
                  </div>
                </Link>
              ))}

              {showBundledDemo && (
                <Link
                  to="/models/corrosion/pipeline-inspection-01"
                  className="group overflow-hidden rounded-lg border border-[#2E86AB]/25 bg-white/95 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-[#2E86AB]/10 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#2E86AB]/55 hover:shadow-[0_14px_32px_rgba(15,23,42,0.08)] hover:ring-[#2E86AB]/20"
                >
                  <div className="relative aspect-video overflow-hidden bg-[#EEF2FF]">
                    <ProjectVideoFrame project={STATIC_FEATURED_DEMO} />
                    <span className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#2E86AB] shadow-sm">
                      Demo
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="truncate text-sm font-bold text-gray-900">
                      {STATIC_FEATURED_DEMO.name}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-500">
                        {STATIC_FEATURED_DEMO.createdAt}
                      </span>
                      <span className="rounded bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">
                        {STATIC_FEATURED_DEMO.detections.length} detections
                      </span>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          )}

          {!hasProjectResults && (
            <div className="mt-3 rounded-lg border border-dashed border-[#D1D5DB] bg-white/70 p-6 text-sm text-gray-500">
              No projects found for "{projectSearch.trim()}".
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <section className="rounded-lg border border-[#E5E7EB] bg-white/80 p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Model overview</h2>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Current corrosion detection model configuration.
                </p>
              </div>
              <span className="shrink-0 rounded-md bg-[#E8F6F3] px-2.5 py-1 text-xs font-semibold text-[#1f6f63]">
                Active
              </span>
            </div>

            <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-[#E5E7EB] bg-white sm:grid-cols-3 sm:divide-x sm:divide-[#F0F2F7]">
              <StatCard icon={Target} label="Model Accuracy" value="92%" />
              <StatCard icon={Film} label="Frames Analysed" value="1,240 / 1,350" />
              <StatCard icon={AlertTriangle} label="Defects Marked" value="347" />
            </div>

            <p className="mt-5 rounded-lg bg-[#F8FAFC] p-4 text-sm leading-6 text-gray-600">
              This pre-trained model detects and labels corrosion across video footage. The AI scans
              each frame, flags defects, and prioritises by severity level.
            </p>

            <div className="mt-4 divide-y divide-[#F0F2F7] rounded-lg border border-[#E5E7EB] bg-white px-4">
              <MetaRow label="Project Name" value="Project_corrosion_video" />
              <MetaRow label="Type" value="Object Detection" />
              <MetaRow label="Algorithm" value="YOLOv11" />
              <MetaRow label="Created" value="08 Feb 2026" />
            </div>
          </section>
        </div>
      </div>

      {openNew && <NewProjectModal onClose={() => setOpenNew(false)} />}

      {openImport && (
        <ImportProjectModal
          onClose={() => setOpenImport(false)}
          onDone={() => setOpenImport(false)}
        />
      )}
    </AppShell>
  );
}

function ImportProjectModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const manifestRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const mf = manifestRef.current?.files?.[0];
    const vf = videoRef.current?.files?.[0];

    if (!mf || !vf) {
      toast.error("Choose both an export JSON file and the matching video file.");
      return;
    }

    setBusy(true);

    try {
      const text = await mf.text();

      await importManifestIntoSession(text, vf);

      toast.success("Project imported.");

      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={busy ? undefined : onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={busy ? undefined : onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-2 text-lg font-semibold text-gray-900">Import project</h2>

        <p className="mb-4 text-xs text-gray-600">
          Use the <strong>Export JSON</strong> file from another deployment, plus the same{" "}
          <strong>video</strong> file.
        </p>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              Manifest (.json)
            </label>

            <input
              ref={manifestRef}
              type="file"
              accept="application/json,.json"
              className="block w-full text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">Video (.mp4)</label>

            <input ref={videoRef} type="file" accept="video/*" className="block w-full text-sm" />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold uppercase text-gray-700"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => void submit()}
            className="rounded-lg bg-[#2E9E8F] px-4 py-2 text-xs font-semibold uppercase text-white disabled:opacity-50"
          >
            {busy ? "Importing…" : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Progress helpers ────────────────────────────────────────────────────────
//
// Instead of deriving "target %" from phase buckets (10 / 10+80 / 95) and then
// slowly chasing that target with a fixed step, we keep a single authoritative
// `displayProgress` value and advance it in two ways:
//
//  1. FRAME TICKS  – every time a batch completes we know exactly what fraction
//     of frames is done; we map that onto the 15 – 90 % band so the bar always
//     reflects real work.
//
//  2. TIME-BASED FILL – a rAF loop moves the bar forward at a rate derived from
//     the current ETA so that the bar reaches ~90 % just as the last frame
//     finishes.  This keeps the bar moving continuously without ever "stalling".
//     We use a soft cap: the time-based advance can never overtake the
//     frame-based position by more than 5 %, which prevents the bar from racing
//     ahead of reality.
//
// Phase bands:
//   extracting  →  0  → 12 %   (short, fixed duration ~1 s)
//   analysing   → 12  → 90 %   (time + frame based)
//   building    → 90  → 98 %   (short, fixed)
//   done        → 100 %

const EXTRACT_END = 12;
const ANALYSE_END = 90;
const BUILD_END = 98;
const DONE = 100;

type InspectionAnalysisResult = {
  id: string;
  userId: string | null;
  videoURL: string;
  duration: number;
  detections: Detection[];
  framesAnalysed: number;
};

function NewProjectModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");

  const [phase, setPhase] = useState<"idle" | "extracting" | "analysing" | "building">("idle");

  const [analyseStatus, setAnalyseStatus] = useState({ done: 0, total: 0 });
  const [eta, setEta] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dotStep, setDotStep] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<InspectionAnalysisResult | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [showAnalysisProgress, setShowAnalysisProgress] = useState(false);
  const analysisPromiseRef = useRef<Promise<InspectionAnalysisResult> | null>(null);
  const analysisRunIdRef = useRef(0);
  const analysisAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      analysisAbortRef.current?.abort();
    };
  }, []);

  // Cycle blank → . → .. → ... → blank while analysing.
  useEffect(() => {
    if (phase !== "analysing") {
      setDotStep(0);
      return;
    }
    setDotStep(0);
    const id = setInterval(() => {
      setDotStep((s) => (s + 1) % 4);
    }, 500);
    return () => clearInterval(id);
  }, [phase]);

  // Single source-of-truth for the displayed bar width (0-100).
  const [displayProgress, setDisplayProgress] = useState(0);

  // Refs used inside the rAF loop so we never need to re-register it.
  const phaseRef = useRef(phase);
  const etaRef = useRef<number | null>(null);
  const analyseStatusRef = useRef(analyseStatus);
  const displayProgressRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  // Keep refs in sync with state.
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    etaRef.current = eta;
  }, [eta]);
  useEffect(() => {
    analyseStatusRef.current = analyseStatus;
  }, [analyseStatus]);

  // ── rAF loop: runs while processing, keeps bar moving continuously ──────
  useEffect(() => {
    if (phase === "idle") {
      // Reset everything when back to idle.
      displayProgressRef.current = 0;
      setDisplayProgress(0);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      return;
    }

    lastTickRef.current = performance.now();

    const tick = (now: number) => {
      const dt = (now - lastTickRef.current) / 1000; // seconds elapsed
      lastTickRef.current = now;

      const currentPhase = phaseRef.current;
      const currentEta = etaRef.current;
      const currentStatus = analyseStatusRef.current;
      let current = displayProgressRef.current;

      if (currentPhase === "extracting") {
        // Animate smoothly from 0 → EXTRACT_END over ~1.2 s.
        const target = EXTRACT_END;
        const speed = target / 1.2; // %/s
        current = Math.min(current + speed * dt, target);
      } else if (currentPhase === "analysing") {
        // Frame-based ground truth: where are we really?
        const frameFraction =
          currentStatus.total > 0 ? currentStatus.done / currentStatus.total : 0;
        const frameTarget = EXTRACT_END + frameFraction * (ANALYSE_END - EXTRACT_END);

        // Time-based advance: how fast should we move given ETA?
        // We want to cover the remaining band in exactly `eta` seconds.
        const remaining = ANALYSE_END - current;
        let timeSpeed = 0;
        if (currentEta !== null && currentEta > 0 && remaining > 0) {
          // Move at a pace that reaches ANALYSE_END in `currentEta` seconds,
          // but apply a gentle ease-out so it doesn't slam into the cap.
          timeSpeed = (remaining / currentEta) * 0.9;
        } else if (remaining > 0) {
          // No ETA yet (first batch hasn't finished): crawl forward slowly.
          timeSpeed = 0.3;
        }

        const timeBased = current + timeSpeed * dt;

        // The bar can never go further than 5 % ahead of the real frame target,
        // and it must always advance to at least the frame target.
        const softCap = frameTarget + 5;
        current = Math.min(Math.max(timeBased, frameTarget), softCap, ANALYSE_END);
      } else if (currentPhase === "building") {
        // Animate from wherever we are → BUILD_END over ~0.8 s.
        const target = BUILD_END;
        const speed = (target - ANALYSE_END) / 0.8;
        current = Math.min(current + speed * dt, target);
      }

      // Never go backwards.
      current = Math.max(current, displayProgressRef.current);
      displayProgressRef.current = current;
      setDisplayProgress(Math.round(current * 10) / 10);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [phase]);

  const analysisActive = phase !== "idle";
  const projectNameReady = projectName.trim().length > 0;

  const onFileChange = (f: File | null) => {
    if (!f) return;

    const validationError = validateInspectionVideo(f);
    if (validationError) {
      analysisRunIdRef.current += 1;
      analysisAbortRef.current?.abort();
      setFile(null);
      setUploadProgress(0);
      setError(validationError);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setError(null);
    setAnalysisResult(null);
    setShowAnalysisProgress(false);
    setEta(null);
    setAnalyseStatus({ done: 0, total: 0 });
    setFile(f);
    setUploadProgress(0);

    const start = Date.now();
    const id = setInterval(() => {
      const pct = Math.min(100, Math.round(((Date.now() - start) / 800) * 100));
      setUploadProgress(pct);
      if (pct >= 100) clearInterval(id);
    }, 60);

    const runId = analysisRunIdRef.current + 1;
    analysisRunIdRef.current = runId;
    analysisAbortRef.current?.abort();
    const abortController = new AbortController();
    analysisAbortRef.current = abortController;
    const analysisPromise = analyseFile(f, runId, abortController.signal);
    analysisPromiseRef.current = analysisPromise;
    analysisPromise
      .then((result) => {
        if (analysisRunIdRef.current === runId) {
          setAnalysisResult(result);
        }
      })
      .catch((e: unknown) => {
        if (analysisRunIdRef.current === runId) {
          setError(e instanceof Error ? e.message : "Processing failed");
          setPhase("idle");
        }
      });
  };

  const sizeMb = file ? `${(file.size / 1_000_000).toFixed(1)} MB` : "";
  const ready = !!file && uploadProgress === 100 && projectNameReady && !finalizing && !error;

  const analyseFile = async (
    videoFile: File,
    runId: number,
    signal: AbortSignal,
  ): Promise<InspectionAnalysisResult> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const userId = session?.user?.id ?? null;

    setPhase("extracting");

    const { frames, duration, videoURL } = await extractFrames(videoFile);

    if (signal.aborted) throw new Error("Analysis was cancelled.");

    const id = crypto.randomUUID();

    setPhase("analysing");

    // Seed the ETA from a static estimate before the first batch returns.
    const initialEta = Math.ceil((frames.length / CONCURRENCY) * AVG_SECS_PER_FRAME);
    setEta(initialEta);
    setAnalyseStatus({ done: 0, total: frames.length });

    const detections: Detection[] = [];
    let done = 0;
    const startTime = Date.now();

    for (let i = 0; i < frames.length; i += CONCURRENCY) {
      const batch = frames.slice(i, i + CONCURRENCY);

      const results = await Promise.all(
        batch.map(async (fr) => {
          try {
            const json = await detectFrame(fr.blob, signal);
            return normalizeDetections(json, fr.timestamp);
          } catch {
            if (signal.aborted) throw new Error("Analysis was cancelled.");
            return [];
          }
        }),
      );

      for (const result of results) {
        if (result.length > 0) detections.push(...result);
      }

      done += batch.length;
      setAnalyseStatus({ done, total: frames.length });

      // Recompute ETA from actual elapsed time after each batch.
      if (done < frames.length) {
        const elapsed = (Date.now() - startTime) / 1000;
        const avgPerFrame = elapsed / done;
        const remaining = Math.ceil(avgPerFrame * (frames.length - done));
        setEta(remaining);
      } else {
        setEta(null);
      }
    }

    setPhase("building");

    const finalized = finalizeCorrosionDetections(detections);

    if (analysisRunIdRef.current !== runId) {
      throw new Error("Analysis was replaced by a newer upload.");
    }

    return {
      id,
      userId,
      videoURL,
      duration,
      detections: finalized,
      framesAnalysed: frames.length,
    };
  };

  const startInspection = async () => {
    if (!file) return;

    const projName = projectName.trim();
    if (!projName) {
      setError("Project name is required.");
      return;
    }

    setError(null);
    setFinalizing(true);
    setShowAnalysisProgress(true);

    try {
      const [result] = await Promise.all([
        analysisResult ?? analysisPromiseRef.current,
        new Promise((r) => setTimeout(r, 3000)),
      ]);

      if (!result) {
        throw new Error("Analysis has not started yet.");
      }

      if (analysisAbortRef.current?.signal.aborted) {
        throw new Error("Analysis was cancelled.");
      }

      const project = {
        id: result.id,
        name: projName,
        description,
        videoURL: result.videoURL,
        createdAt: formatCreatedAt(),
        detections: result.detections,
        status: "Completed",
        duration: result.duration,
        fileName: file.name,
        framesAnalysed: result.framesAnalysed,
        saveState: result.userId ? "saving" : "local",
      } as Project;

      projectsStore.add(project, { persist: false });

      if (result.userId) {
        void (async () => {
          try {
            const finalVideoURL = await uploadVideo(file, result.id);
            await projectsStore.add(
              { ...project, videoURL: finalVideoURL, saveState: "cloud" },
              { userId: result.userId },
            );
          } catch (err) {
            console.warn("Video upload failed, project kept in this browser session:", err);
            projectsStore.add({ ...project, saveState: "failed" }, { persist: false });
          }
        })();
      }

      // Let the bar animate to BUILD_END, then snap to 100 % and close.
      await new Promise((r) => setTimeout(r, 600));

      displayProgressRef.current = DONE;
      setDisplayProgress(DONE);

      await new Promise((r) => setTimeout(r, 300));

      onClose();

      navigate({
        to: "/models/corrosion/$projectId",
        params: { projectId: result.id },
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Processing failed");
    } finally {
      setFinalizing(false);
    }
  };

  const animDots = ["", ".", "..", "..."][dotStep];

  const phaseLabel =
    phase === "extracting"
      ? "Extracting frames..."
      : phase === "analysing"
        ? analyseStatus.done === 0
          ? `Connecting to AI model${animDots}`
          : `Analysing frame ${analyseStatus.done} of ${analyseStatus.total}${animDots}`
        : phase === "building"
          ? analysisResult
            ? "Analysis ready"
            : "Building results..."
          : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={finalizing ? undefined : onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={finalizing ? undefined : onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6">
          <h2 className="mb-5 text-xl font-semibold text-gray-900">New Inspection Project</h2>

          <div className="rounded-2xl border-2 border-dashed border-[#2E9E8F]/50 bg-[#F0FBF9] p-8 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white">
              <UploadCloud className="h-7 w-7 text-[#2E9E8F]" />
            </div>

            <div className="mb-1 text-base font-semibold text-gray-900">Upload your video file</div>

            <div className="mb-4 text-xs text-gray-500">
              Supports MP4, MOV, AVI, WebM up to {MAX_UPLOAD_MB}MB
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/x-msvideo,video/*"
              className="hidden"
              onChange={(e) => onFileChange(e.target.files?.[0] || null)}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={analysisActive || finalizing}
              className="rounded-lg bg-[#2E9E8F] px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-[#268579] disabled:opacity-50"
            >
              Browse Files
            </button>

            {file && (
              <div className="mx-auto mt-5 max-w-md rounded-xl border border-[#E5E7EB] bg-white p-3 text-left">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="truncate font-semibold text-gray-900">{file.name}</span>
                  <span className="ml-2 shrink-0 text-gray-500">{sizeMb}</span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full bg-[#2E9E8F] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>

                <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-600">
                  {uploadProgress === 100 ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#2E9E8F]" />
                      Ready · 100%
                    </>
                  ) : (
                    <>Loading... {uploadProgress}%</>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Project Name <span className="text-[#2E9E8F]">*</span>
              </label>

              <input
                type="text"
                value={projectName}
                onChange={(e) => {
                  setProjectName(e.target.value);
                  if (error === "Project name is required.") {
                    setError(null);
                  }
                }}
                disabled={finalizing}
                placeholder="e.g. Pipeline_Inspection_02"
                className="h-10 w-full rounded-md border border-[#E5E7EB] px-3 text-sm focus:border-[#2E86AB] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Description</label>

              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={finalizing}
                placeholder="Optional notes about this inspection"
                className="h-10 w-full rounded-md border border-[#E5E7EB] px-3 text-sm focus:border-[#2E86AB] focus:outline-none"
              />
            </div>
          </div>

          {showAnalysisProgress && analysisActive && (
            <div className="mt-6">
              <div className="mb-2">
                <span className="text-xs text-gray-700">{phaseLabel}</span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full bg-[#2E9E8F] transition-none"
                  style={{ width: `${displayProgress}%` }}
                />
              </div>
            </div>
          )}

          {error && <div className="mt-4 text-xs text-amber-600">{error}</div>}

          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              disabled={finalizing}
              className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              onClick={startInspection}
              disabled={!ready}
              className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
                ready
                  ? "bg-[#2E9E8F] text-white hover:bg-[#268579]"
                  : "cursor-not-allowed bg-gray-200 text-gray-400"
              }`}
            >
              {finalizing ? "Opening..." : "Start Inspection"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="p-4">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF]">
        <Icon className="h-4 w-4 text-[#2E86AB]" />
      </div>

      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</div>
      <div className="mt-1 text-base font-semibold leading-tight text-gray-800">{value}</div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-semibold text-gray-800">{value}</span>
    </div>
  );
}
