import { createFileRoute, Link } from "@tanstack/react-router";
import { Boxes, Scan, ChevronDown } from "lucide-react";
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
    date: "02 Dec 2021",
  },
  {
    to: null,
    type: "Segmentation",
    icon: Boxes,
    title: "Car Scratch",
    project: "Cars_new",
    date: "01 Dec 2021",
  },
];

function FilterSelect({ label }: { label: string }) {
  return (
    <button className="h-9 px-3 text-sm border border-[#E5E7EB] bg-white rounded-md text-gray-700 flex items-center gap-2 hover:border-[#2E86AB]">
      {label}
      <ChevronDown className="w-4 h-4 text-gray-500" />
    </button>
  );
}

function ModelCard({ model }: { model: Model }) {
  const Icon = model.icon;
  const inner = (
    <>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-md bg-[#EEF2FF] flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#2E86AB]" />
        </div>
        <span className="text-xs font-semibold text-[#2E86AB] uppercase tracking-wide">
          {model.type}
        </span>
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-8">{model.title}</h3>
      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-[#F0F2F7]">
        <span>{model.project}</span>
        <span>{model.date}</span>
      </div>
    </>
  );
  if (!model.to) {
    return (
      <div className="block bg-white border border-[#E5E7EB] rounded-lg p-5 opacity-70 cursor-not-allowed">
        {inner}
      </div>
    );
  }
  return (
    <Link
      to={model.to}
      className="block bg-white border border-[#E5E7EB] rounded-lg p-5 hover:border-[#2E86AB] hover:shadow-sm transition"
    >
      {inner}
    </Link>
  );
}

function ModelsListPage() {
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Models</h1>
      <div className="flex items-center gap-3 mb-6">
        <FilterSelect label="All Models" />
        <FilterSelect label="Newest first" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map((m) => (
          <ModelCard key={m.title} model={m} />
        ))}
      </div>
    </AppShell>
  );
}