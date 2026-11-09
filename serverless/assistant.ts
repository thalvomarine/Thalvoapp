/**
 * JSON assistant turn for the in-app FAB / chat panel on the static Vercel SPA.
 * createServerFn cannot run without a Node server; this endpoint replaces it.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { authenticateRequest, isAuthed } from "../src/lib/thalvo-ai/request-auth";
import { runEmbeddedTurn } from "../src/lib/thalvo-ai/embedded-turn";

export const config = {
  maxDuration: 60,
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const BodySchema = z.object({
  sessionId: z.string().regex(UUID_RE),
  lang: z.enum(["tr", "en"]).default("tr"),
  position: z
    .object({
      lat: z.number().finite(),
      lng: z.number().finite(),
    })
    .nullable()
    .optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().max(4000),
      }),
    )
    .min(1)
    .max(16),
  image: z
    .object({
      mediaType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
      dataUrl: z.string().max(6_000_000),
    })
    .optional(),
});

function toWebRequest(req: VercelRequest): Request {
  const hostHeader = req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost";
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
  const protoHeader = req.headers["x-forwarded-proto"] ?? "https";
  const proto = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader;
  const url = new URL(req.url || "/api/assistant", `${proto}://${host}`);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue;
    headers.set(key, Array.isArray(value) ? value.join(",") : value);
  }
  const method = (req.method || "POST").toUpperCase();
  const body =
    method === "GET" || method === "HEAD"
      ? undefined
      : typeof req.body === "string"
        ? req.body
        : JSON.stringify(req.body ?? {});
  return new Request(url, { method, headers, body });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if ((req.method || "").toUpperCase() === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if ((req.method || "").toUpperCase() !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  try {
    const auth = await authenticateRequest(toWebRequest(req));
    if (!isAuthed(auth)) {
      const body = await auth.json();
      res.status(auth.status).json(body);
      return;
    }

    let parsed: z.infer<typeof BodySchema>;
    try {
      parsed = BodySchema.parse(req.body);
    } catch {
      res.status(400).json({ error: "invalid_body" });
      return;
    }

    const messages = parsed.messages.filter(
      (message) => message.content.length > 0 || message.role === "user",
    );
    const result = await runEmbeddedTurn({
      supabase: auth.supabase,
      userId: auth.userId,
      sessionId: parsed.sessionId,
      lang: parsed.lang,
      position: parsed.position ?? null,
      messages,
      image: parsed.image,
    });
    res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "chat_unavailable";
    if (message === "ai_rate_limited") {
      res.status(429).json({ error: "ai_rate_limited" });
      return;
    }
    if (message === "ai_too_long" || message === "expected_user_message" || message === "invalid_image") {
      res.status(400).json({ error: message });
      return;
    }
    console.error("[api/assistant]", error instanceof Error ? error.name : "error");
    res.status(500).json({ error: "chat_unavailable" });
  }
}
