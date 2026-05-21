import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const GRID_SPACING = 24;
const BASE_DOT_RADIUS = 0.58;
const INFLUENCE_RADIUS = 126;
const SMOOTH = 0.12;
const MAX_DPR = 2;

const BASE_RGBA = "rgba(55, 95, 125,";
const ACCENT_RGBA = "rgba(46, 134, 171,";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

type InteractiveDotGridProps = {
  className?: string;
};

export function InteractiveDotGrid({ className }: InteractiveDotGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotionRef = useRef(false);
  const targetRef = useRef({ x: -9999, y: -9999, active: false });
  const smoothRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });

  const drawStatic = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const { w, h, dpr } = sizeRef.current;
    if (w < 1 || h < 1) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const baseA = 0.085;
    for (let y = GRID_SPACING / 2; y < h; y += GRID_SPACING) {
      for (let x = GRID_SPACING / 2; x < w; x += GRID_SPACING) {
        ctx.beginPath();
        ctx.arc(x, y, BASE_DOT_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = `${BASE_RGBA}${baseA})`;
        ctx.fill();
      }
    }
  }, []);

  const drawInteractive = useCallback((): boolean => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const { w, h, dpr } = sizeRef.current;
    if (w < 1 || h < 1) return false;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return false;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    let sx = smoothRef.current.x;
    let sy = smoothRef.current.y;
    const tx = targetRef.current.x;
    const ty = targetRef.current.y;
    if (targetRef.current.active) {
      sx += (tx - sx) * SMOOTH;
      sy += (ty - sy) * SMOOTH;
    } else {
      sx += (tx - sx) * (SMOOTH * 0.35);
      sy += (ty - sy) * (SMOOTH * 0.35);
    }
    smoothRef.current = { x: sx, y: sy };

    const rSq = INFLUENCE_RADIUS * INFLUENCE_RADIUS;
    const baseA = 0.08;

    for (let y = GRID_SPACING / 2; y < h; y += GRID_SPACING) {
      for (let x = GRID_SPACING / 2; x < w; x += GRID_SPACING) {
        const dx = x - sx;
        const dy = y - sy;
        const d2 = dx * dx + dy * dy;
        let influence = 0;
        if (d2 < rSq) {
          const d = Math.sqrt(d2);
          influence = smoothstep(INFLUENCE_RADIUS, 0, d);
        }

        const radius = BASE_DOT_RADIUS + influence * 0.44;
        const coreAlpha = baseA + influence * 0.24;

        if (influence > 0.05) {
          const glowR = radius + 1.4 + influence * 3.4;
          ctx.beginPath();
          ctx.arc(x, y, glowR, 0, Math.PI * 2);
          ctx.fillStyle = `${ACCENT_RGBA}${0.075 * influence})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle =
          influence > 0.08
            ? `${ACCENT_RGBA}${Math.min(0.42, coreAlpha + influence * 0.08)})`
            : `${BASE_RGBA}${coreAlpha})`;
        ctx.fill();
      }
    }

    const dx = sx - tx;
    const dy = sy - ty;
    const converged = Math.abs(dx) < 0.12 && Math.abs(dy) < 0.12;
    return !converged;
  }, []);

  useEffect(() => {
    let frameQueued = false;
    reducedMotionRef.current = prefersReducedMotion();

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) {
      return;
    }

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

    let didInitCursor = false;

    function scheduleFrame() {
      if (frameQueued) return;
      frameQueued = true;
      rafRef.current = requestAnimationFrame(() => {
        frameQueued = false;
        if (reducedMotionRef.current) {
          drawStatic();
          return;
        }
        const keep = drawInteractive();
        if (keep) scheduleFrame();
      });
    }

    const onMq = () => {
      reducedMotionRef.current = mq.matches;
      cancelAnimationFrame(rafRef.current);
      frameQueued = false;
      if (mq.matches) {
        drawStatic();
      } else {
        scheduleFrame();
      }
    };
    mq.addEventListener("change", onMq);

    const syncSize = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      sizeRef.current = { w, h, dpr };
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      if (!didInitCursor) {
        didInitCursor = true;
        const cx = w / 2;
        const cy = h / 2;
        smoothRef.current = { x: cx, y: cy };
        targetRef.current = { x: cx, y: cy, active: false };
      }
    };

    const ro = new ResizeObserver(() => {
      syncSize();
      if (reducedMotionRef.current) {
        drawStatic();
      } else {
        scheduleFrame();
      }
    });
    ro.observe(container);
    syncSize();

    const pad = 72;
    const onMove = (e: PointerEvent) => {
      if (reducedMotionRef.current) return;
      const rect = container.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const near = mx >= -pad && my >= -pad && mx <= rect.width + pad && my <= rect.height + pad;
      if (near) {
        targetRef.current = { x: mx, y: my, active: true };
      } else {
        targetRef.current = {
          x: sizeRef.current.w / 2,
          y: sizeRef.current.h / 2,
          active: false,
        };
      }
      scheduleFrame();
    };

    const onLeave = () => {
      if (reducedMotionRef.current) return;
      const { w, h } = sizeRef.current;
      targetRef.current = { x: w / 2, y: h / 2, active: false };
      scheduleFrame();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    container.addEventListener("pointerleave", onLeave);

    if (reducedMotionRef.current) {
      drawStatic();
    } else {
      scheduleFrame();
    }

    return () => {
      mq.removeEventListener("change", onMq);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, [drawStatic, drawInteractive]);

  return (
    <div
      ref={containerRef}
      className={cn("pointer-events-none absolute inset-0 z-0 overflow-hidden", className)}
      aria-hidden
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        style={{
          WebkitMaskImage:
            "radial-gradient(ellipse 72% 65% at 50% 42%, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.45) 52%, rgba(0,0,0,0.08) 100%)",
          maskImage:
            "radial-gradient(ellipse 72% 65% at 50% 42%, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.45) 52%, rgba(0,0,0,0.08) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#F0F2F7]/55 via-transparent to-[#F0F2F7]/65"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#F0F2F7]/45 via-transparent to-[#F0F2F7]/45"
        aria-hidden
      />
    </div>
  );
}
