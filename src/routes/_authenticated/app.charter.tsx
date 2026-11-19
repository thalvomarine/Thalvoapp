import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { CharterDesk } from "@/components/charter/CharterDesk";
import { useProfile, useSessionUser } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/app/charter")({
  ssr: false,
  component: CharterPage,
});

function CharterPage() {
  const routeUser = Route.useRouteContext().user;
  const { user: sessionUser } = useSessionUser();
  const user = sessionUser ?? routeUser;
  if (!user) return null;
  return <CharterGate userId={user.id} />;
}

function CharterGate({ userId }: { userId: string }) {
  const { profile, loading } = useProfile(userId);
  if (loading && !profile) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-white/50">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }
  // Dealers keep the parts counter; charter desk is for captain / ops accounts.
  if (profile?.role === "Supplier") return <Navigate to="/app/dealer" replace />;
  return <CharterDesk />;
}
