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
    />
  );
}
