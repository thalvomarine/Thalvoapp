#!/usr/bin/env node
/**
 * Multi-turn local chat. Ollama stays open; this script remembers the
 * conversation and attaches matching Thalvo source on each turn.
 *
 *   node ollama/scripts/chat.mjs --model qwen2.5:14b
 *
 * Type /cik to leave. The model reads the repo. It does not edit files.
 */
import readline from "node:readline";
import { collectHits, readSystem } from "./lib.mjs";

const HOST = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";

export function trimHistory(history, max = 8) {
  if (history.length <= max) return history;
  return history.slice(-max);
}

export function userTurn(question, hits) {
  const blocks = hits
    .filter((hit) => hit.excerpt)
    .map((hit) => `## ${hit.path}\n${hit.excerpt}`)
    .join("\n\n");
  const source = blocks || "(Bu tur için dosya penceresi yok. Emin değilsen dosya adını söyle.)";
  return `# Kaynak\n${source}\n\n# Soru\n${String(question).trim()}`;
}

function parseArgs(argv) {
  let model = process.env.THALVO_OLLAMA_MODEL || "qwen2.5:14b";
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--model" && argv[i + 1]) {
      model = argv[i + 1];
      i += 1;
    }
  }
  return { model };
}

async function reply(model, messages) {
  let response;
  try {
    response = await fetch(`${HOST}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, stream: true }),
    });
  } catch (error) {
    throw new Error(`Ollama kapalı (${error.message}). Saat yanındaki simgeyi aç, sonra bu sohbeti yeniden başlat.`);
  }
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Ollama ${response.status}: ${detail.slice(0, 400)}`);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      let payload;
      try {
        payload = JSON.parse(trimmed);
      } catch {
        continue;
      }
      if (payload.error) throw new Error(payload.error);
      const piece = payload.message?.content ?? "";
      if (piece) {
        process.stdout.write(piece);
        full += piece;
      }
    }
  }
  process.stdout.write("\n");
  return full.trim();
}

async function main() {
  const { model } = parseArgs(process.argv.slice(2));
  const system = await readSystem();
  const history = [];
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log(`Thalvo sohbeti. Model: ${model}`);
  console.log("Yaz ve Enter'a bas. Bitirmek için /cik");
  console.log("Bu pencere kodu okur ve cevaplar. Dosyayı değiştirmez.");

  const ask = () => {
    rl.question("\nsen> ", async (line) => {
      const text = line.trim();
      if (!text) {
        ask();
        return;
      }
      if (text === "/cik" || text === "/exit" || text === "/quit") {
        rl.close();
        return;
      }
      try {
        const { hits } = await collectHits(text);
        const messages = [
          {
            role: "system",
            content: `${system.trim()}\n\nSohbet sürüyor. Cevabı kullanıcının dilinde ver. Dosya yolu yaz. Dosya değiştirmezsin; yapılacak işi hangi dosyada tarif et.`,
          },
          ...trimHistory(history),
          { role: "user", content: userTurn(text, hits) },
        ];
        process.stdout.write("\n");
        const answer = await reply(model, messages);
        history.push({ role: "user", content: text });
        history.push({ role: "assistant", content: answer });
      } catch (error) {
        console.error(`\n${error.message}`);
      }
      ask();
    });
  };

  rl.on("close", () => process.exit(0));
  ask();
}

const isDirect = process.argv[1] && process.argv[1].endsWith("chat.mjs");
if (isDirect) await main();
