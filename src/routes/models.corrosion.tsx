import { createFileRoute } from "@tanstack/react-router";
import { Target, Film, AlertTriangle, Play, Pause, Sparkles, Search, LayoutGrid, List, Columns2, BarChart3, Gauge, Crosshair, MoreHorizontal, Pencil, Volume2, Maximize, Upload } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/models/corrosion")({
  component: CorrosionDetailPage,
});

function CorrosionDetailPage() {
  const tabs = ["Details", "Timeline", "Predictions"];
  const [active, setActive] = useState("Details");
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Corrosion Detection — Video
      </h1>
      <div className="border-b border-[#E5E7EB] mb-6 flex items-center justify-between">
        <div className="flex gap-6">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActive(t)}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                active === t
                  ? "text-[#2E86AB] border-[#2E86AB]"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-5 py-2.5 bg-white border border-[#2E9E8F] text-[#2E9E8F] text-xs font-semibold uppercase tracking-wide hover:bg-[#EEF2FF] transition-colors inline-flex items-center gap-2"
            style={{ borderRadius: 0 }}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Video
          </button>
          <button
            className="px-5 py-2.5 bg-[#2E9E8F] text-white text-xs font-semibold uppercase tracking-wide hover:bg-[#268579] transition-colors"
            style={{ borderRadius: 0 }}
          >
            Run Inspection
          </button>
        </div>
      </div>
      {active === "Details" && <DetailsTab />}
      {active === "Timeline" && <TimelineTab />}
      {active === "Predictions" && <PredictionsTab />}
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

function DetailsTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={Target} label="Model Accuracy" value="92%" />
        <StatCard icon={Film} label="Frames Analysed" value="1,240 / 1,350" />
        <StatCard icon={AlertTriangle} label="Defects Marked" value="347" />
      </div>
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
        <h2 className="text-[18px] font-bold text-gray-900 mb-3">Corrosion Detection — Video</h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-6 max-w-3xl">
          This pre-trained model detects and labels corrosion across video footage.
          The AI scans each frame, flags defects, and prioritises by severity level.
        </p>
        <div className="divide-y divide-[#F0F2F7]">
          <MetaRow label="Model Id" value="10019" />
          <MetaRow label="Project Name" value="Project_corrosion_video" />
          <MetaRow label="Type" value="Object Detection" />
          <MetaRow label="Algorithm" value="MaskRCNN0" />
          <MetaRow label="Created" value="08 May 2025" />
        </div>
      </div>
    </div>
  );
}

type Detection = {
  id: number;
  time: string;
  position: number;
  confidence: number;
  area: number;
  status: "confirmed" | "dismissed" | "pending";
  label: string;
  box: { left: number; top: number; width: number; height: number };
};

const initialDetections: Detection[] = [
  { id: 1, time: "00:12", position: 8, confidence: 94, area: 12.4, status: "confirmed", label: "Corrosion Detected", box: { left: 18, top: 22, width: 28, height: 30 } },
  { id: 2, time: "00:42", position: 24, confidence: 88, area: 8.1, status: "confirmed", label: "Corrosion Detected", box: { left: 50, top: 35, width: 22, height: 24 } },
  { id: 3, time: "01:15", position: 42, confidence: 91, area: 15.7, status: "dismissed", label: "Corrosion Detected", box: { left: 30, top: 40, width: 35, height: 28 } },
  { id: 4, time: "01:58", position: 65, confidence: 76, area: 5.3, status: "pending", label: "Corrosion Detected", box: { left: 60, top: 18, width: 18, height: 22 } },
  { id: 5, time: "02:34", position: 86, confidence: 82, area: 9.6, status: "pending", label: "Corrosion Detected", box: { left: 22, top: 50, width: 26, height: 26 } },
];

