import { createFileRoute } from "@tanstack/react-router";
import SmartScorePage from "@/app/app/dashboard/smart-score/page";

export const Route = createFileRoute("/app/dashboard/smart-score")({
  component: SmartScorePage
});
