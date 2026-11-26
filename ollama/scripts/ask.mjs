#!/usr/bin/env node
/**
 * Ask a local Ollama model about this repo.
 *
 *   node ollama/scripts/ask.mjs --print "cancel_own_call nerede?"
 *   node ollama/scripts/ask.mjs --model qwen2.5-coder:7b "soru"
 *
 * Read-only. Does not edit files or call Supabase.
 */
import { spawn } from "node:child_process";
import { collectHits, readSystem, renderPrompt } from "./lib.mjs";

function parseArgs(argv) {
  const opts = { print: false, model: process.env.THALVO_OLLAMA_MODEL || "thalvo", question: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--print") opts.print = true;
    else if (arg === "--model") {
      opts.model = argv[i + 1] ?? opts.model;
      i += 1;
    } else if (arg === "--help" || arg === "-h") opts.help = true;
    else opts.question.push(arg);
  }
  return opts;
}

function usage() {
  return [
    "Kullanım: node ollama/scripts/ask.mjs [--print] [--model AD] \"soru\"",
    "Model sırası: --model, THALVO_OLLAMA_MODEL, thalvo.",
    "Örnek: node ollama/scripts/ask.mjs --model qwen2.5-coder:7b \"Açık SOS hangi RPC ile iptal edilir?\"",
  ].join("\n");
}

function runOllama(model, prompt) {
  return new Promise((resolve) => {
    const child = spawn("ollama", ["run", model], { stdio: ["pipe", "inherit", "inherit"] });
    child.on("error", (error) => {
      console.error(`Ollama başlatılamadı (${error.message}). Yerelde \`ollama list\` çalışıyor mu?`);
      resolve(127);
    });
    child.on("close", (code) => resolve(code ?? 1));
    child.stdin.write(prompt);
    child.stdin.end();
  });
}

const opts = parseArgs(process.argv.slice(2));
if (opts.help || opts.question.length === 0) {
  console.error(usage());
  process.exit(opts.help ? 0 : 1);
}

const question = opts.question.join(" ").trim();
const system = await readSystem();
const { tokens, hits } = await collectHits(question);
const prompt = renderPrompt(question, system, tokens, hits);

if (opts.print) {
  process.stdout.write(prompt);
  process.exit(0);
}

const code = await runOllama(opts.model, prompt);
process.exit(code);
