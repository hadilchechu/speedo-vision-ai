import { Link, useRouterState } from "@tanstack/react-router";
import { Boxes, Users, Settings as SettingsIcon, MessageCircle, ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import logoUrl from "@/assets/logo.png";
import { LoginButton } from "@/components/auth/login-button";
import { InteractiveDotGrid } from "@/components/interactive-dot-grid";

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
      <Link
        to="/"
        aria-label="Go to home"
        className="flex h-16 items-center border-b border-[#E5E7EB] px-5 pt-5"
      >
        <img src={logoUrl} alt="Speedo.ai" className="h-14 w-auto" />
      </Link>
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
      <div className="px-3 pb-4">
        <a
          href="https://www.linkedin.com/in/hadilchechu/"
          target="_blank"
          rel="noreferrer"
          aria-label="Hadil C on LinkedIn"
          className="block rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-3 shadow-sm transition hover:border-[#0A66C2] hover:bg-[#F0F7FF] hover:shadow-md"
        >
          <div className="mb-2 text-[11px] font-medium uppercase text-gray-400">Created by</div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-xs font-semibold text-[#2E86AB] shadow-sm ring-1 ring-[#D9E7F2]">
              HC
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-gray-800">Hadil C</div>
              <div className="text-[11px] text-gray-500">Speedo.ai</div>
            </div>
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] bg-[#0A66C2] text-[11px] font-bold leading-none text-white">
              in
            </span>
          </div>
        </a>
      </div>
    </aside>
  );
}

function TopBar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  let back: { to: string; label: string } | null = null;
  if (path.startsWith("/models/corrosion/")) {
    back = { to: "/models/corrosion", label: "Corrosion Detection — Video" };
  } else if (path === "/models/corrosion") {
    back = { to: "/", label: "Models" };
  } else if (path === "/team" || path === "/settings") {
    back = { to: "/", label: "Models" };
  }
  const modelsHomeTitle = path === "/" && !back;
  return (
    <div className="flex items-center justify-between h-16 px-8 bg-white border-b border-[#E5E7EB]">
      <div>
        {back ? (
          <Link
            to={back.to}
            className="inline-flex items-center gap-1.5 text-sm text-[#2E86AB] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            {back.label}
          </Link>
        ) : modelsHomeTitle ? (
          <h1 className="text-lg font-semibold text-gray-900">Models</h1>
        ) : null}
      </div>
      <LoginButton />
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
      <div className="relative ml-[220px] min-h-screen">
        <InteractiveDotGrid />
        <div className="relative z-10 flex min-h-screen flex-col">
          <TopBar />
          <main className="flex-1 p-8">{children}</main>
        </div>
      </div>
      <ChatBubble />
    </div>
  );
}
