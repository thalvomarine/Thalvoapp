import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CharterDesk } from "@/components/charter/CharterDesk";
import { CharterFleetEditor } from "@/components/charter/CharterFleetEditor";
import { useProfile } from "@/lib/session";
import { loadOwnerInquiries, loadOwnerYachts } from "@/lib/charter-fleet-api";
import type { StoredInquiry, StoredYacht } from "@/lib/charter-fleet";

export const Route = createFileRoute("/_authenticated/app/charter")({
  ssr: false,
  component: CharterPage,
});

function CharterPage() {
  const user = Route.useRouteContext().user;
  const { profile } = useProfile(user?.id);
  const [yachts, setYachts] = useState<StoredYacht[]>([]);
  const [inquiries, setInquiries] = useState<StoredInquiry[]>([]);

  const reload = useCallback(async () => {
    if (!user?.id) return;
    try {
      const rows = await loadOwnerYachts(user.id);
      setYachts(rows);
      setInquiries(await loadOwnerInquiries(rows.map((row) => row.id)));
    } catch {
      setYachts([]);
      setInquiries([]);
    }
  }, [user?.id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (!user) return null;
  const operator = profile?.business_name?.trim() || profile?.full_name?.trim() || "THALVO";

  return (
    <div className="space-y-6">
      <CharterFleetEditor
        ownerId={user.id}
        operatorName={operator}
        yachts={yachts}
        inquiries={inquiries}
        onChanged={() => void reload()}
      />
      <CharterDesk companyYachts={yachts} />
    </div>
  );
}
