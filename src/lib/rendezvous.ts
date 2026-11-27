/** How the master reaches the boat. The fee stays inside the escrow total. */
export type RendezvousMode = "own_boat" | "pickup" | "marina";

export interface Rendezvous {
  mode: RendezvousMode;
  fee: number;
  point: string;
  note: string;
}

const PREFIX = "THALVO_MEET:";

export function encodeRendezvous(input: Rendezvous): string {
  const fee = Number.isFinite(input.fee) && input.fee > 0 ? Math.round(input.fee) : 0;
  const point = input.point.replace(/[:\n]/g, " ").trim().slice(0, 80);
  const head = `${PREFIX}${input.mode}:${fee}:${point}`;
  const note = input.note.trim();
  return note ? `${head}\n${note}` : head;
}

export function decodeRendezvous(raw: string | null | undefined): Rendezvous {
  const text = (raw ?? "").trim();
  const [first, ...rest] = text.split("\n");
  if (!first?.startsWith(PREFIX)) {
    return { mode: "own_boat", fee: 0, point: "", note: text };
  }
  const body = first.slice(PREFIX.length);
  const [modeRaw, feeRaw, ...pointParts] = body.split(":");
  const mode: RendezvousMode =
    modeRaw === "pickup" || modeRaw === "marina" || modeRaw === "own_boat" ? modeRaw : "own_boat";
  const fee = Number(feeRaw);
  return {
    mode,
    fee: Number.isFinite(fee) && fee > 0 ? fee : 0,
    point: pointParts.join(":").trim(),
    note: rest.join("\n").trim(),
  };
}

/** Labor plus the master's own-boat fee. Pickup and marina add nothing. */
export function escrowTotal(labor: number, meet: Pick<Rendezvous, "mode" | "fee">): number {
  const base = Number.isFinite(labor) && labor > 0 ? labor : 0;
  const fee = meet.mode === "own_boat" && meet.fee > 0 ? meet.fee : 0;
  return base + fee;
}
