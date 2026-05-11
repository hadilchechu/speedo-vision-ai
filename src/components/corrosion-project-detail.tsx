import { Target, Film, AlertTriangle, Play, Pause, Search, LayoutGrid, List, Columns2, BarChart3, Gauge, Crosshair, MoreHorizontal, Pencil, Volume2, Maximize } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { InspectionSummary, VideoFrameSnapshot } from "@/components/frame-panels";
import { formatTimestamp, type Detection, type Project } from "@/lib/projects-store";

type ReviewStatus = "confirmed" | "dismissed" | "pending";

type TimelineDetection = Detection & { id: number; status: ReviewStatus; labelOverride?: string };

export function CorrosionProjectDetail({
  project,
  defaultReviewStatus = "pending",
  headerExtra,
}: {
  project: Project;
  /** Featured demo uses confirmed rows for a finished-review look. */
  defaultReviewStatus?: Extract<ReviewStatus, "pending" | "confirmed">;
  headerExtra?: ReactNode;
}) {
  const tabs = ["Details", "Timeline", "Predictions"];
  const [active, setActive] = useState("Details");
  const [uiDuration, setUiDuration] = useState(project.duration);

  useEffect(() => {
    setUiDuration(project.duration);
  }, [project.id, project.duration]);

  const displayProject: Project = { ...project, duration: uiDuration || project.duration };

  return (
    <AppShell>
      <div className="mb-2 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
          <div className="mt-1 text-sm text-gray-500">Corrosion Detection — Video · {project.createdAt}</div>
        </div>
        {headerExtra}
      </div>
      <div className="mb-6 mt-4 border-b border-[#E5E7EB]">
        <div className="flex gap-6">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActive(t)}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors -mb-px ${
                active === t ? "border-[#2E86AB] text-[#2E86AB]" : "border-transparent text-gray-500 hover:text-gray-700"
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
          defaultReviewStatus={defaultReviewStatus}
          onDurationKnown={setUiDuration}
        />
      )}
      {active === "Predictions" && <PredictionsTab key={project.id} project={displayProject} />}
    </AppShell>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string }) {
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

function DetailsTab({ project }: { project: Project }) {
  const frames = project.framesAnalysed ?? 0;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard icon={Film} label="Video Duration" value={formatTimestamp(project.duration)} />
        <StatCard icon={Target} label="Frames Analysed" value={frames ? `${frames} / ${frames}` : "—"} />
        <StatCard icon={AlertTriangle} label="Defects Detected" value={String(project.detections.length)} />
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
  defaultReviewStatus,
  onDurationKnown,
}: {
  project: Project;
  defaultReviewStatus: ReviewStatus;
  onDurationKnown: (seconds: number) => void;
}) {
  const [detections, setDetections] = useState<TimelineDetection[]>(() =>
    project.detections.map((d, i) => ({ ...d, id: i, status: defaultReviewStatus }))
  );
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const selected = detections.find((d) => d.id === selectedId) || null;
  const confirmed = detections.filter((d) => d.status === "confirmed").length;
  const dismissed = detections.filter((d) => d.status === "dismissed").length;
  const pending = detections.filter((d) => d.status === "pending").length;

  const updateStatus = (id: number, status: ReviewStatus) =>
    setDetections((arr) => arr.map((d) => (d.id === id ? { ...d, status } : d)));
  const updateLabel = (id: number, label: string) =>
    setDetections((arr) => arr.map((d) => (d.id === id ? { ...d, labelOverride: label } : d)));

  const seekTo = (t: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.min(Math.max(0, t), Math.max(0, v.duration - 0.05) || 0);
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setCurrentTime(v.currentTime);
    const onMeta = () => {
      if (v.duration && Number.isFinite(v.duration) && v.duration > 0) onDurationKnown(v.duration);
    };
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
    };
  }, [project.videoURL, onDurationKnown]);

  if (detections.length === 0) {
    return (
      <div className="rounded-lg border border-[#E5E7EB] bg-white p-10 text-center text-sm text-gray-600">
        No corrosion detected in this video.
        <div className="mx-auto mt-6 max-w-2xl">
          <video ref={videoRef} src={project.videoURL} controls className="w-full rounded-md" />
        </div>
      </div>
    );
  }

  const progressPct = project.duration ? (currentTime / project.duration) * 100 : 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
          <div className="relative w-full overflow-hidden rounded-md bg-[#1f2937]" style={{ aspectRatio: "16/9" }}>
            <video
              ref={videoRef}
              src={project.videoURL}
              className="h-full w-full object-contain"
              playsInline
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />
            {selected && (
              <div
                className="pointer-events-none absolute border-2 border-orange-500 bg-orange-500/20"
                style={{
                  left: `${selected.box.x}%`,
                  top: `${selected.box.y}%`,
                  width: `${selected.box.width}%`,
                  height: `${selected.box.height}%`,
                }}
              >
                <span className="absolute -top-6 left-0 rounded bg-orange-500 px-2 py-0.5 text-xs font-semibold text-white">
                  Corrosion — {selected.confidence.toFixed(0)}%
                </span>
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center gap-3 px-1">
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2E86AB] text-white hover:bg-[#246d8c]"
            >
              {playing ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="ml-0.5 h-4 w-4" fill="currentColor" />}
            </button>
            <span className="shrink-0 font-mono text-xs text-gray-600">
              {formatTimestamp(currentTime)} / {formatTimestamp(project.duration)}
            </span>
            <div className="relative h-2 flex-1 rounded-full bg-gray-200">
              <div className="absolute left-0 top-0 h-full rounded-full bg-[#2E86AB]" style={{ width: `${progressPct}%` }} />
              {detections.map((d) => (
                <div
                  key={d.id}
                  className="group absolute -top-1 h-4 w-3 -translate-x-1/2 cursor-pointer"
                  style={{ left: `${project.duration ? (d.timestamp / project.duration) * 100 : 0}%` }}
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
            <button type="button" className="shrink-0 text-gray-500 hover:text-[#2E86AB]" aria-label="Volume">
              <Volume2 className="h-4 w-4" />
            </button>
            <button type="button" className="shrink-0 text-gray-500 hover:text-[#2E86AB]" aria-label="Fullscreen">
              <Maximize className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <InspectionSummary>
          Analysis complete. {detections.length} instances of corrosion detected across {formatTimestamp(project.duration)} of footage.
        </InspectionSummary>
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-5">
          <h3 className="mb-3 text-base font-bold text-gray-900">Frame Detections</h3>
          <div className="mb-4 border-b border-[#F0F2F7] pb-3 text-xs text-gray-500">
            {detections.length} detections · {confirmed} confirmed · {dismissed} dismissed · {pending} pending
          </div>
          <div className="max-h-[600px] space-y-3 overflow-y-auto pr-1">
            {detections.map((d) => (
              <div
                key={d.id}
                onClick={() => {
                  setSelectedId(d.id);
                  seekTo(d.timestamp);
                }}
                className={`cursor-pointer rounded-md border p-3 transition ${
                  selectedId === d.id ? "border-[#2E86AB] bg-[#EEF2FF]" : "border-[#E5E7EB] hover:bg-gray-50"
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">{formatTimestamp(d.timestamp)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs capitalize text-gray-500">{d.status}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(editingId === d.id ? null : d.id);
                      }}
                      className="text-gray-400 hover:text-[#2E86AB]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {editingId === d.id ? (
                  <div className="mb-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      defaultValue={d.labelOverride ?? d.label}
                      onChange={(e) => updateLabel(d.id, e.target.value)}
                      className="h-7 flex-1 rounded border border-[#E5E7EB] px-2 text-sm focus:border-[#2E86AB] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="h-7 bg-[#2E9E8F] px-3 text-xs font-semibold uppercase text-white hover:bg-[#268579]"
                      style={{ borderRadius: 0 }}
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="mb-2 text-sm text-gray-700">{d.labelOverride ?? d.label}</div>
                )}
                <div className="mb-3 flex gap-4 text-xs">
                  <span className="font-semibold text-[#2E86AB]">{d.confidence.toFixed(1)}%</span>
                  <span className="font-semibold text-[#2E86AB]">Area {d.area_percent.toFixed(1)}%</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateStatus(d.id, "confirmed");
                    }}
                    className="flex-1 border border-[#2E9E8F] px-2 py-1 text-xs font-medium text-[#2E9E8F] transition hover:bg-[#2E9E8F] hover:text-white"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateStatus(d.id, "dismissed");
                    }}
                    className="flex-1 border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-100"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PredictionStatCard({ icon: Icon, label, value, clickable }: { icon: typeof Target; label: string; value?: string; clickable?: boolean }) {
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select className="h-9 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-gray-700">
            <option>Prediction Time</option>
          </select>
          <select className="h-9 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-gray-700">
            <option>Newest</option>
          </select>
          <div className="ml-2 flex items-center rounded-md border border-[#E5E7EB] bg-white">
            <button type="button" className="border-r border-[#E5E7EB] p-2 text-[#2E86AB]">
              <Columns2 className="h-4 w-4" />
            </button>
            <button type="button" className="border-r border-[#E5E7EB] p-2 text-gray-500 hover:text-[#2E86AB]">
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button type="button" className="p-2 text-gray-500 hover:text-[#2E86AB]">
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="h-9 w-56 rounded-md border border-[#E5E7EB] bg-white pl-8 pr-3 text-sm focus:border-[#2E86AB] focus:outline-none"
            />
          </div>
          <button
            type="button"
            className="border border-[#2E86AB] px-4 py-2 text-xs font-semibold tracking-wide text-[#2E86AB] uppercase transition-colors hover:bg-[#2E86AB] hover:text-white"
            style={{ borderRadius: 0 }}
          >
            Export
          </button>
        </div>
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
                <span className="font-semibold text-gray-900">Frame_{Math.round(d.timestamp)}</span>
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
            <VideoFrameSnapshot videoSrc={project.videoURL} timestamp={d.timestamp} box={d.box} variant="original" />
            <VideoFrameSnapshot videoSrc={project.videoURL} timestamp={d.timestamp} box={d.box} variant="annotated" />
          </div>
        ))}
      </div>
    </div>
  );
}
