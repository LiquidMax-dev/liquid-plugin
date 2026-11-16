import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { validatePerplexityPackage } from "../scripts/perplexity-package.mjs";

const repoRoot = resolve(import.meta.dirname, "..");

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "liquid-plugin-perplexity-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "plugins"), { recursive: true });
  mkdirSync(join(root, "schemas"), { recursive: true });
  cpSync(join(repoRoot, "plugins/co-invest-perplexity"), join(root, "plugins/co-invest-perplexity"), { recursive: true });
  cpSync(join(repoRoot, "schemas"), join(root, "schemas"), { recursive: true });
  cpSync(join(repoRoot, "skills/coinvest"), join(root, "skills/coinvest"), { recursive: true });
  return { root, dir: join(root, "plugins/co-invest-perplexity") };
}

function errorsFor(root) {
  return validatePerplexityPackage(root).errors.join("\n");
}

function rewriteJson(path, mutate) {
  const value = JSON.parse(readFileSync(path, "utf8"));
  mutate(value);
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

test("the repository's Perplexity package validates clean", () => {
  assert.deepEqual(validatePerplexityPackage(repoRoot), { errors: [], packageCount: 1 });
});

test("rejects a profile query on the endpoint", (t) => {
  const { root, dir } = fixture(t);
  rewriteJson(join(dir, "mcp.json"), (v) => { v.mcpServers["Co-Invest"].url += "?profile=all"; });
  assert.match(errorsFor(root), /mcp\.json: mcpServers must contain only the streamable-http endpoint/);
});

test("rejects the standard endpoint", (t) => {
  const { root, dir } = fixture(t);
  rewriteJson(join(dir, "mcp.json"), (v) => { v.mcpServers["Co-Invest"].url = "https://coinvest.liquid.trade/mcp"; });
  assert.match(errorsFor(root), /mcp\.json: mcpServers must contain only the streamable-http endpoint/);
});

test("rejects a second server", (t) => {
  const { root, dir } = fixture(t);
  rewriteJson(join(dir, "mcp.json"), (v) => { v.mcpServers.Other = { type: "streamable-http", url: "https://example.com/mcp" }; });
  assert.match(errorsFor(root), /mcp\.json: mcpServers must contain only/);
});

test("rejects an added skill file", (t) => {
  const { root, dir } = fixture(t);
  mkdirSync(join(dir, "skills/x"), { recursive: true });
  writeFileSync(join(dir, "skills/x/SKILL.md"), "---\nname: x\n---\n");
  assert.match(errorsFor(root), /skills.*outside the reviewed Perplexity package scope/);
});

test("rejects a changed name", (t) => {
  const { root, dir } = fixture(t);
  rewriteJson(join(dir, "plugin.json"), (v) => { v.name = "co-invest-other"; });
  assert.match(errorsFor(root), /plugin\.json: name must be "co-invest"/);
});

test("rejects a changed version", (t) => {
  const { root, dir } = fixture(t);
  rewriteJson(join(dir, "plugin.json"), (v) => { v.version = "1.0.3"; });
  assert.match(errorsFor(root), /plugin\.json: version must be "1\.0\.2"/);
});

test("rejects a missing package folder", (t) => {
  const { root, dir } = fixture(t);
  rmSync(dir, { recursive: true });
  assert.match(errorsFor(root), /plugins\/co-invest-perplexity: package folder is missing/);
});

test("rejects a missing bundled skill file", (t) => {
  const { root, dir } = fixture(t);
  rmSync(join(dir, "skills/coinvest/SKILL.md"));
  assert.match(errorsFor(root), /skills\/coinvest\/SKILL\.md: required Perplexity package file is missing/);
});
