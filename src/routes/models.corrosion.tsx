import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { projectsStore, formatCreatedAt, type Detection } from "@/lib/projects-store";
import { extractFrames, detectFrame, normalizeDetections } from "@/lib/corrosion-detect";
import { fetchCloudProjectSummaries, importProjectToCloud } from "@/lib/projects-api";
import { STATIC_FEATURED_DEMO } from "@/lib/static-featured-demo";

export const Route = createFileRoute("/models/corrosion")({
  component: CorrosionModelPage,
});

function CorrosionModelPage() {
  const [openNew, setOpenNew] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const qc = useQueryClient();
  const cloudQ = useQuery({
    queryKey: ["cloud-projects"],
    queryFn: fetchCloudProjectSummaries,
    staleTime: 15_000,
  });

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Corrosion Detection — Video</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Projects */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <h2 className="text-[18px] font-bold text-gray-900">Projects</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOpenImport(true)}
                className="px-4 py-2 bg-white border border-[#2E86AB] text-[#2E86AB] text-xs font-semibold uppercase tracking-wide hover:bg-[#EEF2FF] transition-colors"
                style={{ borderRadius: 0 }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <FileDown className="w-3.5 h-3.5" />
                  Import
                </span>
              </button>
              <button
                type="button"
                onClick={() => setOpenNew(true)}
                className="px-4 py-2 bg-[#2E9E8F] text-white text-xs font-semibold uppercase tracking-wide hover:bg-[#268579] transition-colors"
                style={{ borderRadius: 0 }}
              >
                + New Project
              </button>
            </div>
          </div>

          <div className="relative mb-4 w-1/3 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects"
              className="h-9 w-full pl-8 pr-3 text-sm border border-[#E5E7EB] bg-white rounded-md focus:outline-none focus:border-[#2E86AB]"
            />
          </div>

          {cloudQ.data?.d1SetupRequired && cloudQ.data?.setupMessage ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-4 text-sm text-amber-950">
              <p className="font-semibold text-amber-950">Cloud database not initialized</p>
              <p className="mt-1 text-xs leading-relaxed">{cloudQ.data.setupMessage}</p>
              <p className="mt-2 text-xs text-amber-900/90">
                The bundled demo below still works without D1. After migrating, refresh this page to
                load cloud-saved projects.
              </p>
            </div>
          ) : null}

          {cloudQ.isLoading && (
            <div className="text-sm text-gray-500 py-6">Loading cloud projects…</div>
          )}
          {cloudQ.isError && (
            <div className="text-sm text-red-600 py-4">
              Could not load projects:{" "}
              {cloudQ.error instanceof Error ? cloudQ.error.message : "Unknown error"}
            </div>
          )}
          {!cloudQ.isLoading && !cloudQ.isError && (cloudQ.data?.projects?.length ?? 0) === 0 && (
            <div className="rounded-lg border border-dashed border-[#E5E7EB] bg-white p-6 text-sm text-gray-600 mb-4">
              <p className="font-semibold text-gray-900 mb-1">No cloud-saved projects yet</p>
              <p className="text-xs leading-relaxed mb-3">
                Use the <strong>Featured demo</strong> below (ships with the site), or run{" "}
                <strong>New Project</strong> and <strong>Save to cloud</strong> once D1/R2 are
                configured (<code className="text-[11px]">wrangler.jsonc</code>).
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Link
              to="/models/corrosion/pipeline-inspection-01"
              className="flex items-center gap-4 bg-white border border-[#2E86AB]/30 rounded-lg p-4 hover:border-[#2E86AB] hover:shadow-sm transition ring-1 ring-[#2E86AB]/10"
            >
              <div className="w-10 h-10 rounded-md bg-[#EEF2FF] flex items-center justify-center shrink-0">
                <Folder className="w-5 h-5 text-[#2E86AB]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wide text-[#2E86AB]">
                  Bundled demo
                </div>
                <div className="text-sm font-bold text-gray-900 truncate">
                  {STATIC_FEATURED_DEMO.name}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Video and analysis ship with this deploy · {STATIC_FEATURED_DEMO.createdAt}
                </div>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold bg-orange-100 text-orange-700 rounded shrink-0">
                {STATIC_FEATURED_DEMO.detections.length} detections
              </span>
              <span className="px-2.5 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded shrink-0">
                {STATIC_FEATURED_DEMO.status}
              </span>
              <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
            </Link>

            {(cloudQ.data?.projects ?? []).map((p) => (
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
                  <div className="text-xs text-gray-500 mt-0.5">Last inspected: {p.created_at}</div>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold bg-orange-100 text-orange-700 rounded shrink-0">
                  {p.detection_count} detections
                </span>
                <span className="px-2.5 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded shrink-0">
                  {p.status}
                </span>
                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
              </Link>
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
              This pre-trained model detects and labels corrosion across video footage. The AI scans
              each frame, flags defects, and prioritises by severity level.
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
      {openNew && (
        <NewProjectModal
          onClose={() => setOpenNew(false)}
          onCreated={() => void qc.invalidateQueries({ queryKey: ["cloud-projects"] })}
        />
      )}
      {openImport && (
        <ImportProjectModal
          onClose={() => setOpenImport(false)}
          onDone={() => {
            void qc.invalidateQueries({ queryKey: ["cloud-projects"] });
            setOpenImport(false);
          }}
        />
      )}
    </AppShell>
  );
}

function ImportProjectModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const manifestRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const mf = manifestRef.current?.files?.[0];
    const vf = videoRef.current?.files?.[0];
    if (!mf || !vf) {
      toast.error("Choose both an export JSON file and the matching video file.");
      return;
    }
    setBusy(true);
    try {
      const text = await mf.text();
      await importProjectToCloud(text, vf);
      toast.success("Project imported.");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Import project</h2>
        <p className="text-xs text-gray-600 mb-4">
          Use the <strong>Export JSON</strong> file from another deployment, plus the same{" "}
          <strong>video</strong> file (or a re-encoded copy with identical content for the same
          timestamps).
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
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
            <label className="block text-xs font-semibold text-gray-700 mb-1">Video (.mp4)</label>
            <input ref={videoRef} type="file" accept="video/*" className="block w-full text-sm" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold uppercase"
            style={{ borderRadius: 0 }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit()}
            className="px-4 py-2 bg-[#2E9E8F] text-white text-xs font-semibold uppercase disabled:opacity-50"
            style={{ borderRadius: 0 }}
          >
            {busy ? "Importing…" : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}

function NewProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated?: () => void }) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [phase, setPhase] = useState<"idle" | "extracting" | "analysing" | "building">("idle");
  const [analyseStatus, setAnalyseStatus] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  const processing = phase !== "idle";

  const onFileChange = (f: File | null) => {
    if (!f) return;
    setFile(f);
    setUploadProgress(0);
    // Simulate quick upload progress for UI
    const start = Date.now();
    const id = setInterval(() => {
      const pct = Math.min(100, Math.round(((Date.now() - start) / 800) * 100));
      setUploadProgress(pct);
      if (pct >= 100) clearInterval(id);
    }, 60);
  };

  const sizeMb = file ? (file.size / 1_000_000).toFixed(1) + " MB" : "";
  const ready = !!file && uploadProgress === 100 && !processing;

  const startInspection = async () => {
    if (!file) return;
    setError(null);
    try {
      setPhase("extracting");
      const { frames, duration, videoURL } = await extractFrames(file, 2);
      setPhase("analysing");
      setAnalyseStatus({ done: 0, total: frames.length });
      const detections: Detection[] = [];
      for (let i = 0; i < frames.length; i++) {
        const fr = frames[i];
        try {
          const json = await detectFrame(fr.blob);
          const norm = normalizeDetections(json, fr.timestamp);
          if (norm.length > 0) detections.push(...norm);
        } catch {
          // skip silently
        }
        setAnalyseStatus({ done: i + 1, total: frames.length });
      }
      setPhase("building");
      const id = String(Date.now());
      const projName = projectName.trim() || file.name.replace(/\.[^.]+$/, "");
      projectsStore.add({
        id,
        name: projName,
        videoURL,
        createdAt: formatCreatedAt(),
        detections,
        status: "Completed",
        duration,
        fileName: file.name,
        framesAnalysed: frames.length,
      });
      await new Promise((r) => setTimeout(r, 400));
      onClose();
      onCreated?.();
      navigate({ to: "/models/corrosion/$projectId", params: { projectId: id } });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Processing failed");
      setPhase("idle");
    }
  };

  const totalProgress =
    phase === "extracting"
      ? 10
      : phase === "analysing"
        ? 10 + (analyseStatus.total ? (analyseStatus.done / analyseStatus.total) * 80 : 0)
        : phase === "building"
          ? 95
          : 0;

  const phaseLabel =
    phase === "extracting"
      ? "Extracting frames..."
      : phase === "analysing"
        ? `Analysing frame ${analyseStatus.done} of ${analyseStatus.total}...`
        : phase === "building"
          ? "Building results..."
          : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={processing ? undefined : onClose}
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
              className="px-5 py-2 bg-[#2E9E8F] text-white text-xs font-semibold uppercase tracking-wide hover:bg-[#268579] disabled:opacity-50"
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
                    className="h-full bg-[#2E9E8F] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-600">
                  {uploadProgress === 100 ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2E9E8F]" /> Uploaded · 100%
                    </>
                  ) : (
                    <>Uploading... {uploadProgress}%</>
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
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                disabled={processing}
                placeholder="e.g. Pipeline_Inspection_02"
                className="w-full h-10 px-3 text-sm border border-[#E5E7EB] rounded-md focus:outline-none focus:border-[#2E86AB]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={processing}
                placeholder="Optional notes about this inspection"
                className="w-full h-10 px-3 text-sm border border-[#E5E7EB] rounded-md focus:outline-none focus:border-[#2E86AB]"
              />
            </div>
          </div>

          {processing && (
            <div className="mt-6">
              <div className="text-xs text-gray-700 mb-2">{phaseLabel}</div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2E9E8F] transition-all duration-300"
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
            </div>
          )}
          {error && <div className="mt-4 text-xs text-red-600">{error}</div>}

          <div className="flex items-center justify-end gap-2 mt-6">
            <button
              onClick={onClose}
              disabled={processing}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold uppercase tracking-wide hover:bg-gray-50 disabled:opacity-50"
              style={{ borderRadius: 0 }}
            >
              Cancel
            </button>
            <button
              onClick={startInspection}
              disabled={!ready}
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
                ready
                  ? "bg-[#2E9E8F] text-white hover:bg-[#268579]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
              style={{ borderRadius: 0 }}
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
  icon: typeof Target;
  label: string;
  value: string;
}) {
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
