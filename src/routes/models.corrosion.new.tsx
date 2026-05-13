import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { UploadCloud, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/models/corrosion/new")({
  component: NewProjectPage,
});

function NewProjectPage() {
  const navigate = useNavigate();
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
    <AppShell>
      <Link to="/models/corrosion" className="text-sm text-[#2E86AB] hover:underline mb-3 inline-block">
        ← Corrosion Detection — Video
      </Link>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">New Inspection Project</h1>

      <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 max-w-3xl">
        <div className="border-2 border-dashed border-[#2E9E8F]/50 rounded-lg p-10 text-center bg-[#F0FBF9]">
          <div className="w-14 h-14 mx-auto rounded-full bg-white flex items-center justify-center mb-3">
            <UploadCloud className="w-7 h-7 text-[#2E9E8F]" />
          </div>
          <div className="text-base font-semibold text-gray-900 mb-1">Upload your video file</div>
          <div className="text-xs text-gray-500 mb-4">Supports MP4, MOV, AVI up to 2GB</div>
          <button
            onClick={handlePick}
            className="rounded-lg bg-[#2E9E8F] px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-[#268579]"
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

        <div className="flex items-center justify-end gap-2 mt-8">
          <button
            onClick={() => navigate({ to: "/models/corrosion" })}
            className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            disabled={!ready}
            onClick={() => navigate({ to: "/models/corrosion/pipeline-inspection-01" })}
            className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
              ready
                ? "bg-[#2E9E8F] text-white hover:bg-[#268579]"
                : "cursor-not-allowed bg-gray-200 text-gray-400"
            }`}
          >
            Start Inspection
          </button>
        </div>
      </div>
    </AppShell>
  );
}
