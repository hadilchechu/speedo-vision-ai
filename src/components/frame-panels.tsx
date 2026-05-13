import { useEffect, useRef, useState } from "react";
import { Sparkles, ChevronDown, Film } from "lucide-react";
import { formatTimestamp } from "@/lib/projects-store";

function useCanvasSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const cr = e.contentRect;
        setSize({ w: Math.round(cr.width), h: Math.round(cr.height) });
      }
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return { ref, size };
}

export function OriginalFramePanel({ timestamp }: { timestamp: string }) {
  const { ref, size } = useCanvasSize<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !size.w || !size.h) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = size.w * dpr;
    c.height = size.h * dpr;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#1a1a2a";
    ctx.fillRect(0, 0, size.w, size.h);
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    const step = 24;
    for (let x = 0; x <= size.w; x += step) {
      ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, size.h); ctx.stroke();
    }
    for (let y = 0; y <= size.h; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(size.w, y + 0.5); ctx.stroke();
    }
  }, [size]);
  return (
    <div ref={ref} className="relative rounded-md overflow-hidden" style={{ aspectRatio: "16/9", background: "#1a1a2a" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
      <span className="absolute bottom-2 left-2 text-white text-[11px] font-mono">{timestamp}</span>
      <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded">Original</span>
    </div>
  );
}

export function AnnotatedFramePanel({ box }: { box: { x: number; y: number; width: number; height: number } }) {
  const { ref, size } = useCanvasSize<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !size.w || !size.h) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = size.w * dpr;
    c.height = size.h * dpr;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#1a1a2a";
    ctx.fillRect(0, 0, size.w, size.h);
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    const step = 24;
    for (let x = 0; x <= size.w; x += step) { ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, size.h); ctx.stroke(); }
    for (let y = 0; y <= size.h; y += step) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(size.w, y + 0.5); ctx.stroke(); }
    const bx = (box.x / 100) * size.w;
    const by = (box.y / 100) * size.h;
    const bw = (box.width / 100) * size.w;
    const bh = (box.height / 100) * size.h;
    ctx.fillStyle = "rgba(249, 115, 22, 0.3)";
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "#F97316";
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);
  }, [size, box.x, box.y, box.width, box.height]);
  return (
    <div ref={ref} className="relative rounded-md overflow-hidden" style={{ aspectRatio: "16/9", background: "#1a1a2a" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
      <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded">Annotated</span>
    </div>
  );
}

export function InspectionSummary({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="relative bg-[#EEF6FF] border-l-[3px] border-[#2E86AB] rounded-r-md">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-white/60"
      >
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-gray-900">AI Inspection Summary</h4>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#2E86AB]" />
          <ChevronDown className={`w-4 h-4 text-[#2E86AB] transition-transform ${open ? "" : "-rotate-90"}`} />
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 -mt-1">
          <p className="text-xs text-gray-700 leading-relaxed">{children}</p>
        </div>
      )}
    </div>
  );
}

export function LegacyVideoPlaceholder({ filename }: { filename: string }) {
  return (
    <div className="relative w-full rounded-md overflow-hidden flex flex-col items-center justify-center text-center" style={{ aspectRatio: "16/9", background: "#1a1a2a" }}>
      <Film className="w-12 h-12 text-[#2E9E8F] mb-3" />
      <div className="text-white text-sm font-semibold">Demo footage · {filename}</div>
      <div className="text-white/60 text-xs mt-1">Video preview unavailable for legacy projects</div>
    </div>
  );
}

type SnapshotBox = { x: number; y: number; width: number; height: number };

/** Renders a single frame from `videoSrc` at `timestamp` (seconds) onto a canvas; annotated variant draws the box overlay in video space. */
export function VideoFrameSnapshot({
  videoSrc,
  timestamp,
  box,
  variant,
  hint,
}: {
  videoSrc: string;
  timestamp: number;
  box: SnapshotBox;
  variant: "original" | "annotated";
  /** Shown when the video fails to load (e.g. missing file under public/). */
  hint?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { ref, size } = useCanvasSize<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    setLoadError(false);
    const onErr = () => setLoadError(true);
    v.addEventListener("error", onErr);
    return () => v.removeEventListener("error", onErr);
  }, [videoSrc]);

  useEffect(() => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c || !size.w || !size.h || loadError) return;

    let cancelled = false;

    const paint = () => {
      if (cancelled) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const vw = v.videoWidth;
      const vh = v.videoHeight;
      if (!vw || !vh) return;
      const dpr = window.devicePixelRatio || 1;
      c.width = size.w * dpr;
      c.height = size.h * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      const scale = Math.min(size.w / vw, size.h / vh);
      const dw = vw * scale;
      const dh = vh * scale;
      const ox = (size.w - dw) / 2;
      const oy = (size.h - dh) / 2;
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, size.w, size.h);
      ctx.drawImage(v, ox, oy, dw, dh);
      if (variant === "annotated") {
        const bx = ox + (box.x / 100) * dw;
        const by = oy + (box.y / 100) * dh;
        const bw = (box.width / 100) * dw;
        const bh = (box.height / 100) * dh;
        ctx.fillStyle = "rgba(249, 115, 22, 0.35)";
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = "#F97316";
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bw, bh);
      }
    };

    const seek = () => {
      if (cancelled || !v.duration || !Number.isFinite(v.duration)) return;
      const safe = Math.max(0, Math.min(timestamp, v.duration - 1 / 30));
      v.currentTime = safe;
    };

    const onSeeked = () => paint();
    const onLoaded = () => seek();

    v.addEventListener("seeked", onSeeked);
    v.addEventListener("loadedmetadata", onLoaded);
    if (v.readyState >= 1) seek();

    return () => {
      cancelled = true;
      v.removeEventListener("seeked", onSeeked);
      v.removeEventListener("loadedmetadata", onLoaded);
    };
  }, [videoSrc, timestamp, size.w, size.h, variant, box.x, box.y, box.width, box.height, loadError]);

  const fallback =
    hint ??
    (videoSrc.includes("/demo-inspection/")
      ? "Add public/demo-inspection/demo.mp4 (see README there) to enable previews."
      : "Video not available for frame previews.");

  if (loadError) {
    return (
      <div
        ref={ref}
        className="relative flex flex-col items-center justify-center gap-2 rounded-md border border-white/10 p-4 text-center"
        style={{ aspectRatio: "16/9", background: "#1a1a2a" }}
      >
        <p className="text-xs text-white/75">{fallback}</p>
        <video ref={videoRef} src={videoSrc} muted playsInline preload="metadata" className="hidden" />
      </div>
    );
  }

  return (
    <div ref={ref} className="relative overflow-hidden rounded-md" style={{ aspectRatio: "16/9", background: "#0f172a" }}>
      <video ref={videoRef} src={videoSrc} muted playsInline preload="metadata" className="hidden" />
      <canvas ref={canvasRef} className="block h-full w-full" />
      <span className="absolute bottom-2 left-2 font-mono text-[11px] text-white">{formatTimestamp(timestamp)}</span>
      <span className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
        {variant === "original" ? "Original" : "Annotated"}
      </span>
    </div>
  );
}