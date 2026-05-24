import { Link, useRouterState } from "@tanstack/react-router";
import {
  Boxes,
  Users,
  Settings as SettingsIcon,
  MessageCircle,
  ArrowLeft,
  Menu,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";
import logoUrl from "@/assets/speedo_logoo0.svg";
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
      className="fixed inset-y-0 left-0 hidden w-[220px] flex-col border-r border-[#E5E7EB] bg-white lg:flex"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <Link
        to="/"
        aria-label="Go to home"
        className="flex h-16 items-center border-b border-[#E5E7EB] px-5"
      >
        <img src={logoUrl} alt="Speedo.ai" className="h-10 w-auto max-w-[165px]" />
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
          <div className="mb-2 text-[11px] font-medium uppercase text-gray-400">Creation of</div>
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

function MobileHeader() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-[#E5E7EB] bg-white lg:hidden">
      <div className="flex h-16 items-center justify-between gap-2 px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-transparent text-gray-600 transition-colors hover:bg-gray-50"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link to="/" aria-label="Go to home" className="flex min-w-0 shrink-0 items-center">
            <img
              src={logoUrl}
              alt="Speedo.ai"
              className="block h-7 w-auto max-w-[150px] translate-y-0.5 sm:h-8"
            />
          </Link>
        </div>
        <div className="min-w-0 scale-[0.86] origin-right">
          <LoginButton />
        </div>
      </div>
      {open ? (
        <nav className="border-t border-[#F0F2F7] px-3 py-2">
          <div className="space-y-1 rounded-xl border border-[#E5E7EB] bg-white p-2 shadow-sm">
            {navItems.map((item) => {
              const active =
                item.to === "/" ? path === "/" || path.startsWith("/models") : path === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active ? "bg-[#EEF2FF] text-[#2E86AB]" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-[#2E86AB]" : "text-gray-500"}`} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </header>
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
    <div className="hidden h-16 items-center justify-between border-b border-[#E5E7EB] bg-white px-8 lg:flex">
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
  const path = useRouterState({ select: (s) => s.location.pathname });
  const showChatBubble = path === "/" || path === "/team" || path === "/settings";

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-[#F0F2F7]"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <Sidebar />
      <div className="relative min-h-screen lg:ml-[220px]">
        <InteractiveDotGrid />
        <div className="relative z-10 flex min-h-screen flex-col">
          <MobileHeader />
          <TopBar />
          <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
      {showChatBubble ? <ChatBubble /> : null}
    </div>
  );
}
