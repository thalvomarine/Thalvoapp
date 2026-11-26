import { createFileRoute } from "@tanstack/react-router";
import { CharterCatalogue } from "@/components/charter/CharterCatalogue";

export const Route = createFileRoute("/charter")({
  ssr: false,
  component: CharterCatalogue,
});
