import { createFileRoute, Link } from "@tanstack/react-router";
import { Boxes, Scan } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/")({
  component: ModelsListPage,
});

type Model = {
  to: string | null;
  type: string;
  icon: typeof Boxes;
  title: string;
  project: string;
  date: string;
};

const models: Model[] = [
  {
    to: "/models/corrosion",
    type: "Object Detection",
    icon: Scan,
    title: "Corrosion Detection — Video",
    project: "Project_corrosion",
    date: "02 Dec 2025",
  },
  {
    to: null,
    type: "Segmentation",
    icon: Boxes,
    title: "Aircraft Scratch",
    project: "Aircraft_1",
    date: "01 Mar 2026",
  },
];

function ModelCard({ model }: { model: Model }) {
  const Icon = model.icon;
  const inner = (
    <>
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#EEF2FF] transition-colors group-hover:bg-[#E1F1F8]">
          <Icon className="h-4 w-4 text-[#2E86AB]" />
        </div>
        <span className="min-w-0 text-xs font-semibold text-[#2E86AB] uppercase tracking-wide">
          {model.type}
        </span>
      </div>
      <h3 className="mb-8 text-base font-semibold text-gray-900">{model.title}</h3>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-[#F0F2F7] pt-3 text-xs text-gray-500">
        <span className="min-w-0 truncate">{model.project}</span>
        <span className="shrink-0">{model.date}</span>
      </div>
    </>
  );
  if (!model.to) {
    return (
      <div className="block cursor-not-allowed rounded-lg border border-[#E5E7EB] bg-white/80 p-5 opacity-70 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        {inner}
      </div>
    );
  }
  return (
    <Link
      to={model.to}
      className="group block rounded-lg border border-[#E5E7EB] bg-white/95 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#2E86AB]/45 hover:bg-white hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)] hover:ring-1 hover:ring-[#2E86AB]/10"
    >
      {inner}
    </Link>
  );
}

function ModelsListPage() {
  return (
    <AppShell>
      <p className="mb-3 text-sm text-gray-400">Select model</p>
      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {models.map((m) => (
          <ModelCard key={m.title} model={m} />
        ))}
      </div>
    </AppShell>
  );
}
