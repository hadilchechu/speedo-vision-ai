import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { Boxes, Users, Settings as SettingsIcon, ChevronDown, Target, Film, AlertTriangle, Play, Sparkles, Search, LayoutGrid, List, Columns2, BarChart3, Gauge, Crosshair, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import logoUrl from "@/assets/logo.png";

export const Route = createFileRoute("/")({
  component: ModelsPage,
});

const navItems = [
  { label: "Models", icon: Boxes, to: "/" },
  { label: "Team", icon: Users, to: "/team" },
  { label: "Settings", icon: SettingsIcon, to: "/settings" },
];

function Sidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside
      className="fixed inset-y-0 left-0 w-[220px] bg-white border-r border-[#E5E7EB] flex flex-col"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div className="h-16 flex items-center px-5 border-b border-[#E5E7EB]">
        <img src={logoUrl} alt="Speedo.ai" className="h-8 w-auto" />
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const active = path === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors rounded-md ${
                active
                  ? "bg-[#EEF2FF] text-[#2E86AB]"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function TopBar() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center justify-end h-16 px-8 bg-white border-b border-[#E5E7EB]">
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-3 text-sm"
        >
          <div className="w-9 h-9 rounded-full bg-[#2E86AB] text-white flex items-center justify-center font-semibold">
            JS
          </div>
          <div className="text-left leading-tight">
            <div className="font-medium text-gray-900">John Stephan</div>
            <div className="text-xs text-gray-500">Sales</div>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E5E7EB] rounded-md shadow-lg py-1 z-10">
            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Profile</a>
            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Account settings</a>
            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Sign out</a>
          </div>
        )}
      </div>
    </div>
  );
}

function ModelsPage() {
  const tabs = ["Details", "Timeline", "Predictions"];
  const [active, setActive] = useState("Details");
  return (
    <div className="min-h-screen bg-[#F0F2F7]" style={{ fontFamily: "Inter, sans-serif" }}>
      <Sidebar />
      <div className="ml-[220px]">
        <TopBar />
        <main className="p-8">
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
            <button
              className="px-5 py-2.5 bg-[#2E9E8F] text-white text-xs font-semibold uppercase tracking-wide hover:bg-[#268579] transition-colors"
              style={{ borderRadius: 0 }}
            >
              Run Inspection
            </button>
          </div>
          {active === "Details" && <DetailsTab />}
          {active === "Timeline" && <TimelineTab />}
          {active === "Predictions" && (
            <div className="bg-white border border-[#E5E7EB] rounded-md min-h-[400px]" />
          )}
        </main>
      </div>
    </div>
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
        <h2 className="text-[18px] font-bold text-gray-900 mb-3">
          Corrosion Detection — Video
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-6 max-w-3xl">
          This pre-trained model detects and labels corrosion across video footage.
          The AI scans each frame, flags defects, and prioritises by severity level.
        </p>
        <div className="divide-y divide-[#F0F2F7]">
          <MetaRow label="Model Id" value="10019" />
          <MetaRow label="Project Name" value="Project_corrosion_video" />
          <MetaRow label="Type" value="Segmentation" />
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
  position: number; // % along scrubber
  confidence: number;
  area: number;
  status: "confirmed" | "dismissed" | "pending";
  // bounding box on video, % units
  box: { left: number; top: number; width: number; height: number };
};

const initialDetections: Detection[] = [
  { id: 1, time: "00:12", position: 8, confidence: 94, area: 12.4, status: "confirmed", box: { left: 18, top: 22, width: 28, height: 30 } },
  { id: 2, time: "00:42", position: 24, confidence: 88, area: 8.1, status: "confirmed", box: { left: 50, top: 35, width: 22, height: 24 } },
  { id: 3, time: "01:15", position: 42, confidence: 91, area: 15.7, status: "dismissed", box: { left: 30, top: 40, width: 35, height: 28 } },
  { id: 4, time: "01:58", position: 65, confidence: 76, area: 5.3, status: "pending", box: { left: 60, top: 18, width: 18, height: 22 } },
  { id: 5, time: "02:34", position: 86, confidence: 82, area: 9.6, status: "pending", box: { left: 22, top: 50, width: 26, height: 26 } },
];

function TimelineTab() {
  const [detections, setDetections] = useState(initialDetections);
  const [selected, setSelected] = useState<Detection | null>(null);

  const confirmed = detections.filter((d) => d.status === "confirmed").length;
  const dismissed = detections.filter((d) => d.status === "dismissed").length;
  const pending = detections.filter((d) => d.status === "pending").length;

  const updateStatus = (id: number, status: Detection["status"]) => {
    setDetections((arr) => arr.map((d) => (d.id === id ? { ...d, status } : d)));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        {/* Video player */}
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
                  Corrosion — {selected.confidence}%
                </span>
              </div>
            )}
          </div>

          {/* Scrubber */}
          <div className="mt-4 px-1">
            <div className="relative h-2 bg-gray-200 rounded-full">
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
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>00:00</span>
              <span>03:00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Side panel */}
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
                <span className="text-xs text-gray-500 capitalize">{d.status}</span>
              </div>
              <div className="text-sm text-gray-700 mb-2">Corrosion Detected</div>
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
    </div>
  );
}
