import { createFileRoute, Link } from "@tanstack/react-router";
import { Target, Film, AlertTriangle, Search, FolderVideo, ChevronRight, X, UploadCloud, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/models/corrosion")({
  component: CorrosionModelPage,
});

function CorrosionModelPage() {
  const [showNew, setShowNew] = useState(false);
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Corrosion Detection — Video</h1>
      <div className="text-xs text-gray-500 uppercase tracking-wide mb-6">Lifetime model performance</div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard icon={Target} label="Model Accuracy" value="92%" />
        <StatCard icon={Film} label="Frames Analysed" value="1,240 / 1,350" />
        <StatCard icon={AlertTriangle} label="Defects Marked" value="347" />
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 mb-8">
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

      <h2 className="text-[18px] font-bold text-gray-900 mb-4">Projects</h2>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects"
            className="h-9 w-full pl-8 pr-3 text-sm border border-[#E5E7EB] bg-white rounded-md focus:outline-none focus:border-[#2E86AB]"
          />
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="px-4 py-2 bg-[#2E9E8F] text-white text-xs font-semibold uppercase tracking-wide hover:bg-[#268579] transition-colors"
          style={{ borderRadius: 0 }}
        >
          + New Project
        </button>
      </div>

      <div className="space-y-3">
        <Link
          to="/models/corrosion/pipeline-inspection-01"
          className="flex items-center gap-4 bg-white border border-[#E5E7EB] rounded-lg p-4 hover:border-[#2E86AB] hover:shadow-sm transition"
        >
          <div className="w-10 h-10 rounded-md bg-[#EEF2FF] flex items-center justify-center shrink-0">
            <FolderVideo className="w-5 h-5 text-[#2E86AB]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-gray-900">Pipeline_Inspection_01</div>
            <div className="text-xs text-gray-500 mt-0.5">Last inspected: 08 May 2025</div>
          </div>
          <span className="px-2.5 py-1 text-xs font-semibold bg-orange-100 text-orange-700 rounded">5 detections</span>
          <span className="px-2.5 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded">Completed</span>
          <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
        </Link>
      </div>

      {showNew && <NewProjectModal onClose={() => setShowNew(false)} />}
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

function NewProjectModal({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [uploaded, setUploaded] = useState(false);

  const handlePick = () => {
    setFile({ name: "pipeline_walk_02.mp4", size: 124_500_000 });
    setUploaded(false);
    setTimeout(() => setUploaded(true), 1200);
  };

  const sizeMb = file ? (file.size / 1_000_000).toFixed(1) + " MB" : "";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-xl shadow-xl" style={{ fontFamily: "Inter, sans-serif" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
          <h3 className="text-lg font-bold text-gray-900">New Inspection Project</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="border-2 border-dashed border-[#2E9E8F]/40 rounded-lg p-8 text-center bg-[#F0FBF9]">
            <div className="w-12 h-12 mx-auto rounded-full bg-white flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6 text-[#2E9E8F]" />
            </div>
            <div className="text-sm font-semibold text-gray-900 mb-1">Upload your video file</div>
            <div className="text-xs text-gray-500 mb-4">Supports MP4, MOV, AVI up to 2GB</div>
            <button
              onClick={handlePick}
              className="px-4 py-2 bg-[#2E9E8F] text-white text-xs font-semibold uppercase tracking-wide hover:bg-[#268579]"
              style={{ borderRadius: 0 }}
            >
              Browse Files
            </button>

            {file && (
              <div className="mt-5 text-left bg-white border border-[#E5E7EB] rounded-md p-3">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-gray-900 truncate">{file.name}</span>
                  <span className="text-gray-500 ml-2 shrink-0">{sizeMb}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2E9E8F] transition-all duration-1000"
                    style={{ width: uploaded ? "100%" : "30%" }}
                  />
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-600">
                  {uploaded ? (
                    <><CheckCircle2 className="w-3.5 h-3.5 text-[#2E9E8F]" /> Uploaded · 100%</>
                  ) : (
                    <>Uploading... 30%</>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
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
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#E5E7EB]">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold uppercase tracking-wide hover:bg-gray-50"
            style={{ borderRadius: 0 }}
          >
            Cancel
          </button>
          <button
            disabled={!uploaded}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
              uploaded
                ? "bg-[#2E9E8F] text-white hover:bg-[#268579]"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
            style={{ borderRadius: 0 }}
          >
            Start Inspection
          </button>
        </div>
      </div>
    </div>
  );
}
