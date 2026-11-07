/**
 * Browser → Vercel `/api/assistant` client for the static SPA deploy.
 * TanStack createServerFn cannot run when Vercel only serves `dist/`.
 */
import { supabase } from "@/integrations/supabase/client";
import type { EmbeddedTurnResult } from "@/lib/thalvo-ai/embedded-turn";

export interface AssistantAskInput {
  sessionId: string;
  lang: "tr" | "en";
  position?: { lat: number; lng: number } | null;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  image?: {
    mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
    dataUrl: string;
  };
}

async function bearerToken(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) throw new Error("unauthorized");
  return data.session.access_token;
}

export async function askAssistantHttp(input: AssistantAskInput): Promise<EmbeddedTurnResult> {
  const token = await bearerToken();
  const response = await fetch("/api/assistant", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  });

  const raw = await response.text();
  let parsed: unknown = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    const err =
      parsed && typeof parsed === "object" && parsed !== null && "error" in parsed
        ? String((parsed as { error: unknown }).error)
        : `assistant_http_${response.status}`;
    throw new Error(err);
  }

  return parsed as EmbeddedTurnResult;
}

export async function loadChatHttp(
  sessionId: string,
): Promise<Array<{ id: string; role: "user" | "assistant"; content: string }>> {
  const token = await bearerToken();
  const response = await fetch(`/api/chat?sessionId=${encodeURIComponent(sessionId)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  const raw = await response.text();
  let parsed: unknown = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }
  if (!response.ok) {
    const err =
      parsed && typeof parsed === "object" && parsed !== null && "error" in parsed
        ? String((parsed as { error: unknown }).error)
        : `chat_http_${response.status}`;
    throw new Error(err);
  }
  const messages =
    parsed && typeof parsed === "object" && parsed !== null && "messages" in parsed
      ? (parsed as { messages: Array<{ id: string; role: "user" | "assistant"; parts?: Array<{ type: string; text?: string }> }> }).messages
      : [];
  return (messages ?? []).map((message) => ({
    id: message.id,
    role: message.role,
    content:
      message.parts
        ?.filter((part) => part.type === "text")
        .map((part) => part.text ?? "")
        .join("") ?? "",
  }));
}
