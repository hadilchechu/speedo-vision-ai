import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Target, Film, AlertTriangle, Search, Folder, ChevronRight, X, UploadCloud, CheckCircle2 } from "lucide-react";
import { useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useProjects, projectsStore, formatCreatedAt, type Detection } from "@/lib/projects-store";
import { extractFrames, detectFrame, normalizeDetections } from "@/lib/corrosion-detect";

export const Route = createFileRoute("/models/corrosion")({
  component: CorrosionModelPage,
});

function CorrosionModelPage() {
  const [openNew, setOpenNew] = useState(false);
  const projects = useProjects();
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Corrosion Detection — Video</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Projects */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-bold text-gray-900">Projects</h2>
            <button
              onClick={() => setOpenNew(true)}
              className="px-4 py-2 bg-[#2E9E8F] text-white text-xs font-semibold uppercase tracking-wide hover:bg-[#268579] transition-colors"
              style={{ borderRadius: 0 }}
            >
              + New Project
            </button>
          </div>

          <div className="relative mb-4 w-1/3 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects"
              className="h-9 w-full pl-8 pr-3 text-sm border border-[#E5E7EB] bg-white rounded-md focus:outline-none focus:border-[#2E86AB]"
            />
          </div>

          <div className="space-y-3">
            {projects.map((p) => (
              <Link
                key={p.id}
                to="/models/corrosion/$projectId"
                params={{ projectId: p.id }}
                className="flex items-center gap-4 bg-white border border-[#E5E7EB] rounded-lg p-4 hover:border-[#2E86AB] hover:shadow-sm transition"
              >
                <div className="w-10 h-10 rounded-md bg-[#EEF2FF] flex items-center justify-center shrink-0">
                  <Folder className="w-5 h-5 text-[#2E86AB]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-900 truncate">{p.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Last inspected: {p.createdAt}</div>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold bg-orange-100 text-orange-700 rounded">{p.detections.length} detections</span>
                <span className="px-2.5 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded">{p.status}</span>
                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
              </Link>
            ))}
            <Link
              to="/models/corrosion/pipeline-inspection-01"
              className="flex items-center gap-4 bg-white border border-[#E5E7EB] rounded-lg p-4 hover:border-[#2E86AB] hover:shadow-sm transition"
            >
              <div className="w-10 h-10 rounded-md bg-[#EEF2FF] flex items-center justify-center shrink-0">
                <Folder className="w-5 h-5 text-[#2E86AB]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-gray-900">Pipeline_Inspection_01</div>
                <div className="text-xs text-gray-500 mt-0.5">Last inspected: 08 May 2025</div>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold bg-orange-100 text-orange-700 rounded">5 detections</span>
              <span className="px-2.5 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded">Completed</span>
              <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
            </Link>
            {[
              { name: "Pipeline_Inspection_02", date: "06 May 2025", detections: 3, status: "Processing", statusClass: "bg-blue-100 text-blue-700" },
              { name: "Tank_Inspection_03", date: "02 May 2025", detections: 8, status: "Completed", statusClass: "bg-green-100 text-green-700" },
            ].map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-4 bg-white border border-[#E5E7EB] rounded-lg p-4 opacity-60 cursor-not-allowed"
              >
                <div className="w-10 h-10 rounded-md bg-[#EEF2FF] flex items-center justify-center shrink-0">
                  <Folder className="w-5 h-5 text-[#2E86AB]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-900">{p.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Last inspected: {p.date}</div>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold bg-orange-100 text-orange-700 rounded">{p.detections} detections</span>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded ${p.statusClass}`}>{p.status}</span>
                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Model details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="space-y-3">
            <StatCard icon={Target} label="Model Accuracy" value="92%" />
            <StatCard icon={Film} label="Frames Analysed" value="1,240 / 1,350" />
            <StatCard icon={AlertTriangle} label="Defects Marked" value="347" />
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
            <h2 className="text-base font-bold text-gray-900 mb-3">Model Information</h2>
            <p className="text-xs text-gray-600 leading-relaxed mb-4">
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
      </div>
      {openNew && <NewProjectModal onClose={() => setOpenNew(false)} />}
    </AppShell>
  );
}

function NewProjectModal({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [progress, setProgress] = useState(0);

  const handlePick = () => {
    setFile({ name: "pipeline_walk_02.mp4", size: 124_500_000 });
    setProgress(30);
    setTimeout(() => setProgress(100), 1200);
  };

  const sizeMb = file ? (file.size / 1_000_000).toFixed(1) + " MB" : "";
  const ready = !!file && progress === 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-5">New Inspection Project</h2>

          <div className="border-2 border-dashed border-[#2E9E8F]/50 rounded-lg p-8 text-center bg-[#F0FBF9]">
            <div className="w-14 h-14 mx-auto rounded-full bg-white flex items-center justify-center mb-3">
              <UploadCloud className="w-7 h-7 text-[#2E9E8F]" />
            </div>
            <div className="text-base font-semibold text-gray-900 mb-1">Upload your video file</div>
            <div className="text-xs text-gray-500 mb-4">Supports MP4, MOV, AVI up to 2GB</div>
            <button
              onClick={handlePick}
              className="px-5 py-2 bg-[#2E9E8F] text-white text-xs font-semibold uppercase tracking-wide hover:bg-[#268579]"
              style={{ borderRadius: 0 }}
            >
              Browse Files
            </button>

            {file && (
              <div className="mt-5 text-left bg-white border border-[#E5E7EB] rounded-md p-3 max-w-md mx-auto">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-gray-900 truncate">{file.name}</span>
                  <span className="text-gray-500 ml-2 shrink-0">{sizeMb}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2E9E8F] transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-600">
                  {progress === 100 ? (
                    <><CheckCircle2 className="w-3.5 h-3.5 text-[#2E9E8F]" /> Uploaded · 100%</>
                  ) : (
                    <>Uploading... {progress}%</>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 mt-6">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Project Name</label>
              <input
                type="text"
                placeholder="e.g. Pipeline_Inspection_02"
                className="w-full h-10 px-3 text-sm border border-[#E5E7EB] rounded-md focus:outline-none focus:border-[#2E86AB]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
              <input
                type="text"
                placeholder="Optional notes about this inspection"
                className="w-full h-10 px-3 text-sm border border-[#E5E7EB] rounded-md focus:outline-none focus:border-[#2E86AB]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold uppercase tracking-wide hover:bg-gray-50"
              style={{ borderRadius: 0 }}
            >
              Cancel
            </button>
            <Link
              to="/models/corrosion/pipeline-inspection-01"
              aria-disabled={!ready}
              onClick={(e) => { if (!ready) e.preventDefault(); }}
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
                ready
                  ? "bg-[#2E9E8F] text-white hover:bg-[#268579]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed pointer-events-none"
              }`}
              style={{ borderRadius: 0 }}
            >
              Start Inspection
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-md bg-[#EEF2FF] flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-[#2E86AB]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-lg font-bold text-gray-900">{value}</div>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex text-xs py-2">
      <span className="text-gray-500 w-32 shrink-0">{label}</span>
      <span className="text-gray-400 mr-3">:</span>
      <span className="font-semibold text-gray-900 truncate">{value}</span>
    </div>
  );
}
