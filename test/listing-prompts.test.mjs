import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..");
const readJson = (rel) => JSON.parse(readFileSync(join(repoRoot, rel), "utf8"));
const listing = readJson("docs/listing-prompts.json");
const platforms = Object.entries(listing.platforms);

const descriptions = {
  cursor: readJson("plugins/co-invest/.cursor-plugin/plugin.json").description,
  grok: readJson("plugins/co-invest-grok/.cursor-plugin/plugin.json").description,
  perplexity: readJson("plugins/co-invest-perplexity/plugin.json").description,
  muse: readJson("plugins/co-invest-muse/plugin.json").description,
  chatgpt: readJson("plugins/co-invest-openai/.codex-plugin/plugin.json").description,
};

test("covers every platform with 6 to 10 unique prompts", () => {
  assert.deepEqual(Object.keys(listing.platforms).sort(), ["chatgpt", "claude", "cursor", "grok", "muse", "perplexity"]);
  for (const [id, platform] of platforms) {
    const texts = platform.prompts.map((prompt) => prompt.text);
    assert.ok(texts.length >= 6 && texts.length <= 10, `${id} has ${texts.length} prompts`);
    assert.equal(new Set(texts).size, texts.length, `${id} repeats a prompt`);
  }
});

test("every prompt relies only on tools its platform serves", () => {
  for (const [id, platform] of platforms) {
    const tools = new Set(platform.tools);
    for (const prompt of platform.prompts) {
      assert.ok(prompt.tools.length > 0, `${id}: "${prompt.text}" names no tool`);
      for (const tool of prompt.tools) assert.ok(tools.has(tool), `${id}: "${prompt.text}" relies on ${tool}, which ${platform.catalog} does not serve`);
    }
  }
});

test("every prompt appears verbatim in its platform's README", () => {
  for (const [id, platform] of platforms) {
    const lines = new Set(readFileSync(join(repoRoot, platform.readme), "utf8").split("\n"));
    for (const prompt of platform.prompts) assert.ok(lines.has(`- ${prompt.text}`), `${id}: ${platform.readme} lacks "${prompt.text}"`);
  }
});

test("tokenized stocks are offered only where execute_spot_order exists, and options nowhere", () => {
  for (const [id, platform] of platforms) {
    const copy = [...platform.prompts.map((prompt) => prompt.text), descriptions[id] ?? ""];
    const hasSpot = platform.tools.includes("execute_spot_order");
    for (const text of copy) {
      assert.doesNotMatch(text, /\boptions?\b/i, `${id}: "${text}" mentions options`);
      if (!hasSpot) assert.doesNotMatch(text, /tokeni[sz]ed/i, `${id}: "${text}" offers tokenized stocks without execute_spot_order`);
    }
  }
});

test("ChatGPT and Muse tool lists stay inside this repository's pinned snapshots", () => {
  const openaiPinned = new Set(readJson("docs/openai/tools.json").tools.map((tool) => tool.name));
  const musePinned = new Set(readJson("plugins/co-invest-muse/paper-only.contract.json").bindings.map((binding) => binding.definition.name));
  for (const tool of listing.platforms.chatgpt.tools) assert.ok(openaiPinned.has(tool), `chatgpt lists ${tool}, absent from docs/openai/tools.json`);
  for (const tool of listing.platforms.muse.tools) assert.ok(musePinned.has(tool), `muse lists ${tool}, absent from paper-only.contract.json`);
});

test("a direct-execution platform's description promises no preview or approval step", () => {
  for (const [id, platform] of platforms) {
    assert.match(platform.orderGate, /^(direct|chat-approval|card-or-chat-approval|liquid-review-link|chat-approval-simulated)$/, `${id} orderGate`);
    if (platform.orderGate === "direct") assert.doesNotMatch(descriptions[id], /previews?\b|only after you approve/i, `${id}: description promises an approval step its endpoint lacks`);
  }
});

test("tool lists match the liquid-mcp catalogs at the recorded revision", { skip: process.env.LIQUID_MCP_ROOT ? false : "set LIQUID_MCP_ROOT to a liquid-mcp checkout" }, () => {
  for (const [id, platform] of platforms) {
    const raw = execFileSync("git", ["-C", process.env.LIQUID_MCP_ROOT, "show", `${listing.sourceRevision}:generated/${platform.catalog}.json`], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    const served = new Set(JSON.parse(raw).bindings.map((binding) => binding.definition.name));
    for (const tool of platform.tools) assert.ok(served.has(tool), `${id} lists ${tool}, absent from ${platform.catalog}`);
    if (id !== "chatgpt" && id !== "muse") assert.equal(platform.tools.length, served.size, `${id} tool count differs from ${platform.catalog}`);
  }
});

test("OpenAI starter prompts come from the ChatGPT list", () => {
  const texts = new Set(listing.platforms.chatgpt.prompts.map((prompt) => prompt.text));
  const starters = readJson("plugins/co-invest-openai/.codex-plugin/plugin.json").interface.defaultPrompt;
  assert.equal(starters.length, 3);
  for (const starter of starters) assert.ok(texts.has(starter), `starter prompt "${starter}" is not in docs/listing-prompts.json`);
});
