import { createFileRoute, Link } from "@tanstack/react-router";
import { Target, Film, AlertTriangle, Play, Pause, Search, LayoutGrid, List, Columns2, BarChart3, Gauge, Crosshair, MoreHorizontal, Pencil, Volume2, Maximize } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useProjects, formatTimestamp, type Detection, type Project } from "@/lib/projects-store";
import { OriginalFramePanel, AnnotatedFramePanel, InspectionSummary } from "@/components/frame-panels";

export const Route = createFileRoute("/models/corrosion_/$projectId")({
  component: ProjectPage,
});

function ProjectPage() {
  const { projectId } = Route.useParams();
  const projects = useProjects();
  const project = projects.find((p) => p.id === projectId);
  const tabs = ["Details", "Timeline", "Predictions"];
  const [active, setActive] = useState("Details");

  if (!project) {
    return (
      <AppShell>
        <Link to="/models/corrosion" className="text-sm text-[#2E86AB] hover:underline">← Models</Link>
        <div className="mt-6 text-sm text-gray-600">Project not found. It may have been removed.</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex items-start justify-between mb-2 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
          <div className="text-sm text-gray-500 mt-1">Corrosion Detection — Video · {project.createdAt}</div>
        </div>
      </div>
      <div className="border-b border-[#E5E7EB] mb-6 mt-4">
        <div className="flex gap-6">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActive(t)}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                active === t ? "text-[#2E86AB] border-[#2E86AB]" : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      {active === "Details" && <DetailsTab project={project} />}
      {active === "Timeline" && <TimelineTab project={project} />}
      {active === "Predictions" && <PredictionsTab project={project} />}
    </AppShell>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-md bg-[#EEF2FF] flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#2E86AB]" />
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex text-sm py-2">
      <span className="text-gray-500 w-40">{label}</span>
      <span className="text-gray-400 mr-4">:</span>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={Film} label="Video Duration" value={formatTimestamp(project.duration)} />
        <StatCard icon={Target} label="Frames Analysed" value={`${frames} / ${frames}`} />
        <StatCard icon={AlertTriangle} label="Defects Detected" value={String(project.detections.length)} />
      </div>
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
        <h2 className="text-[18px] font-bold text-gray-900 mb-4">Project Information</h2>
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

function TimelineTab({ project }: { project: Project }) {
  const [detections, setDetections] = useState<(Detection & { id: number; status: "confirmed" | "dismissed" | "pending"; labelOverride?: string })[]>(
    project.detections.map((d, i) => ({ ...d, id: i, status: "pending" }))
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

  const updateStatus = (id: number, status: "confirmed" | "dismissed" | "pending") =>
    setDetections((arr) => arr.map((d) => (d.id === id ? { ...d, status } : d)));
  const updateLabel = (id: number, label: string) =>
    setDetections((arr) => arr.map((d) => (d.id === id ? { ...d, labelOverride: label } : d)));

  const seekTo = (t: number) => {
    if (videoRef.current) videoRef.current.currentTime = t;
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setCurrentTime(v.currentTime);
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, []);

  if (detections.length === 0) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-10 text-center text-sm text-gray-600">
        No corrosion detected in this video.
        <div className="mt-6 max-w-2xl mx-auto">
          <video ref={videoRef} src={project.videoURL} controls className="w-full rounded-md" />
        </div>
      </div>
    );
  }

  const progressPct = project.duration ? (currentTime / project.duration) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
          <div className="relative w-full bg-[#1f2937] rounded-md overflow-hidden" style={{ aspectRatio: "16/9" }}>
            <video ref={videoRef} src={project.videoURL} className="w-full h-full object-contain" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
            {selected && (
              <div
                className="absolute pointer-events-none border-2 border-orange-500 bg-orange-500/20"
                style={{
                  left: `${selected.box.x}%`,
                  top: `${selected.box.y}%`,
                  width: `${selected.box.width}%`,
                  height: `${selected.box.height}%`,
                }}
              >
                <span className="absolute -top-6 left-0 bg-orange-500 text-white text-xs font-semibold px-2 py-0.5 rounded">
                  Corrosion — {selected.confidence.toFixed(0)}%
                </span>
              </div>
            )}
          </div>
          <div className="mt-4 px-1 flex items-center gap-3">
            <button onClick={togglePlay} className="w-8 h-8 rounded-full bg-[#2E86AB] text-white flex items-center justify-center hover:bg-[#246d8c] shrink-0">
              {playing ? <Pause className="w-4 h-4" fill="currentColor" /> : <Play className="w-4 h-4 ml-0.5" fill="currentColor" />}
            </button>
            <span className="text-xs text-gray-600 font-mono shrink-0">{formatTimestamp(currentTime)} / {formatTimestamp(project.duration)}</span>
            <div className="relative h-2 bg-gray-200 rounded-full flex-1">
              <div className="absolute left-0 top-0 h-full bg-[#2E86AB] rounded-full" style={{ width: `${progressPct}%` }} />
              {detections.map((d) => (
                <div
                  key={d.id}
                  className="group absolute -top-1 w-3 h-4 -translate-x-1/2 cursor-pointer"
                  style={{ left: `${(d.timestamp / project.duration) * 100}%` }}
                  onClick={() => { setSelectedId(d.id); seekTo(d.timestamp); }}
                >
                  <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow" />
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                    Corrosion detected — {d.confidence.toFixed(0)}% confidence
                  </div>
                </div>
              ))}
            </div>
            <button className="text-gray-500 hover:text-[#2E86AB] shrink-0"><Volume2 className="w-4 h-4" /></button>
            <button className="text-gray-500 hover:text-[#2E86AB] shrink-0"><Maximize className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <InspectionSummary>
          Analysis complete. {detections.length} instances of corrosion detected across {formatTimestamp(project.duration)} of footage.
        </InspectionSummary>
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
          <h3 className="text-base font-bold text-gray-900 mb-3">Frame Detections</h3>
          <div className="text-xs text-gray-500 mb-4 pb-3 border-b border-[#F0F2F7]">
            {detections.length} detections · {confirmed} confirmed · {dismissed} dismissed · {pending} pending
          </div>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {detections.map((d) => (
              <div
                key={d.id}
                onClick={() => { setSelectedId(d.id); seekTo(d.timestamp); }}
                className={`border rounded-md p-3 cursor-pointer transition ${
                  selectedId === d.id ? "border-[#2E86AB] bg-[#EEF2FF]" : "border-[#E5E7EB] hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-900">{formatTimestamp(d.timestamp)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 capitalize">{d.status}</span>
                    <button onClick={(e) => { e.stopPropagation(); setEditingId(editingId === d.id ? null : d.id); }} className="text-gray-400 hover:text-[#2E86AB]">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {editingId === d.id ? (
                  <div className="mb-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      defaultValue={d.labelOverride ?? d.label}
                      onChange={(e) => updateLabel(d.id, e.target.value)}
                      className="flex-1 h-7 px-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#2E86AB]"
                    />
                    <button onClick={() => setEditingId(null)} className="px-3 h-7 bg-[#2E9E8F] text-white text-xs font-semibold uppercase hover:bg-[#268579]" style={{ borderRadius: 0 }}>Save</button>
                  </div>
                ) : (
                  <div className="text-sm text-gray-700 mb-2">{d.labelOverride ?? d.label}</div>
                )}
                <div className="flex gap-4 text-xs mb-3">
                  <span className="text-[#2E86AB] font-semibold">{d.confidence.toFixed(1)}%</span>
                  <span className="text-[#2E86AB] font-semibold">Area {d.area_percent.toFixed(1)}%</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); updateStatus(d.id, "confirmed"); }} className="flex-1 px-2 py-1 text-xs font-medium border border-[#2E9E8F] text-[#2E9E8F] hover:bg-[#2E9E8F] hover:text-white transition">Confirm</button>
                  <button onClick={(e) => { e.stopPropagation(); updateStatus(d.id, "dismissed"); }} className="flex-1 px-2 py-1 text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-100 transition">Dismiss</button>
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
    <div className={`bg-white border border-[#E5E7EB] rounded-lg p-5 ${clickable ? "cursor-pointer hover:border-[#2E86AB] transition" : ""}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-md bg-[#EEF2FF] flex items-center justify-center"><Icon className="w-4 h-4 text-[#2E86AB]" /></div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      {value ? <div className="text-3xl font-bold text-gray-900">{value}</div> : <div className="text-sm text-[#2E86AB] font-semibold">View all →</div>}
    </div>
  );
}

function PredictionsTab({ project }: { project: Project }) {
  const detections = project.detections;
  const avgScore = detections.length ? (detections.reduce((s, d) => s + d.confidence / 100, 0) / detections.length).toFixed(2) : "0.00";
  const avgArea = detections.length ? (detections.reduce((s, d) => s + d.area_percent, 0) / detections.length).toFixed(1) + "%" : "0%";
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <PredictionStatCard icon={Gauge} label="Average Prediction Score" value={avgScore} />
        <PredictionStatCard icon={Crosshair} label="Mean Average Precision" value="0.8" />
        <PredictionStatCard icon={BarChart3} label="Average Annotated Area" value={avgArea} />
        <PredictionStatCard icon={MoreHorizontal} label="More Stats" clickable />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <select className="h-9 px-3 text-sm border border-[#E5E7EB] bg-white rounded-md text-gray-700"><option>Prediction Time</option></select>
          <select className="h-9 px-3 text-sm border border-[#E5E7EB] bg-white rounded-md text-gray-700"><option>Newest</option></select>
          <div className="flex items-center border border-[#E5E7EB] rounded-md bg-white ml-2">
            <button className="p-2 text-[#2E86AB] border-r border-[#E5E7EB]"><Columns2 className="w-4 h-4" /></button>
            <button className="p-2 text-gray-500 border-r border-[#E5E7EB] hover:text-[#2E86AB]"><LayoutGrid className="w-4 h-4" /></button>
            <button className="p-2 text-gray-500 hover:text-[#2E86AB]"><List className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search" className="h-9 pl-8 pr-3 text-sm border border-[#E5E7EB] bg-white rounded-md w-56 focus:outline-none focus:border-[#2E86AB]" />
          </div>
          <button className="px-4 py-2 border border-[#2E86AB] text-[#2E86AB] text-xs font-semibold uppercase tracking-wide hover:bg-[#2E86AB] hover:text-white transition-colors" style={{ borderRadius: 0 }}>Export</button>
        </div>
      </div>

      <div className="space-y-3">
        {detections.map((d, i) => (
          <div key={i} className="bg-white border border-[#E5E7EB] rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="space-y-1.5 text-sm">
              <div><span className="text-gray-500">Name: </span><span className="font-semibold text-gray-900">Frame_{Math.round(d.timestamp)}</span></div>
              <div><span className="text-gray-500">Created On: </span><span className="font-semibold text-gray-900">{project.createdAt}</span></div>
              <div><span className="text-gray-500">Area %: </span><span className="font-semibold text-[#2E86AB]">{d.area_percent.toFixed(1)}%</span></div>
            </div>
            <OriginalFramePanel timestamp={formatTimestamp(d.timestamp)} />
            <AnnotatedFramePanel box={d.box} />
          </div>
        ))}
      </div>
    </div>
  );
}
