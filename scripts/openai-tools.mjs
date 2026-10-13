import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TOP_FIELDS = new Set([
  "formatVersion", "endpoint", "observedAt", "profile", "tradingMode", "contractHash", "tools",
]);
const TOOL_FIELDS = new Set([
  "name", "title", "description", "inputSchema", "outputSchema", "annotations",
]);
const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function validateOpenaiTools(repoRoot, { checkMarkdown = true } = {}) {
  const errors = [];
  let snapshot;
  try {
    snapshot = JSON.parse(fs.readFileSync(path.join(repoRoot, "docs/openai/tools.json"), "utf8"));
  } catch {
    return { errors: ["Cannot read or parse docs/openai/tools.json"], toolCount: 0 };
  }
  const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
  if (!object(snapshot)) return { errors: ["Snapshot must be an object"], toolCount: 0 };
  for (const key of Object.keys(snapshot)) if (!TOP_FIELDS.has(key)) errors.push(`Unexpected snapshot field: ${key}`);
  for (const key of TOP_FIELDS) if (!(key in snapshot)) errors.push(`Missing snapshot field: ${key}`);
  if (snapshot.formatVersion !== 1) errors.push("formatVersion must be 1");
  if (snapshot.endpoint !== "https://coinvest-chat.liquid.trade/mcp") errors.push("Unexpected endpoint");
  if (snapshot.profile !== "interactive-v1") errors.push("Unexpected profile");
  if (snapshot.tradingMode !== "trading-disabled-links-only") errors.push("Unexpected tradingMode");
  if (typeof snapshot.observedAt !== "string" || Number.isNaN(Date.parse(snapshot.observedAt))) errors.push("observedAt must be a valid timestamp");
  if (typeof snapshot.contractHash !== "string" || !/^[a-f0-9]{64}$/.test(snapshot.contractHash)) errors.push("contractHash must be a SHA-256 hex string");
  if (!Array.isArray(snapshot.tools)) return { errors: [...errors, "tools must be an array"], toolCount: 0 };
  const names = new Set();
  snapshot.tools.forEach((tool, index) => {
    const label = `tools[${index}]`;
    if (!object(tool)) { errors.push(`${label} must be an object`); return; }
    for (const key of Object.keys(tool)) if (!TOOL_FIELDS.has(key)) errors.push(`${label} has unexpected field: ${key}`);
    for (const field of ["name", "description", "inputSchema"]) if (!(field in tool)) errors.push(`${label} is missing ${field}`);
    if (typeof tool.name !== "string" || !tool.name.trim()) errors.push(`${label}.name must be nonempty`);
    else if (names.has(tool.name)) errors.push(`Duplicate tool name: ${tool.name}`);
    else names.add(tool.name);
    if (typeof tool.title !== "undefined" && typeof tool.title !== "string") errors.push(`${label}.title must be a string`);
    if (typeof tool.description !== "string" || !tool.description.trim()) errors.push(`${label}.description must be nonempty`);
    if (!object(tool.inputSchema)) errors.push(`${label}.inputSchema must be an object`);
    if (typeof tool.outputSchema !== "undefined" && !object(tool.outputSchema)) errors.push(`${label}.outputSchema must be an object`);
    if (typeof tool.annotations !== "undefined" && !object(tool.annotations)) errors.push(`${label}.annotations must be an object`);
  });
  if (!errors.length && checkMarkdown) {
    const markdownPath = path.join(repoRoot, "docs/openai/tools.md");
    try {
      if (fs.readFileSync(markdownPath, "utf8") !== renderOpenaiTools(snapshot)) {
        errors.push("docs/openai/tools.md is missing or out of date");
      }
    } catch {
      errors.push("docs/openai/tools.md is missing or out of date");
    }
  }
  return { errors, toolCount: snapshot.tools.length };
}

export function renderOpenaiTools(snapshot) {
  const lines = [
    "# OpenAI hosted MCP tools",
    "",
    `- Observed: ${snapshot.observedAt}`,
    `- Endpoint: ${snapshot.endpoint}`,
    `- Profile: ${snapshot.profile}`,
    `- Trading mode: ${snapshot.tradingMode}`,
    `- Contract hash: \`${snapshot.contractHash}\``,
    "",
    "This is the current observed catalog from an authenticated MCP tools/list response. It is not a historical comparison with the 1.0.0 package or an OpenAI portal approval snapshot. Hosted tool updates are handled through MCP scans. This reference documentation is not packed into the plugin ZIP.",
    "",
    `Tools (${snapshot.tools.length})`,
    "",
  ];
  for (const tool of snapshot.tools) {
    lines.push(`## ${tool.name}`);
    if (tool.title) lines.push("", `**Title:** ${tool.title}`);
    lines.push("", tool.description, "");
    for (const [label, value] of [["Input schema", tool.inputSchema], ["Output schema", tool.outputSchema], ["Annotations", tool.annotations]]) {
      if (typeof value === "undefined") continue;
      lines.push(`**${label}**`, "", "```json", JSON.stringify(value, null, 2), "```", "");
    }
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

function main() {
  const args = process.argv.slice(2);
  const check = args[0] === "--check";
  const rootArg = check ? args[1] : args[0];
  if (args.length > (check ? 2 : 1)) throw new Error("Usage: node scripts/openai-tools.mjs [--check] [repo-root]");
  const root = path.resolve(rootArg ?? DEFAULT_ROOT);
  const { errors, toolCount } = validateOpenaiTools(root, { checkMarkdown: check });
  if (errors.length) {
    console.error(errors.map((error) => `- ${error}`).join("\n"));
    process.exitCode = 1;
    return;
  }
  const snapshot = JSON.parse(fs.readFileSync(path.join(root, "docs/openai/tools.json"), "utf8"));
  const markdownPath = path.join(root, "docs/openai/tools.md");
  const markdown = renderOpenaiTools(snapshot);
  if (check) {
    if (!fs.existsSync(markdownPath) || fs.readFileSync(markdownPath, "utf8") !== markdown) {
      console.error("docs/openai/tools.md is missing or out of date");
      process.exitCode = 1;
      return;
    }
  } else {
    fs.writeFileSync(markdownPath, markdown);
  }
  console.log(`${check ? "Validated" : "Generated"} ${toolCount} OpenAI tool definitions`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
