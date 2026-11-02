/**
 * Shared bottom-sheet chrome helpers for cockpit drawers
 * (cart, service offers, filter sheets).
 */

import { useEffect, useRef, type ReactNode } from "react";
import { pushNativeBackHandler } from "@/lib/native-app";

/** Escape + body scroll lock + native Android back closes the sheet. */
export function useSheetChrome(onClose: () => void, active = true): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!active || typeof document === "undefined") return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const close = () => onCloseRef.current();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const releaseBack = pushNativeBackHandler(() => {
      close();
      return true;
    });

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      releaseBack();
    };
  }, [active]);
}

export const SHEET_SCRIM =
  "fixed inset-0 z-[80] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center";

export const SHEET_PANEL =
  "thalvo-dark flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#071422] text-white shadow-2xl sm:mx-auto sm:max-w-lg sm:rounded-3xl";

export function SheetHandle(): ReactNode {
  return (
    <div className="flex shrink-0 justify-center pb-1 pt-3 sm:hidden" aria-hidden>
      <span className="h-1 w-10 rounded-full bg-white/25" />
    </div>
  );
}
