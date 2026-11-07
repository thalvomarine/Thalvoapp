/**
 * Vercel Node serverless entry for THALVO AI HTTP chat.
 * Static SPA hosting cannot run `src/server.ts`; this restores POST/GET /api/chat.
 */
import { Readable } from "node:stream";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleChatRequest } from "../src/lib/thalvo-ai/chat-turn";

export const config = {
  maxDuration: 60,
};

function toWebRequest(req: VercelRequest): Request {
  const hostHeader = req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost";
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
  const protoHeader = req.headers["x-forwarded-proto"] ?? "https";
  const proto = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader;
  const url = new URL(req.url || "/api/chat", `${proto}://${host}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue;
    headers.set(key, Array.isArray(value) ? value.join(",") : value);
  }

  const method = (req.method || "GET").toUpperCase();
  let body: string | undefined;
  if (method !== "GET" && method !== "HEAD") {
    if (typeof req.body === "string") body = req.body;
    else if (req.body != null) body = JSON.stringify(req.body);
    else body = undefined;
  }

  return new Request(url, { method, headers, body });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const response = await handleChatRequest(toWebRequest(req));
    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === "transfer-encoding") return;
      res.setHeader(key, value);
    });

    if (!response.body) {
      res.end();
      return;
    }

    const nodeStream = Readable.fromWeb(
      response.body as import("node:stream/web").ReadableStream,
    );
    nodeStream.on("error", (error) => {
      console.error("[api/chat] stream", error instanceof Error ? error.name : "error");
      if (!res.headersSent) res.status(500).json({ error: "chat_unavailable" });
      else res.end();
    });
    nodeStream.pipe(res);
  } catch (error) {
    console.error("[api/chat]", error instanceof Error ? error.name : "error");
    if (!res.headersSent) res.status(500).json({ error: "chat_unavailable" });
  }
}
