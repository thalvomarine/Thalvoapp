import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { CheckoutModal } from "@/components/CheckoutModal";
import { formatTL } from "@/lib/filter";
import { useCart } from "@/lib/cart";
import { Trash2, Plus, Minus, Package } from "lucide-react";
import { DeliveryMethodSelector } from "@/components/orders/DeliveryMethodSelector";
import { OrderSecurityNotice } from "@/components/orders/OrderSecurityNotice";
import { toast } from "sonner";
import { emitEvent } from "@/lib/events";
import { sanitizeMultiline, sanitizePlainText } from "@/lib/sanitize";
import { SHEET_PANEL, SHEET_SCRIM, SheetHandle, useSheetChrome } from "@/lib/sheet-chrome";

interface Props {
  onClose: () => void;
  /** Called after an OUT_OF_STOCK checkout error so callers can refetch. */
  onCatalogReload?: () => void;
}

/**
 * CartSheet — shared marketplace cart drawer. Extracted from app.shop.tsx.
 * Escape / body-lock / native back via sheet-chrome.
 */
export function CartSheet({ onClose, onCatalogReload }: Props) {
  const { t } = useTranslation();
  const cart = useCart();
  const [marina, setMarina] = useState("Göcek");
  const [pay, setPay] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<"marina_pickup" | "service_boat">("service_boat");
  const [dropOff, setDropOff] = useState("");
  const [notes, setNotes] = useState("");
  const [vessels, setVessels] = useState<{ id: string; boat_name: string | null }[]>([]);
  const [vesselId, setVesselId] = useState<string>("");
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  useSheetChrome(onClose);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid) return;
      supabase.from("vessels").select("id, boat_name:name").eq("owner_id", uid).then(({ data: v }) => {
        const rows = (v as never as { id: string; boat_name: string | null }[]) ?? [];
        setVessels(rows);
        if (rows[0]) setVesselId(rows[0].id);
      });
    });
  }, []);

  const etaMinutes = deliveryMethod === "marina_pickup" ? 30 : 90;

  const doCheckout = async () => {
    const { data, error } = await supabase.rpc("checkout_parts_cart", {
      _items: cart.items.map((i) => ({ part_id: i.part_id, qty: i.qty })),
      _delivery_marina: sanitizePlainText(marina, 80),
      _vessel_id: vesselId || undefined,
      _delivery_method: deliveryMethod,
      _delivery_eta_minutes: etaMinutes,
      _delivery_location_label: sanitizePlainText(dropOff, 120) || undefined,
      _notes: sanitizeMultiline(notes, 500) || undefined,
    });
    if (error) {
      if (/OUT_OF_STOCK/i.test(error.message)) {
        toast.error(t("shop.out_of_stock_toast"));
        onCatalogReload?.();
      } else {
        toast.error(error.message);
      }
      return;
    }
    const raw = data as string[] | string | null;
    const orderIds = Array.isArray(raw) ? raw.filter(Boolean) : raw ? [raw] : [];
    if (orderIds.length === 0) {
      toast.error(t("shop.order_failed"));
      return;
    }
    for (const orderId of orderIds) {
      emitEvent({
        type: "order.submitted",
        subject_type: "order",
        subject_id: orderId,
        metadata: {
          item_count: cart.items.length,
          delivery_method: deliveryMethod,
          marina,
          order_count: orderIds.length,
        },
      });
    }
    cart.clear();
    toast.success(orderIds.length > 1 ? t("shop.orders_placed", { count: orderIds.length }) : t("shop.order_placed"));
    setPay(false);
    setPlacedOrderId(orderIds[0] ?? "new");
  };

  if (placedOrderId) {
    return (
      <div className={SHEET_SCRIM + " p-4"} onClick={onClose}>
        <div
          className="thalvo-dark w-full max-w-md space-y-4 rounded-3xl border border-white/10 bg-[#071422] p-6 text-center shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-lg font-semibold tracking-tight text-white">{t("shop_cart.order_submitted")}</p>
          <p className="text-sm leading-relaxed text-white/60">{t("shop_cart.order_submitted_body")}</p>
          <Link
            to="/app/orders"
            onClick={onClose}
            className="grid h-12 w-full place-items-center rounded-2xl bg-sky-500 text-sm font-semibold tracking-tight text-slate-900 transition-colors hover:bg-amber-400"
          >
            {t("shop_cart.open_order_tracking")}
          </Link>
          <button onClick={onClose} className="text-xs text-white/50 hover:text-white/70">
            {t("common.close")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={SHEET_SCRIM} onClick={onClose}>
      <div className={SHEET_PANEL + " border-amber-500/20"} onClick={(e) => e.stopPropagation()}>
        <SheetHandle />
        <div className="flex items-center justify-between border-b border-white/10 px-5 pb-3 pt-2 sm:pt-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
              {t("shop_cart.header_eyebrow")}
            </p>
            <p className="mt-0.5 text-base font-semibold tracking-tight text-white">{t("shop.cart")}</p>
          </div>
          <button onClick={onClose} className="px-2 py-1 text-xs text-white/50 hover:text-white/80">
            {t("common.close")}
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {cart.items.length === 0 ? (
            <p className="py-12 text-center text-sm text-white/50">{t("shop.empty_cart")}</p>
          ) : (
            <>
              <ul className="space-y-2">
                {cart.items.map((i) => (
                  <li key={i.part_id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    {i.image_url ? (
                      <img src={i.image_url} alt="" className="size-14 rounded-xl border border-white/10 object-cover" />
                    ) : (
                      <div className="grid size-14 place-items-center rounded-xl border border-white/10 bg-white/5">
                        <Package className="size-5 text-white/30" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold leading-tight text-white">{i.name}</p>
                      <p className="mt-0.5 text-xs tabular-nums text-white/50">{formatTL(i.price)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => cart.setQty(i.part_id, i.qty - 1)}
                        className="grid size-8 place-items-center rounded-full border border-white/10 bg-white/5 text-white/80 transition-colors hover:bg-white/10"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold tabular-nums text-white">{i.qty}</span>
                      <button
                        onClick={() => cart.setQty(i.part_id, i.qty + 1)}
                        className="grid size-8 place-items-center rounded-full border border-white/10 bg-white/5 text-white/80 transition-colors hover:bg-white/10"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => cart.remove(i.part_id)}
                      aria-label={t("common.remove")}
                      className="grid size-8 place-items-center rounded-full text-white/40 transition-colors hover:bg-white/5 hover:text-rose-300"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>

              <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                    {t("shop_cart.delivery_method")}
                  </label>
                  <div className="mt-2">
                    <DeliveryMethodSelector value={deliveryMethod} onChange={setDeliveryMethod} />
                  </div>
                </div>

                {vessels.length > 0 && (
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                      {t("shop_cart.destination_vessel")}
                    </label>
                    <select
                      value={vesselId}
                      onChange={(e) => setVesselId(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-amber-400/60"
                    >
                      {vessels.map((v) => (
                        <option key={v.id} value={v.id} className="bg-slate-900">
                          {v.boat_name ?? t("shop_cart.vessel_fallback")}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                    {t("shop_cart.marina")}
                  </label>
                  <input
                    value={marina}
                    onChange={(e) => setMarina(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-amber-400/60"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                    {deliveryMethod === "marina_pickup" ? t("shop_cart.pickup_point") : t("shop_cart.berth_label")}
                  </label>
                  <input
                    value={dropOff}
                    onChange={(e) => setDropOff(e.target.value)}
                    placeholder={
                      deliveryMethod === "marina_pickup"
                        ? t("shop_cart.pickup_placeholder")
                        : t("shop_cart.berth_placeholder")
                    }
                    className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-amber-400/60"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                    {t("shop_cart.operational_notes")}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder={t("shop_cart.notes_placeholder")}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-amber-400/60"
                  />
                </div>

                <OrderSecurityNotice compact />
              </div>
            </>
          )}
        </div>

        {cart.items.length > 0 && (
          <div className="space-y-3 border-t border-white/10 bg-[#06101c] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>{t("shop_cart.eta")}</span>
              <span className="tabular-nums">
                ~{etaMinutes} {t("common.min")}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
                {t("common.amount")}
              </span>
              <span className="text-2xl font-semibold tracking-tight tabular-nums text-white">
                {formatTL(cart.total)}
              </span>
            </div>
            <button
              onClick={() => setPay(true)}
              className="h-12 w-full rounded-2xl bg-sky-500 text-sm font-semibold tracking-tight text-slate-900 transition-colors hover:bg-amber-400"
            >
              {t("shop_cart.confirm_order")}
            </button>
            <p className="text-center text-[10px] leading-relaxed text-white/40">{t("shop.commission_note")}</p>
          </div>
        )}
        {pay && (
          <CheckoutModal
            open
            amount={cart.total}
            title={t("shop.checkout")}
            subtitle={marina}
            tone="amber"
            cta={t("shop.checkout")}
            onClose={() => setPay(false)}
            onPaid={doCheckout}
          />
        )}
      </div>
    </div>
  );
}
