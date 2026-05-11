import { Link } from "@tanstack/react-router";
import { Construction } from "lucide-react";
import type { ReactNode } from "react";

/** Shared “not built yet” layout for sidebar destinations that are on the roadmap. */
export function PlannedPage({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="max-w-xl">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#EEF2FF]">
          <Construction className="h-6 w-6 text-[#2E86AB]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#2E86AB]">
            Planned for a future release
          </p>
        </div>
      </div>
      <p className="mb-6 text-sm leading-relaxed text-gray-600">
        {children ??
          "This section is not available yet. We're prioritizing inspection and corrosion workflows first."}
      </p>
      <Link to="/" className="text-sm font-medium text-[#2E86AB] hover:underline">
        ← Back to Models
      </Link>
    </div>
  );
}
