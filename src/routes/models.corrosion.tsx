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

const AVG_SECS_PER_FRAME = 7;
const CONCURRENCY = 2;

export const Route = createFileRoute("/models/corrosion")({
  component: CorrosionModelPage,
});

const projectsToolbarBtn =
  "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border px-4 text-xs font-semibold uppercase tracking-wide transition-colors";

async function importManifestIntoSession(
  manifestJson: string,
  videoFile: File
): Promise<void> {
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

  const id =
    typeof proj.id === "string" && proj.id.length > 0
      ? proj.id
      : String(Date.now());

  if (projectsStore.get(id)) {
    projectsStore.remove(id);
  }

  let videoURL = URL.createObjectURL(videoFile);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) {
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
    createdAt:
      typeof proj.createdAt === "string"
        ? proj.createdAt
        : formatCreatedAt(),
    detections: finalizeCorrosionDetections(detections as Detection[]),
    status:
      typeof proj.status === "string" ? proj.status : "Completed",
    duration:
      typeof proj.duration === "number" ? proj.duration : 0,
    fileName:
      typeof proj.fileName === "string"
        ? proj.fileName
        : videoFile.name,
    framesAnalysed:
      typeof proj.framesAnalysed === "number"
        ? proj.framesAnalysed
        : undefined,
  };

  projectsStore.add(project);
}

function CorrosionModelPage() {
  const [openNew, setOpenNew] = useState(false);
  const [openImport, setOpenImport] = useState(false);

  const sessionProjects = useProjects();

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">
        Corrosion Detection — Video
      </h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[18px] font-bold text-gray-900">
              Projects
            </h2>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOpenImport(true)}
                className={`${projectsToolbarBtn} border-[#2E86AB] bg-white text-[#2E86AB] hover:bg-[#EEF2FF]`}
              >
                <FileDown
                  className="h-4 w-4 shrink-0"
                  aria-hidden
                />
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

          <div className="relative mb-4 w-1/3 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              placeholder="Search projects"
              className="h-9 w-full rounded-md border border-[#E5E7EB] bg-white pl-8 pr-3 text-sm focus:border-[#2E86AB] focus:outline-none"
            />
          </div>

          <div className="space-y-3">
            {sessionProjects.map((p) => (
              <Link
                key={p.id}
                to="/models/corrosion/$projectId"
                params={{ projectId: p.id }}
                className="flex items-center gap-4 rounded-lg border border-[#E5E7EB] bg-white p-4 transition hover:border-[#2E86AB] hover:shadow-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#EEF2FF]">
                  <Folder className="h-5 w-5 text-[#2E86AB]" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-gray-900">
                    {p.name}
                  </div>

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

                <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
              </Link>
            ))}

            <Link
              to="/models/corrosion/pipeline-inspection-01"
              className="flex items-center gap-4 rounded-lg border border-[#2E86AB]/30 bg-white p-4 ring-1 ring-[#2E86AB]/10 transition hover:border-[#2E86AB] hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#EEF2FF]">
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
                  Video and analysis ship with this deploy ·{" "}
                  {STATIC_FEATURED_DEMO.createdAt}
                </div>
              </div>

              <span className="shrink-0 rounded bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">
                {STATIC_FEATURED_DEMO.detections.length} detections
              </span>

              <span className="shrink-0 rounded bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                {STATIC_FEATURED_DEMO.status}
              </span>

              <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
            </Link>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="space-y-3">
            <StatCard
              icon={Target}
              label="Model Accuracy"
              value="92%"
            />

            <StatCard
              icon={Film}
              label="Frames Analysed"
              value="1,240 / 1,350"
            />

            <StatCard
              icon={AlertTriangle}
              label="Defects Marked"
              value="347"
            />
          </div>

          <div className="rounded-lg border border-[#E5E7EB] bg-white p-6">
            <h2 className="mb-3 text-base font-bold text-gray-900">
              Model Information
            </h2>

            <p className="mb-4 text-xs leading-relaxed text-gray-600">
              This pre-trained model detects and labels corrosion
              across video footage. The AI scans each frame, flags
              defects, and prioritises by severity level.
            </p>

            <div className="divide-y divide-[#F0F2F7]">
              <MetaRow label="Model Id" value="10019" />
              <MetaRow
                label="Project Name"
                value="Project_corrosion_video"
              />
              <MetaRow label="Type" value="Object Detection" />
              <MetaRow label="Algorithm" value="MaskRCNN0" />
              <MetaRow label="Created" value="08 May 2025" />
            </div>
          </div>
        </div>
      </div>

      {openNew && (
        <NewProjectModal
          onClose={() => setOpenNew(false)}
        />
      )}

      {openImport && (
        <ImportProjectModal
          onClose={() => setOpenImport(false)}
          onDone={() => setOpenImport(false)}
        />
      )}
    </AppShell>
  );
}

