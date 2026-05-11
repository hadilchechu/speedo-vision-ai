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
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
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