import { createFileRoute } from "@tanstack/react-router";
import { CharterDesk } from "@/components/charter/CharterDesk";

export const Route = createFileRoute("/_authenticated/app/charter")({
  ssr: false,
  component: CharterPage,
});

function CharterPage() {
  return <CharterDesk />;
}
