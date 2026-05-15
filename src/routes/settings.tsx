import { createFileRoute } from "@tanstack/react-router";
import { Settings, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function DotField({ className }: { className: string }) {
  return (
    <div
      aria-hidden
      className={`absolute ${className}`}
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(46, 134, 171, 0.12) 1.5px, transparent 1.5px)",
        backgroundSize: "22px 22px",
        animation: "pulseDots 5s ease-in-out infinite",
      }}
    />
  );
}

function SettingsIllustration() {
  return (
    <div className="relative aspect-square w-[400px] opacity-[0.34] max-lg:mx-auto max-lg:w-full max-lg:max-w-[360px]">
      {/* dotted accents */}
      <DotField className="-right-10 top-6 h-40 w-44 opacity-30" />
      <DotField className="-bottom-8 left-0 h-32 w-40 opacity-20" />

      {/* main soft circle */}
      <div className="absolute inset-[18%] rounded-full bg-[#EAF2FC]/45 blur-[2px]" />

      {/* settings sliders */}
      <div className="absolute left-[30%] top-[60%] flex flex-col gap-8">
        <div className="relative h-2 w-44 rounded-full bg-[#AFCBED]/45">
          <div className="absolute left-[18%] top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#7EA4CC]/65" />
        </div>

        <div className="relative h-2 w-36 rounded-full bg-[#AFCBED]/38">
          <div className="absolute left-[62%] top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#7EA4CC]/60" />
        </div>

        <div className="relative h-2 w-48 rounded-full bg-[#AFCBED]/35">
          <div className="absolute left-[42%] top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#7EA4CC]/58" />
        </div>
      </div>

      {/* floating settings card */}
      <div className="absolute bottom-[-8%] right-[16%] flex h-[18%] w-[18%] items-center justify-center rounded-2xl border border-dashed border-[#9CB8DB]/60 bg-white/20 backdrop-blur-[1px]">
        <SlidersHorizontal
          className="h-[42%] w-[42%] text-[#7EA4CC]/70"
          strokeWidth={1.7}
        />
      </div>
    </div>
  );
}

function SettingsPage() {
  return (
    <AppShell>
      <div className="relative min-h-[calc(100vh-7rem)] overflow-hidden px-0 pt-0 pb-3 md:px-3 lg:px-4 xl:px-5">
        {/* subtle animated dots */}
        <DotField className="pointer-events-none bottom-12 left-[18%] h-52 w-52 opacity-15" />

        <DotField className="pointer-events-none right-[20%] top-[18%] h-52 w-52 opacity-15" />

        <style>
          {`
            @keyframes pulseDots {
              0%, 100% {
                opacity: 0.12;
                transform: translateY(0px);
              }
              50% {
                opacity: 0.28;
                transform: translateY(-4px);
              }
            }
          `}
        </style>

        <div className="relative mx-auto flex max-w-[1450px] items-start justify-between">
          {/* LEFT CONTENT */}
          <section className="relative z-10 max-w-[640px] pt-2 pl-0">
            <div className="flex items-start gap-6">
              <div className="flex h-[75px] w-[75px] shrink-0 items-center justify-center rounded-[22px] bg-[#EEF2FF]">
              <Settings
                className="h-10 w-10 text-[#2E86AB]/90"
                strokeWidth={1.8}
                />
              </div>

              <div className="pt-1">
                <h1 className="text-[24px] font-semibold leading-none tracking-[-0.03em] text-[#111827]">
                  Settings
                </h1>

                <p className="mt-3 text-[14px] font-semibold uppercase tracking-[0.06em] text-[#2E86AB]/90">
                  Planned for a future release
                </p>
              </div>
            </div>

            <p className="mt-4 max-w-[700px] text-[16px] leading-[1.5] font-[300] text-[#4B5563]">
              Organization defaults, API keys, and notification preferences
              will be configurable here in a future update.
            </p>
          </section>

          {/* RIGHT ILLUSTRATION */}
          <section className="pointer-events-none relative right-16 top-2 hidden lg:block">
            <SettingsIllustration />
          </section>
        </div>
      </div>
    </AppShell>
  );
}