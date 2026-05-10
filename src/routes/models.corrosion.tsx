import { createFileRoute, Link } from "@tanstack/react-router";
import { Target, Film, AlertTriangle, Search, Folder, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/models/corrosion")({
  component: CorrosionModelPage,
});

function CorrosionModelPage() {
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Corrosion Detection — Video</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Projects */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-bold text-gray-900">Projects</h2>
            <Link
              to="/models/corrosion/new"
              className="px-4 py-2 bg-[#2E9E8F] text-white text-xs font-semibold uppercase tracking-wide hover:bg-[#268579] transition-colors"
              style={{ borderRadius: 0 }}
            >
              + New Project
            </Link>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects"
              className="h-9 w-full pl-8 pr-3 text-sm border border-[#E5E7EB] bg-white rounded-md focus:outline-none focus:border-[#2E86AB]"
            />
          </div>

          <div className="space-y-3">
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
          </div>
        </div>

        {/* Right: Model details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="space-y-3">
            <StatCard icon={Target} label="Model Accuracy" value="92%" />
            <StatCard icon={Film} label="Frames Analysed" value="1,240 / 1,350" />
            <StatCard icon={AlertTriangle} label="Defects Marked" value="347" />
            <div className="text-xs text-gray-500 text-center">Lifetime model performance</div>
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
    </AppShell>
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
