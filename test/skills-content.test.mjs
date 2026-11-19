import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";
import { parse } from "yaml";
import { PACKAGE_PLATFORM, SKILL_REQUIRES, SKILL_SYNC_MAP } from "../scripts/sync-skills.mjs";

const repoRoot = resolve(import.meta.dirname, "..");
const readJson = (rel) => JSON.parse(readFileSync(join(repoRoot, rel), "utf8"));
const platforms = readJson("docs/listing-prompts.json").platforms;
const gates = readJson("docs/skill-gates.json");
const knownTools = new Set(Object.keys(gates));
const SECTIONS = ["## Workflow", "## Tools", "## Rules", "## If something is missing"];
const READ_ONLY = ["coinvest-research", "coinvest-portfolio-review", "coinvest-market-scan", "coinvest-earnings"];
const EXECUTORS = Object.keys(gates).filter((tool) => Object.values(gates[tool]).some((gate) => gate && gate.approval !== "none" && gate.approval !== "proposal-only"));

export function readSkill(root, name) {
  const raw = readFileSync(join(root, "skills", name, "SKILL.md"), "utf8");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  assert.ok(match, `${name}: frontmatter block is missing`);
  return { name, raw, meta: parse(match[1]), body: match[2] };
}

export function toolsNamed(text) {
  return new Set([...text.matchAll(/`([a-z_][a-z0-9_]*)`/g)].map((m) => m[1]).filter((token) => knownTools.has(token)));
}

export function skillProblems(skill) {
  const problems = [];
  const { name, meta, body, raw } = skill;
  if (meta.name !== name) problems.push("frontmatter name differs from the folder");
  if (meta.license !== "MIT") problems.push("license is not MIT");
  const description = String(meta.description ?? "");
  if (description.length < 250 || description.length > 1024) problems.push(`description is ${description.length} characters`);
  if (!description.includes("Triggers on:")) problems.push("description lacks Triggers on:");
  let cursor = 0;
  for (const heading of SECTIONS) {
    const at = body.indexOf(`\n${heading}\n`, cursor);
    if (at < 0) problems.push(`section "${heading}" is missing or out of order`);
    else cursor = at + heading.length;
  }
  if (body.length < 1800 || body.length > 6000) problems.push(`body is ${body.length} characters`);
  if (raw.includes(String.fromCharCode(0x2014))) problems.push("contains a long dash");
  if (/https?:\/\/|liquid\.trade/.test(raw)) problems.push("names an endpoint or URL");
  const host = raw.match(/\b(Computer|Grok|Cursor|ChatGPT|Claude|Muse|Perplexity|Codex)\b|\bMain\b/);
  if (host) problems.push(`names a host or endpoint: ${host[0]}`);
  const toolsSection = body.slice(body.indexOf("\n## Tools\n"), body.indexOf("\n## Rules\n"));
  const items = toolsSection.split("\n").filter((line) => line.startsWith("- "));
  if (items.length === 0) problems.push("Tools section has no items");
  for (const item of items) {
    const lead = item.match(/^- `([a-z_][a-z0-9_]*)`/);
    if (!lead) problems.push(`Tools item does not start with a tool name: ${item.slice(0, 40)}`);
    else if (!knownTools.has(lead[1])) problems.push(`unknown tool ${lead[1]}`);
  }
  const named = toolsNamed(raw);
  const takesConfirmed = [...named].some((tool) => Object.values(gates[tool]).some((gate) => gate?.confirmed));
  if (takesConfirmed && !raw.includes("confirmed=true")) problems.push("names a tool taking confirmed without the confirmed=true rule");
  if (READ_ONLY.includes(name)) {
    for (const tool of named) if (EXECUTORS.includes(tool) && tool !== "edit_watchlist") problems.push(`read-only skill names state-changing tool ${tool}`);
  }
  return problems;
}

const workflowSkills = Object.keys(SKILL_REQUIRES);
const skills = workflowSkills.map((name) => readSkill(repoRoot, name));

test("root skills are exactly the base skill and the mapped workflow skills", () => {
  const folders = readdirSync(join(repoRoot, "skills")).sort();
  assert.deepEqual(folders, ["coinvest", ...workflowSkills].sort());
});

test("every workflow skill follows the shared format and gate wording", () => {
  for (const skill of skills) assert.deepEqual(skillProblems(skill), [], skill.name);
});

test("a skill is bundled only where every tool its Tools section leads with could be served", () => {
  for (const skill of skills) {
    const packages = Object.entries(SKILL_SYNC_MAP).filter(([, names]) => names.includes(skill.name));
    assert.ok(packages.length > 0, `${skill.name} is bundled nowhere`);
    for (const tool of toolsNamed(skill.raw)) {
      assert.ok(packages.some(([pkg]) => platforms[PACKAGE_PLATFORM[pkg]].tools.includes(tool)), `${skill.name} names ${tool}, which none of its packages serve`);
    }
  }
});

test("every tool a package's endpoint serves is named by a skill bundled with it", () => {
  for (const [pkg, names] of Object.entries(SKILL_SYNC_MAP)) {
    const named = new Set(names.filter((name) => name !== "coinvest").flatMap((name) => [...toolsNamed(readSkill(repoRoot, name).raw)]));
    const missing = platforms[PACKAGE_PLATFORM[pkg]].tools.filter((tool) => tool !== "help" && !named.has(tool));
    assert.deepEqual(missing, [], `${pkg}: tools with no bundled skill`);
  }
});

test("the format check rejects each kind of defect", () => {
  const good = skills.find((skill) => skill.name === "coinvest-trailing-stops");
  const mutate = (change) => {
    const raw = change(good.raw);
    const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    return skillProblems({ name: good.name, raw, meta: parse(match[1]), body: match[2] }).join("; ");
  };
  assert.match(mutate((raw) => raw.replace("## Rules", "## Guidance")), /section "## Rules"/);
  assert.match(mutate((raw) => raw.replace("- `set_trailing_stop`", "- `set_trailing_halt`")), /unknown tool set_trailing_halt/);
  assert.match(mutate((raw) => raw.replaceAll("confirmed=true", "confirmed")), /confirmed=true rule/);
  assert.match(mutate((raw) => `${raw}\nUse https://coinvest.liquid.trade here.\n`), /endpoint or URL/);
  assert.match(mutate((raw) => `${raw}\nOn Grok this differs.\n`), /names a host or endpoint: Grok/);
  assert.match(mutate((raw) => raw.replace(/Triggers on:/, "Use for:")), /lacks Triggers on:/);
});
