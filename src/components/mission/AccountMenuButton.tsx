import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Shield } from "lucide-react";
import { CharterMark, ControlTowerMark, DealerMark, ProfileMark, RescueMark } from "@/components/brand/ProductMarks";
import type { Profile } from "@/lib/session";
import { useSessionUser } from "@/lib/session";
import { setMapChromeOverlay } from "@/lib/map-chrome";
import { isPlatformOperator } from "@/lib/superadmin";
import { useTranslation } from "react-i18next";

interface Props {
  profile: Profile;
  isAdmin: boolean;
  /** Smaller trigger button for tight floating chrome (map cockpit top bar). */
  compact?: boolean;
}

/**
 * Account dropdown — Profile / role shortcuts / Admin / Sign out. Shared by
 * `MissionShell`'s header and the fullscreen map cockpit's floating brand chip.
 */
export function AccountMenuButton({ profile, isAdmin, compact = false }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useSessionUser();
  const isSupplier = profile.role === "Supplier";
  const isProvider = profile.role === "Provider";
  const [isSuper, setIsSuper] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      setIsSuper(false);
      return;
    }
    void isPlatformOperator().then((ok) => {
      if (!cancelled) setIsSuper(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <DropdownMenu onOpenChange={(open) => setMapChromeOverlay("menu", open)}>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Account"
          className={
            "grid place-items-center rounded-[10px] border border-white/12 bg-white/[0.04] text-white/80 transition-colors hover:border-[#00F0FF]/35 hover:bg-[#00F0FF]/10 " +
            (compact ? "size-8" : "size-9")
          }
        >
          <ProfileMark size={compact ? 16 : 18} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        collisionPadding={12}
        className="z-[70] w-56"
      >
        <DropdownMenuLabel className="truncate">{profile.full_name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/app/profile">
            <span className="mr-2 inline-grid size-4 place-items-center">
              <ProfileMark size={16} />
            </span>
            Profile
          </Link>
        </DropdownMenuItem>
        {isProvider && (
          <DropdownMenuItem asChild>
            <Link to="/app">
              <span className="mr-2 inline-grid size-4 place-items-center">
                <RescueMark size={16} />
              </span>
              Missions
            </Link>
          </DropdownMenuItem>
        )}
        {isSupplier && (
          <DropdownMenuItem asChild>
            <Link to="/app/dealer">
              <span className="mr-2 inline-grid size-4 place-items-center">
                <DealerMark size={16} />
              </span>
              {t("nav.dock_counter")}
            </Link>
          </DropdownMenuItem>
        )}
        {isSuper && (
          <DropdownMenuItem asChild>
            <Link
              to="/admin"
              className="font-semibold text-amber-200 focus:bg-rose-500/20 focus:text-amber-100"
            >
              <Shield className="mr-2 size-4 text-rose-300" />
              {t("admin.super.menu")}
            </Link>
          </DropdownMenuItem>
        )}
        {(isAdmin || isSuper) && (
          <DropdownMenuItem asChild>
            <Link to="/app/admin">
              <span className="mr-2 inline-grid size-4 place-items-center">
                <ControlTowerMark size={16} />
              </span>
              Control Tower
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/app/charter">
            <span className="mr-2 inline-grid size-4 place-items-center">
              <CharterMark size={16} />
            </span>
            {t("charter.menu")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2 size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
