import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { Boxes, Users, Settings as SettingsIcon, ChevronDown } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: ModelsPage,
});

const navItems = [
  { label: "Models", icon: Boxes, to: "/" },
  { label: "Team", icon: Users, to: "/team" },
  { label: "Settings", icon: SettingsIcon, to: "/settings" },
];

function Sidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside
      className="fixed inset-y-0 left-0 w-[220px] bg-white border-r border-[#E5E7EB] flex flex-col"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div className="h-16 flex items-center gap-2 px-5 border-b border-[#E5E7EB]">
        <div className="w-6 h-6 bg-[#2E86AB] rounded-sm" />
        <span className="text-[17px] font-semibold text-gray-900">Speedo.ai</span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const active = path === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors rounded-md ${
                active
                  ? "bg-[#EEF2FF] text-[#2E86AB]"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function TopBar() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center justify-end h-16 px-8 bg-white border-b border-[#E5E7EB]">
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-3 text-sm"
        >
          <div className="w-9 h-9 rounded-full bg-[#2E86AB] text-white flex items-center justify-center font-semibold">
            JS
          </div>
          <div className="text-left leading-tight">
            <div className="font-medium text-gray-900">John Stephan</div>
            <div className="text-xs text-gray-500">Sales</div>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E5E7EB] rounded-md shadow-lg py-1 z-10">
            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Profile</a>
            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Account settings</a>
            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Sign out</a>
          </div>
        )}
      </div>
    </div>
  );
}

function ModelsPage() {
  const tabs = ["Details", "Timeline", "Predictions"];
  const [active, setActive] = useState("Details");
  return (
    <div className="min-h-screen bg-[#F0F2F7]" style={{ fontFamily: "Inter, sans-serif" }}>
      <Sidebar />
      <div className="ml-[220px]">
        <TopBar />
        <main className="p-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">
            Corrosion Detection — Video
          </h1>
          <div className="border-b border-[#E5E7EB] mb-6 flex items-center justify-between">
            <div className="flex gap-6">
              {tabs.map((t) => (
                <button
                  key={t}
                  onClick={() => setActive(t)}
                  className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    active === t
                      ? "text-[#2E86AB] border-[#2E86AB]"
                      : "text-gray-500 border-transparent hover:text-gray-700"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <button
              className="px-5 py-2.5 bg-[#2E9E8F] text-white text-xs font-semibold uppercase tracking-wide hover:bg-[#268579] transition-colors"
              style={{ borderRadius: 0 }}
            >
              Run Inspection
            </button>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded-md min-h-[400px]" />
        </main>
      </div>
    </div>
  );
}