function ImportProjectModal({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void;
}) {
  const manifestRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const mf = manifestRef.current?.files?.[0];
    const vf = videoRef.current?.files?.[0];

    if (!mf || !vf) {
      toast.error(
        "Choose both an export JSON file and the matching video file."
      );
      return;
    }

    setBusy(true);

    try {
      const text = await mf.text();

      await importManifestIntoSession(text, vf);

      toast.success("Project imported.");

      onDone();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Import failed"
      );
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

        <h2 className="mb-2 text-lg font-semibold text-gray-900">
          Import project
        </h2>

        <p className="mb-4 text-xs text-gray-600">
          Use the <strong>Export JSON</strong> file from another
          deployment, plus the same <strong>video</strong> file.
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
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              Video (.mp4)
            </label>

            <input
              ref={videoRef}
              type="file"
              accept="video/*"
              className="block w-full text-sm"
            />
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

function NewProjectModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");

  const [phase, setPhase] = useState<
    "idle" | "extracting" | "analysing" | "building"
  >("idle");

  const [analyseStatus, setAnalyseStatus] = useState({ done: 0, total: 0 });
  const [eta, setEta] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dotStep, setDotStep] = useState(0);

  // Cycle blank → . → .. → ... → blank while analysing.
  useEffect(() => {
    if (phase !== "analysing") { setDotStep(0); return; }
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
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { etaRef.current = eta; }, [eta]);
  useEffect(() => { analyseStatusRef.current = analyseStatus; }, [analyseStatus]);

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
          currentStatus.total > 0
            ? currentStatus.done / currentStatus.total
            : 0;
        const frameTarget =
          EXTRACT_END + frameFraction * (ANALYSE_END - EXTRACT_END);

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
  // We only want to (re)start the loop when phase changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const processing = phase !== "idle";

  const onFileChange = (f: File | null) => {
    if (!f) return;
    setFile(f);
    setUploadProgress(0);

    const start = Date.now();
    const id = setInterval(() => {
      const pct = Math.min(100, Math.round(((Date.now() - start) / 800) * 100));
      setUploadProgress(pct);
      if (pct >= 100) clearInterval(id);
    }, 60);
  };

  const sizeMb = file ? `${(file.size / 1_000_000).toFixed(1)} MB` : "";
  const ready = !!file && uploadProgress === 100 && !processing;

  const startInspection = async () => {
    if (!file) return;

    setError(null);
    setEta(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const isLoggedIn = !!session?.user;

      setPhase("extracting");

      const { frames, duration, videoURL } = await extractFrames(file);

      const id = String(Date.now());

      const uploadPromise = isLoggedIn
        ? uploadVideo(file, id).catch(() => videoURL)
        : Promise.resolve(videoURL);

      setPhase("analysing");

      // Seed the ETA from a static estimate before the first batch returns.
      const initialEta = Math.ceil(
        (frames.length / CONCURRENCY) * AVG_SECS_PER_FRAME
      );
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
              const json = await detectFrame(fr.blob);
              return normalizeDetections(json, fr.timestamp);
            } catch {
              return [];
            }
          })
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

      const projName = projectName.trim() || file.name.replace(/\.[^.]+$/, "");
      const finalized = finalizeCorrosionDetections(detections);
      const finalVideoURL = await uploadPromise;

      projectsStore.add({
        id,
        name: projName,
        description,
        videoURL: finalVideoURL,
        createdAt: formatCreatedAt(),
        detections: finalized,
        status: "Completed",
        duration,
        fileName: file.name,
        framesAnalysed: frames.length,
      } as Project);

      // Let the bar animate to BUILD_END, then snap to 100 % and close.
      await new Promise((r) => setTimeout(r, 600));

      displayProgressRef.current = DONE;
      setDisplayProgress(DONE);

      await new Promise((r) => setTimeout(r, 300));

      onClose();

      navigate({
        to: "/models/corrosion/$projectId",
        params: { projectId: id },
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Processing failed");
      setPhase("idle");
    }
  };

  const animDots = ["", ".", "..", "..."][dotStep];

  const phaseLabel =
    phase === "extracting"
      ? "Extracting frames..."
      : phase === "analysing"
        ? analyseStatus.done === 0
          ? `Connecting to AI model · this may take up to 20s on first run${animDots}`
          : `Analysing frame ${analyseStatus.done} of ${analyseStatus.total}${animDots}`
        : phase === "building"
          ? "Building results..."
          : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={processing ? undefined : onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={processing ? undefined : onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6">
          <h2 className="mb-5 text-xl font-semibold text-gray-900">
            New Inspection Project
          </h2>

          <div className="rounded-2xl border-2 border-dashed border-[#2E9E8F]/50 bg-[#F0FBF9] p-8 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white">
              <UploadCloud className="h-7 w-7 text-[#2E9E8F]" />
            </div>

            <div className="mb-1 text-base font-semibold text-gray-900">
              Upload your video file
            </div>

            <div className="mb-4 text-xs text-gray-500">
              Supports MP4, MOV, AVI up to 50MB
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
              disabled={processing}
              className="rounded-lg bg-[#2E9E8F] px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-[#268579] disabled:opacity-50"
            >
              Browse Files
            </button>

            {file && (
              <div className="mx-auto mt-5 max-w-md rounded-xl border border-[#E5E7EB] bg-white p-3 text-left">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="truncate font-semibold text-gray-900">
                    {file.name}
                  </span>
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
                Project Name
              </label>

              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                disabled={processing}
                placeholder="e.g. Pipeline_Inspection_02"
                className="h-10 w-full rounded-md border border-[#E5E7EB] px-3 text-sm focus:border-[#2E86AB] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Description
              </label>

              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={processing}
                placeholder="Optional notes about this inspection"
                className="h-10 w-full rounded-md border border-[#E5E7EB] px-3 text-sm focus:border-[#2E86AB] focus:outline-none"
              />
            </div>
          </div>

          {processing && (
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

          {error && (
            <div className="mt-4 text-xs text-amber-600">
              {error} — sign in to save projects across sessions.
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              disabled={processing}
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
              {processing ? "Processing..." : "Start Inspection"}
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
    <div className="flex items-center gap-4 rounded-xl border border-[#E5E7EB] bg-white p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF]">
        <Icon className="h-5 w-5 text-[#2E86AB]" />
      </div>

      <div>
        <div className="text-xs font-medium text-gray-500">{label}</div>
        <div className="text-lg font-bold text-gray-900">{value}</div>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}