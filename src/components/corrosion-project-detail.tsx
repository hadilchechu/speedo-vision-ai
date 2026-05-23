import {
  Target,
  Film,
  AlertTriangle,
  Play,
  Pause,
  BarChart3,
  Gauge,
  Crosshair,
  MoreHorizontal,
  Maximize,
  X,
  Cloud,
  HardDrive,
  Loader2,
} from "lucide-react";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { AppShell } from "@/components/app-shell";
import { ProjectActionGroup } from "@/components/cloud-project-actions";
import { InspectionSummary, VideoFrameSnapshot } from "@/components/frame-panels";
import {
  formatTimestamp,
  type Detection,
  type Project,
  type ProjectSaveState,
} from "@/lib/projects-store";

type ReviewStatus = "confirmed" | "dismissed" | "pending";

type TimelineDetection = Detection & { id: number; status: ReviewStatus };

export function CorrosionProjectDetail({
  project,
  defaultReviewStatus = "pending",
}: {
  project: Project;
  /** Featured demo uses confirmed rows for a finished-review look. */
  defaultReviewStatus?: Extract<ReviewStatus, "pending" | "confirmed">;
}) {
  const tabs = ["Timeline", "Predictions", "Details"];
  const [active, setActive] = useState("Timeline");
  const [uiDuration, setUiDuration] = useState(project.duration);
  const [detections, setDetections] = useState<TimelineDetection[]>(() =>
    project.detections.map((d, i) => ({ ...d, id: i, status: defaultReviewStatus })),
  );

  useEffect(() => {
    setUiDuration(project.duration);
    setDetections(project.detections.map((d, i) => ({ ...d, id: i, status: defaultReviewStatus })));
  }, [project.id, project.duration, project.detections, defaultReviewStatus]);

  const displayProject: Project = { ...project, duration: uiDuration || project.duration };

  return (
    <AppShell>
      <div className="mb-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <span>Corrosion Detection — Video · {project.createdAt}</span>
            <SaveStateBadge state={project.saveState} />
          </div>
        </div>
        <ProjectActionGroup project={displayProject} detections={detections} activeTab={active} />
      </div>
      <div className="mb-6 mt-4 border-b border-[#E5E7EB]">
        <div className="flex gap-6">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActive(t)}
              className={`rounded-md px-1 pb-3 text-sm font-medium transition-colors -mb-px ${
                active === t
                  ? "border-b-2 border-[#2E86AB] text-[#2E86AB]"
                  : "border-b-2 border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      {active === "Details" && <DetailsTab project={displayProject} />}
      {active === "Timeline" && (
        <TimelineTab
          key={project.id}
          project={displayProject}
          detections={detections}
          setDetections={setDetections}
          onDurationKnown={setUiDuration}
        />
      )}
      {active === "Predictions" && <PredictionsTab key={project.id} project={displayProject} />}
    </AppShell>
  );
}

function SaveStateBadge({ state }: { state?: ProjectSaveState }) {
  if (!state) return null;

  const badge = {
    cloud: {
      label: "Saved to cloud",
      Icon: Cloud,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    saving: {
      label: "Saving to cloud...",
      Icon: Loader2,
      className: "border-sky-200 bg-sky-50 text-sky-700",
    },
    local: {
      label: "Stored in this browser",
      Icon: HardDrive,
      className: "border-slate-200 bg-slate-50 text-slate-600",
    },
    failed: {
      label: "Stored in this browser",
      Icon: HardDrive,
      className: "border-amber-200 bg-amber-50 text-amber-700",
    },
  }[state];

  const { Icon } = badge;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${badge.className}`}
    >
      <Icon className={`h-3.5 w-3.5 ${state === "saving" ? "animate-spin" : ""}`} />
      {badge.label}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Target;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#EEF2FF]">
          <Icon className="h-4 w-4 text-[#2E86AB]" />
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex py-2 text-sm">
      <span className="w-40 text-gray-500">{label}</span>
      <span className="mr-4 text-gray-400">:</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function formatDurationLong(secs: number) {
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  if (m === 0) return `${s} second${s === 1 ? "" : "s"}`;
  if (s === 0) return `${m} minute${m === 1 ? "" : "s"}`;
  return `${m} min ${s} sec`;
}

/** Seconds: closest detection to playhead is shown when within this distance (playback + paused overlay). */
const OVERLAY_TIME_WINDOW_SEC = 0.45;

/** Closest detection to the playhead (for list selection while playing). */
function primaryDetectionAtPlayhead(
  detections: TimelineDetection[],
  t: number,
): TimelineDetection | null {
  const near = detectionsNearPlayhead(detections, t);
  return near[0] ?? null;
}

/** All detections in the playhead window, closest first (for drawing every box while playing). */
function detectionsNearPlayhead(
  detections: TimelineDetection[],
  t: number,
  windowSec = OVERLAY_TIME_WINDOW_SEC,
): TimelineDetection[] {
  const near = detections.filter((d) => Math.abs(d.timestamp - t) <= windowSec);
  near.sort((a, b) => Math.abs(a.timestamp - t) - Math.abs(b.timestamp - t) || a.id - b.id);
  return near;
}

function firstDetectionIdByTimestamp(
  detections: Pick<TimelineDetection, "id" | "timestamp">[],
): number | null {
  if (detections.length === 0) return null;
  const sorted = [...detections].sort((a, b) => a.timestamp - b.timestamp || a.id - b.id);
  return sorted[0]?.id ?? null;
}

function DetailsTab({ project }: { project: Project }) {
  const frames = project.framesAnalysed ?? 0;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard icon={Film} label="Video Duration" value={formatTimestamp(project.duration)} />
        <StatCard
          icon={Target}
          label="Frames Analysed"
          value={frames ? `${frames} / ${frames}` : "—"}
        />
        <StatCard
          icon={AlertTriangle}
          label="Defects Detected"
          value={String(project.detections.length)}
        />
      </div>
      <div className="rounded-lg border border-[#E5E7EB] bg-white p-6">
        <h2 className="mb-4 text-[18px] font-bold text-gray-900">Project Information</h2>
        <div className="divide-y divide-[#F0F2F7]">
          <MetaRow label="Video File" value={project.fileName ?? `${project.name}.mp4`} />
          <MetaRow label="Uploaded" value={project.createdAt} />
          <MetaRow label="Status" value={project.status} />
          <MetaRow label="Model Used" value="Corrosion Detection — Video" />
          <MetaRow label="Duration" value={formatDurationLong(project.duration)} />
        </div>
      </div>
    </div>
  );
}

