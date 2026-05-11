import { createFileRoute } from "@tanstack/react-router";
import { CorrosionProjectDetail } from "@/components/corrosion-project-detail";
import { STATIC_FEATURED_DEMO } from "@/lib/static-featured-demo";

export const Route = createFileRoute("/models/corrosion_/pipeline-inspection-01")({
  component: FeaturedDemoPage,
});

function FeaturedDemoPage() {
  return (
    <CorrosionProjectDetail
      project={STATIC_FEATURED_DEMO}
      defaultReviewStatus="confirmed"
      headerExtra={
        <button
          type="button"
          className="border border-[#2E9E8F] bg-white px-5 py-2.5 text-xs font-semibold tracking-wide text-[#2E9E8F] uppercase transition-colors hover:bg-[#EEF2FF]"
          style={{ borderRadius: 0 }}
        >
          Reinspect
        </button>
      }
    />
  );
}
