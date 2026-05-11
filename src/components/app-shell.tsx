import { Link, useRouterState } from "@tanstack/react-router";
import {
  Boxes,
  Users,
  Settings as SettingsIcon,
  ChevronDown,
  MessageCircle,
  ArrowLeft,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import logoUrl from "@/assets/logo.png";

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
      <div className="h-16 flex items-center px-5 border-b border-[#E5E7EB]">
        <img src={logoUrl} alt="Speedo.ai" className="h-8 w-auto" />
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const active =
            item.to === "/" ? path === "/" || path.startsWith("/models") : path === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors rounded-md ${
                active ? "bg-[#EEF2FF] text-[#2E86AB]" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? "text-[#2E86AB]" : "text-gray-500"}`} />
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
  const path = useRouterState({ select: (s) => s.location.pathname });
  let back: { to: string; label: string } | null = null;
  if (path.startsWith("/models/corrosion/")) {
    back = { to: "/models/corrosion", label: "Corrosion Detection — Video" };
  } else if (path === "/models/corrosion") {
    back = { to: "/", label: "Models" };
  } else if (path === "/team" || path === "/settings") {
    back = { to: "/", label: "Models" };
  }
  return (
    <div className="flex items-center justify-between h-16 px-8 bg-white border-b border-[#E5E7EB]">
      <div>
        {back && (
          <Link
            to={back.to}
            className="inline-flex items-center gap-1.5 text-sm text-[#2E86AB] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            {back.label}
          </Link>
        )}
      </div>
      <div className="relative">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-3 text-sm">
          <img
            src="https://i.pravatar.cc/72?img=12"
            alt="John Stephan"
            className="w-9 h-9 rounded-full object-cover"
          />
          <div className="text-left leading-tight">
            <div className="font-medium text-gray-900">John Stephan</div>
            <div className="text-xs text-gray-500">Sales</div>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>
        {open && (
          <div className="absolute right-0 z-10 mt-2 w-48 rounded-md border border-[#E5E7EB] bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={() => {
                toast.info("Profile — coming soon");
                setOpen(false);
              }}
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              Profile
            </button>
            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Account settings
            </Link>
            <button
              type="button"
              onClick={() => {
                toast.info("Sign out — coming soon");
                setOpen(false);
              }}
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatBubble() {
  return (
    <button
      type="button"
      aria-label="Chat"
      onClick={() => toast.info("Support chat — coming soon")}
      className="fixed bottom-6 right-6 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-[#2E9E8F] text-white shadow-lg transition hover:bg-[#268579]"
    >
      <MessageCircle className="h-5 w-5" />
    </button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F0F2F7]" style={{ fontFamily: "Inter, sans-serif" }}>
      <Sidebar />
      <div className="ml-[220px]">
        <TopBar />
        <main className="p-8">{children}</main>
      </div>
      <ChatBubble />
    </div>
  );
}