function TimelineTab({
  project,
  detections,
  setDetections,
  onDurationKnown,
}: {
  project: Project;
  detections: TimelineDetection[];
  setDetections: Dispatch<SetStateAction<TimelineDetection[]>>;
  onDurationKnown: (seconds: number) => void;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(() =>
    firstDetectionIdByTimestamp(
      project.detections.map((d, i) => ({ id: i, timestamp: d.timestamp })),
    ),
  );
  const [playing, setPlaying] = useState(false);
  const [expandedVideo, setExpandedVideo] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const initialSeekDoneRef = useRef(false);
  const detectionsRef = useRef(detections);
  detectionsRef.current = detections;
  const lastDetectionSec =
    project.detections.length === 0 ? 0 : Math.max(...project.detections.map((d) => d.timestamp));
  const [mediaDurationSec, setMediaDurationSec] = useState<number | null>(null);

  const selected = detections.find((d) => d.id === selectedId) || null;
  const primaryAtPlayhead = primaryDetectionAtPlayhead(detections, currentTime);
  const overlayDetections = playing
    ? primaryAtPlayhead
      ? [primaryAtPlayhead]
      : []
    : selected && Math.abs(currentTime - selected.timestamp) <= OVERLAY_TIME_WINDOW_SEC
      ? [selected]
      : [];
  const confirmed = detections.filter((d) => d.status === "confirmed").length;
  const dismissed = detections.filter((d) => d.status === "dismissed").length;
  const pending = detections.filter((d) => d.status === "pending").length;

  const updateStatus = (id: number, status: ReviewStatus) =>
    setDetections((arr) => arr.map((d) => (d.id === id ? { ...d, status } : d)));

  const onConfirmCard = (id: number, status: ReviewStatus) => {
    if (status === "confirmed") return;
    updateStatus(id, "confirmed");
  };

  const onDismissCard = (id: number, status: ReviewStatus) => {
    if (status === "dismissed") return;
    updateStatus(id, "dismissed");
  };

  const seekTo = (t: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.volume = 0;
    const maxT = v.duration && Number.isFinite(v.duration) ? Math.max(0, v.duration - 0.05) : t;
    const clamped = Math.min(Math.max(0, t), maxT);
    v.currentTime = clamped;
    setCurrentTime(clamped);
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.volume = 0;
    if (v.paused) {
      void v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  useEffect(() => {
    initialSeekDoneRef.current = false;
    setMediaDurationSec(null);
  }, [project.videoURL]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const enforceSilent = () => {
      v.muted = true;
      v.volume = 0;
    };
    enforceSilent();
    const onTime = () => setCurrentTime(v.currentTime);
    const onMeta = () => {
      enforceSilent();
      if (v.duration && Number.isFinite(v.duration) && v.duration > 0) {
        onDurationKnown(v.duration);
        setMediaDurationSec(v.duration);
      }
      const list = detectionsRef.current;
      if (!initialSeekDoneRef.current && list.length > 0) {
        initialSeekDoneRef.current = true;
        const sorted = [...list].sort((a, b) => a.timestamp - b.timestamp || a.id - b.id);
        const first = sorted[0];
        if (first) {
          const maxT =
            v.duration && Number.isFinite(v.duration)
              ? Math.max(0, v.duration - 0.05)
              : first.timestamp;
          const t = Math.min(Math.max(0, first.timestamp), maxT);
          v.currentTime = t;
          setCurrentTime(t);
          setSelectedId(first.id);
        }
      }
    };
    const onVolume = () => enforceSilent();
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("volumechange", onVolume);
    if (v.readyState >= 1) onMeta();
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("volumechange", onVolume);
    };
  }, [project.videoURL, onDurationKnown]);

  useEffect(() => {
    if (!playing) return;
    const d = primaryDetectionAtPlayhead(detections, currentTime);
    setSelectedId(d?.id ?? null);
  }, [playing, currentTime, detections]);

  /** Smoother playhead than `timeupdate` alone so overlays track the video. */
  useEffect(() => {
    if (!playing) return;
    const v = videoRef.current;
    if (!v) return;
    let id = 0;
    const tick = () => {
      setCurrentTime(v.currentTime);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [playing]);

  useEffect(() => {
    if (!expandedVideo) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpandedVideo(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [expandedVideo]);

  if (detections.length === 0) {
    return (
      <div className="rounded-lg border border-[#E5E7EB] bg-white p-10 text-center text-sm text-gray-600">
        No corrosion detected in this video.
        <div className="mx-auto mt-6 max-w-2xl">
          <video
            ref={videoRef}
            src={project.videoURL}
            controls
            muted
            playsInline
            className="w-full rounded-md"
          />
        </div>
      </div>
    );
  }

  const progressPct = project.duration ? (currentTime / project.duration) * 100 : 0;

  const videoCardClasses = expandedVideo
    ? "fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(80vw,1400px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-2xl"
    : "rounded-lg border border-[#E5E7EB] bg-white p-4";

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      {expandedVideo ? (
        <button
          type="button"
          className="fixed inset-0 z-40 cursor-default bg-slate-950/55 backdrop-blur-sm"
          aria-label="Close enlarged video"
          onClick={() => setExpandedVideo(false)}
        />
      ) : null}
      <div
        className={`space-y-4 lg:sticky lg:top-8 lg:col-span-2 ${
          expandedVideo ? "relative z-50" : ""
        }`}
      >
        <div className={videoCardClasses}>
          {expandedVideo ? (
            <button
              type="button"
              onClick={() => setExpandedVideo(false)}
              className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-gray-600 shadow-lg transition-colors hover:bg-gray-100 hover:text-gray-900"
              aria-label="Close enlarged video"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
          <div
            className="relative w-full overflow-hidden rounded-md bg-[#1f2937]"
            style={{ aspectRatio: "16/9" }}
          >
            <video
              ref={videoRef}
              src={project.videoURL}
              className="h-full w-full object-contain"
              muted
              playsInline
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />
            {overlayDetections.map((d, idx) => (
              <div
                key={d.id}
                className="pointer-events-none absolute border-2 border-orange-500 bg-orange-500/20"
                style={{
                  left: `${d.box.x}%`,
                  top: `${d.box.y}%`,
                  width: `${d.box.width}%`,
                  height: `${d.box.height}%`,
                  zIndex: 10 + idx,
                }}
              >
                <span className="absolute left-0 top-0 z-10 -mt-1 -translate-y-full whitespace-nowrap rounded-lg bg-orange-500 px-2 py-0.5 text-xs font-semibold text-white shadow">
                  Corrosion — {d.confidence.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3 px-1">
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2E86AB] text-white hover:bg-[#246d8c]"
            >
              {playing ? (
                <Pause className="h-4 w-4" fill="currentColor" />
              ) : (
                <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
              )}
            </button>
            <span className="shrink-0 font-mono text-xs text-gray-600">
              {formatTimestamp(currentTime)} / {formatTimestamp(project.duration)}
            </span>
            <div className="relative h-2 flex-1 rounded-full bg-gray-200">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-[#2E86AB]"
                style={{ width: `${progressPct}%` }}
              />
              {detections.map((d) => (
                <div
                  key={d.id}
                  className="group absolute -top-1 h-4 w-3 -translate-x-1/2 cursor-pointer"
                  style={{
                    left: `${project.duration ? (d.timestamp / project.duration) * 100 : 0}%`,
                  }}
                  onClick={() => {
                    setSelectedId(d.id);
                    seekTo(d.timestamp);
                  }}
                >
                  <div className="h-3 w-3 rounded-full border-2 border-white bg-red-500 shadow" />
                  <div className="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white group-hover:block">
                    Corrosion detected — {d.confidence.toFixed(0)}% confidence
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setExpandedVideo(true)}
              className="shrink-0 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#2E86AB]"
              aria-label="Enlarge video"
            >
              <Maximize className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 px-1 text-[10px] leading-4 text-gray-400">
            AI detections are generated by an experimental Hugging Face model and may include false
            results due to model or processing limitations.
          </p>
          {mediaDurationSec != null && mediaDurationSec + 0.25 < lastDetectionSec ? (
            <p className="mt-3 text-xs text-amber-800">
              This file ends at {formatTimestamp(mediaDurationSec)}, but detections run through{" "}
              {formatTimestamp(lastDetectionSec)}. Use the full-length video (same path:{" "}
              <code className="rounded bg-amber-100 px-1">public/demo-inspection/demo.mp4</code>) so
              every timestamp can be played and thumbnailed.
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-4">
        <InspectionSummary>
          Analysis complete. {detections.length} instances of corrosion detected across{" "}
          {formatTimestamp(project.duration)} of footage.
        </InspectionSummary>
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-5">
          <h3 className="mb-3 text-base font-bold text-gray-900">Frame Detections</h3>
          <div className="mb-4 border-b border-[#F0F2F7] pb-3 text-xs text-gray-500">
            {detections.length} detections · {confirmed} confirmed · {dismissed} dismissed ·{" "}
            {pending} pending
          </div>
          <div className="max-h-[600px] space-y-3 overflow-y-auto pr-1">
            {detections.map((d, imageIndex) => {
              const imageLabel = `Image ${imageIndex + 1}`;
              const isDismissed = d.status === "dismissed";
              const isConfirmed = d.status === "confirmed";
              const selected = selectedId === d.id;
              const cardShell = [
                "cursor-pointer rounded-md p-3 transition",
                selected
                  ? "border border-[#2E86AB] bg-[#EEF2FF]"
                  : "border border-[#E5E7EB] hover:bg-gray-50",
              ].join(" ");

              const actionBase =
                "inline-flex min-h-[32px] min-w-0 items-center justify-center overflow-hidden whitespace-nowrap rounded-lg border py-2 text-xs font-semibold transition-[flex-basis,flex-grow,opacity,padding,border-color,background-color,color] duration-200 ease-out";
              const actionHidden =
                "pointer-events-none flex-[0_1_0px] border-transparent px-0 opacity-0";
              const actionIdle = "flex-[1_1_0%] bg-white px-2";
              const actionActive = "flex-[1_1_0%] px-2 opacity-100";

              const confirmClasses = isConfirmed
                ? `${actionBase} ${actionActive} border-[#7bcbbc] bg-[#e8f6f3] text-[#1f6f63] hover:border-[#62bba9] hover:bg-[#dcf0ec]`
                : isDismissed
                  ? `${actionBase} ${actionHidden}`
                  : `${actionBase} ${actionIdle} border-gray-300 text-gray-700 hover:border-[#2E9E8F] hover:bg-[#2E9E8F]/10 hover:text-[#2E9E8F]`;

              const dismissClasses = isDismissed
                ? `${actionBase} ${actionActive} border-gray-300 bg-gray-100 text-gray-700 hover:border-gray-400 hover:bg-gray-200/70`
                : isConfirmed
                  ? `${actionBase} ${actionHidden}`
                  : `${actionBase} ${actionIdle} border-gray-300 text-gray-700 hover:bg-gray-100`;

              const actionGroupClasses = [
                "flex min-w-0 flex-1 transition-[gap] duration-200 ease-out",
                d.status === "pending" ? "gap-2" : "gap-0",
              ].join(" ");

              const resetClasses = [
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-500 transition-[opacity,transform,border-color,background-color,color] duration-200 ease-out hover:bg-gray-100 hover:text-gray-700",
                d.status === "pending"
                  ? "pointer-events-none scale-95 opacity-0"
                  : "scale-100 opacity-100",
              ].join(" ");

              return (
                <div
                  key={d.id}
                  onClick={() => {
                    setSelectedId(d.id);
                    seekTo(d.timestamp);
                  }}
                  className={cardShell}
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-gray-900">{imageLabel}</div>
                      <div className="mt-0.5 text-xs text-gray-500">
                        {formatTimestamp(d.timestamp)}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-medium capitalize text-gray-600">
                      {d.status}
                    </span>
                  </div>
                  <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs font-semibold text-[#2E86AB]">
                    <span>Accuracy {d.confidence.toFixed(1)}%</span>
                    <span className="font-normal text-gray-300">|</span>
                    <span>Area {d.area_percent.toFixed(1)}%</span>
                  </div>
                  <div className="flex w-full items-center gap-2">
                    <div className={actionGroupClasses}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(d.id);
                          seekTo(d.timestamp);
                          onConfirmCard(d.id, d.status);
                        }}
                        className={confirmClasses}
                        aria-hidden={isDismissed}
                        tabIndex={isDismissed ? -1 : 0}
                      >
                        {isConfirmed ? "Confirmed" : "Confirm"}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(d.id);
                          seekTo(d.timestamp);
                          onDismissCard(d.id, d.status);
                        }}
                        className={dismissClasses}
                        aria-hidden={isConfirmed}
                        tabIndex={isConfirmed ? -1 : 0}
                      >
                        {isDismissed ? "Dismissed" : "Dismiss"}
                      </button>
                    </div>
                    <button
                      type="button"
                      aria-label="Reset detection action"
                      tabIndex={d.status === "pending" ? -1 : 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(d.id);
                        seekTo(d.timestamp);
                        updateStatus(d.id, "pending");
                      }}
                      className={resetClasses}
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function PredictionStatCard({
  icon: Icon,
  label,
  value,
  clickable,
}: {
  icon: typeof Target;
  label: string;
  value?: string;
  clickable?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border border-[#E5E7EB] bg-white p-5 ${clickable ? "cursor-pointer transition hover:border-[#2E86AB]" : ""}`}
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#EEF2FF]">
          <Icon className="h-4 w-4 text-[#2E86AB]" />
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      {value ? (
        <div className="text-3xl font-bold text-gray-900">{value}</div>
      ) : (
        <div className="text-sm font-semibold text-[#2E86AB]">View all →</div>
      )}
    </div>
  );
}

function PredictionsTab({ project }: { project: Project }) {
  const detections = project.detections;
  const avgScore = detections.length
    ? (detections.reduce((s, d) => s + d.confidence / 100, 0) / detections.length).toFixed(2)
    : "0.00";
  const avgArea = detections.length
    ? (detections.reduce((s, d) => s + d.area_percent, 0) / detections.length).toFixed(1) + "%"
    : "0%";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <PredictionStatCard icon={Gauge} label="Average Prediction Score" value={avgScore} />
        <PredictionStatCard icon={Crosshair} label="Mean Average Precision" value="0.8" />
        <PredictionStatCard icon={BarChart3} label="Average Annotated Area" value={avgArea} />
        <PredictionStatCard icon={MoreHorizontal} label="More Stats" clickable />
      </div>

      <div className="space-y-3">
        {detections.map((d, i) => (
          <div
            key={i}
            className="grid grid-cols-1 items-center gap-4 rounded-lg border border-[#E5E7EB] bg-white p-4 md:grid-cols-3"
          >
            <div className="space-y-1.5 text-sm">
              <div>
                <span className="text-gray-500">Name: </span>
                <span className="font-semibold text-gray-900">Image {i + 1}</span>
              </div>
              <div>
                <span className="text-gray-500">Created On: </span>
                <span className="font-semibold text-gray-900">{project.createdAt}</span>
              </div>
              <div>
                <span className="text-gray-500">Area %: </span>
                <span className="font-semibold text-[#2E86AB]">{d.area_percent.toFixed(1)}%</span>
              </div>
            </div>
            <VideoFrameSnapshot
              videoSrc={project.videoURL}
              timestamp={d.timestamp}
              box={d.box}
              variant="original"
            />
            <VideoFrameSnapshot
              videoSrc={project.videoURL}
              timestamp={d.timestamp}
              box={d.box}
              variant="annotated"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