function TimelineTab() {
  const [detections, setDetections] = useState(initialDetections);
  const [selected, setSelected] = useState<Detection | null>(null);
  const [playing, setPlaying] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const confirmed = detections.filter((d) => d.status === "confirmed").length;
  const dismissed = detections.filter((d) => d.status === "dismissed").length;
  const pending = detections.filter((d) => d.status === "pending").length;

  const updateStatus = (id: number, status: Detection["status"]) => {
    setDetections((arr) => arr.map((d) => (d.id === id ? { ...d, status } : d)));
  };

  const updateLabel = (id: number, label: string) => {
    setDetections((arr) => arr.map((d) => (d.id === id ? { ...d, label } : d)));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
          <div className="relative w-full bg-[#1f2937] rounded-md overflow-hidden" style={{ aspectRatio: "16/9" }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <button className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition">
                <Play className="w-7 h-7 text-[#1f2937] ml-1" fill="currentColor" />
              </button>
            </div>
            {selected && (
              <div
                className="absolute border-2 border-orange-500 bg-orange-500/30"
                style={{
                  left: `${selected.box.left}%`,
                  top: `${selected.box.top}%`,
                  width: `${selected.box.width}%`,
                  height: `${selected.box.height}%`,
                }}
              >
                <span className="absolute -top-6 left-0 bg-orange-500 text-white text-xs font-semibold px-2 py-0.5 rounded">
                  {selected.label} — {selected.confidence}%
                </span>
              </div>
            )}
          </div>
          <div className="mt-4 px-1 flex items-center gap-3">
            <button
              onClick={() => setPlaying((p) => !p)}
              className="w-8 h-8 rounded-full bg-[#2E86AB] text-white flex items-center justify-center hover:bg-[#246d8c] shrink-0"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <Pause className="w-4 h-4" fill="currentColor" /> : <Play className="w-4 h-4 ml-0.5" fill="currentColor" />}
            </button>
            <span className="text-xs text-gray-600 font-mono shrink-0">00:00 / 03:00</span>
            <div className="relative h-2 bg-gray-200 rounded-full flex-1">
              <div className="absolute left-0 top-0 h-full w-1/4 bg-[#2E86AB] rounded-full" />
              {detections.map((d) => (
                <div
                  key={d.id}
                  className="group absolute -top-1 w-3 h-4 -translate-x-1/2 cursor-pointer"
                  style={{ left: `${d.position}%` }}
                  onClick={() => setSelected(d)}
                >
                  <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow" />
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                    Corrosion detected — {d.confidence}% confidence
                  </div>
                </div>
              ))}
            </div>
            <button className="text-gray-500 hover:text-[#2E86AB] shrink-0" aria-label="Volume">
              <Volume2 className="w-4 h-4" />
            </button>
            <button className="text-gray-500 hover:text-[#2E86AB] shrink-0" aria-label="Fullscreen">
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
          <h3 className="text-base font-bold text-gray-900 mb-3">Frame Detections</h3>
          <div className="text-xs text-gray-500 mb-4 pb-3 border-b border-[#F0F2F7]">
            {detections.length} detections · {confirmed} confirmed · {dismissed} dismissed · {pending} pending
          </div>
          <div className="space-y-3">
            {detections.map((d) => (
              <div
                key={d.id}
                onClick={() => setSelected(d)}
                className={`border rounded-md p-3 cursor-pointer transition ${
                  selected?.id === d.id ? "border-[#2E86AB] bg-[#EEF2FF]" : "border-[#E5E7EB] hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-900">{d.time}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 capitalize">{d.status}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingId(editingId === d.id ? null : d.id); }}
                      className="text-gray-400 hover:text-[#2E86AB]"
                      aria-label="Edit label"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {editingId === d.id ? (
                  <div className="mb-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      defaultValue={d.label}
                      onChange={(e) => updateLabel(d.id, e.target.value)}
                      className="flex-1 h-7 px-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#2E86AB]"
                    />
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 h-7 bg-[#2E9E8F] text-white text-xs font-semibold uppercase hover:bg-[#268579]"
                      style={{ borderRadius: 0 }}
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-gray-700 mb-2">{d.label}</div>
                )}
                <div className="flex gap-4 text-xs mb-3">
                  <span className="text-[#2E86AB] font-semibold">{d.confidence}%</span>
                  <span className="text-[#2E86AB] font-semibold">Area {d.area}%</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); updateStatus(d.id, "confirmed"); }}
                    className="flex-1 px-2 py-1 text-xs font-medium border border-[#2E9E8F] text-[#2E9E8F] hover:bg-[#2E9E8F] hover:text-white transition"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); updateStatus(d.id, "dismissed"); }}
                    className="flex-1 px-2 py-1 text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative bg-[#EEF2FF] border-l-[3px] border-[#2E86AB] rounded-r-md p-4">
          <Sparkles className="absolute top-3 right-3 w-4 h-4 text-[#2E86AB]" />
          <h4 className="text-sm font-bold text-gray-900 mb-2">AI Inspection Summary</h4>
          <p className="text-xs text-gray-700 leading-relaxed pr-6">
            Analysis complete. 5 instances of corrosion detected across 4:12 of footage.
            Highest severity at 00:42 and 01:58. Estimated affected area: 12.4% of inspected surface.
            Recommend immediate review of mid-section joints.
          </p>
        </div>
      </div>
    </div>
  );
}

function PredictionStatCard({ icon: Icon, label, value, clickable }: { icon: typeof Target; label: string; value?: string; clickable?: boolean }) {
  return (
    <div className={`bg-white border border-[#E5E7EB] rounded-lg p-5 ${clickable ? "cursor-pointer hover:border-[#2E86AB] transition" : ""}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-md bg-[#EEF2FF] flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#2E86AB]" />
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      {value ? (
        <div className="text-3xl font-bold text-gray-900">{value}</div>
      ) : (
        <div className="text-sm text-[#2E86AB] font-semibold">View all →</div>
      )}
    </div>
  );
}

function PredictionsTab() {
  const rows = [
    { name: "Video_12", date: "08-May-2025", area: "12.4%" },
    { name: "Video_13", date: "08-May-2025", area: "8.7%" },
    { name: "Video_14", date: "08-May-2025", area: "15.2%" },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <PredictionStatCard icon={Gauge} label="Average Prediction Score" value="0.43" />
        <PredictionStatCard icon={Crosshair} label="Mean Average Precision" value="0.8" />
        <PredictionStatCard icon={BarChart3} label="Average Annotated Area" value="19%" />
        <PredictionStatCard icon={MoreHorizontal} label="More Stats" clickable />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <select className="h-9 px-3 text-sm border border-[#E5E7EB] bg-white rounded-md text-gray-700">
            <option>Prediction Time</option>
          </select>
          <select className="h-9 px-3 text-sm border border-[#E5E7EB] bg-white rounded-md text-gray-700">
            <option>Newest</option>
          </select>
          <div className="flex items-center border border-[#E5E7EB] rounded-md bg-white ml-2">
            <button className="p-2 text-[#2E86AB] border-r border-[#E5E7EB]"><Columns2 className="w-4 h-4" /></button>
            <button className="p-2 text-gray-500 border-r border-[#E5E7EB] hover:text-[#2E86AB]"><LayoutGrid className="w-4 h-4" /></button>
            <button className="p-2 text-gray-500 hover:text-[#2E86AB]"><List className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="h-9 pl-8 pr-3 text-sm border border-[#E5E7EB] bg-white rounded-md w-56 focus:outline-none focus:border-[#2E86AB]"
            />
          </div>
          <button
            className="px-4 py-2 border border-[#2E86AB] text-[#2E86AB] text-xs font-semibold uppercase tracking-wide hover:bg-[#2E86AB] hover:text-white transition-colors"
            style={{ borderRadius: 0 }}
          >
            Export
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.name} className="bg-white border border-[#E5E7EB] rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="space-y-1.5 text-sm">
              <div><span className="text-gray-500">Name: </span><span className="font-semibold text-gray-900">{r.name}</span></div>
              <div><span className="text-gray-500">Created On: </span><span className="font-semibold text-gray-900">{r.date}</span></div>
              <div><span className="text-gray-500">Area %: </span><span className="font-semibold text-[#2E86AB]">{r.area}</span></div>
            </div>
            <div className="relative bg-[#1f2937] rounded-md overflow-hidden" style={{ aspectRatio: "16/9" }}>
              <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded">Original</span>
            </div>
            <div className="relative bg-[#1f2937] rounded-md overflow-hidden" style={{ aspectRatio: "16/9" }}>
              <div className="absolute" style={{ left: "25%", top: "30%", width: "40%", height: "35%", background: "rgba(34,197,94,0.45)", border: "2px solid #22c55e" }} />
              <div className="absolute" style={{ left: "55%", top: "55%", width: "20%", height: "20%", background: "rgba(34,197,94,0.45)", border: "2px solid #22c55e" }} />
              <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded">Annotated</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}