import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { validateOpenaiTools } from "../scripts/openai-tools.mjs";

const repoRoot = resolve(import.meta.dirname, "..");
const checker = join(repoRoot, "scripts/openai-tools.mjs");

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "liquid-openai-tools-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const docs = join(root, "docs/openai");
  mkdirSync(docs, { recursive: true });
  cpSync(join(repoRoot, "docs/openai/tools.json"), join(docs, "tools.json"));
  cpSync(join(repoRoot, "docs/openai/tools.md"), join(docs, "tools.md"));
  return { root, snapshotPath: join(docs, "tools.json"), markdownPath: join(docs, "tools.md") };
}

function rewriteSnapshot(path, mutate) {
  const snapshot = JSON.parse(readFileSync(path, "utf8"));
  mutate(snapshot);
  writeFileSync(path, `${JSON.stringify(snapshot, null, 2)}\n`);
}

function errorsFor(root) {
  return validateOpenaiTools(root).errors.join("\n");
}

test("validates the sanitized tool snapshot and reports its tool count", (t) => {
  const { root } = fixture(t);
  const snapshot = JSON.parse(readFileSync(join(root, "docs/openai/tools.json"), "utf8"));
  assert.deepEqual(validateOpenaiTools(root), { errors: [], toolCount: snapshot.tools.length });
});

test("does not echo malformed snapshot contents into validation errors", (t) => {
  const { root, snapshotPath } = fixture(t);
  writeFileSync(snapshotPath, '{"private":"SYNTHETIC_SECRET_MARKER_1234567890"');
  const errors = errorsFor(root);
  assert.match(errors, /Cannot read or parse docs\/openai\/tools\.json/);
  assert.doesNotMatch(errors, /SYNTHETIC_SECRET_MARKER_1234567890/);
});

test("rejects duplicate tool names and missing descriptions", (t) => {
  const duplicate = fixture(t);
  rewriteSnapshot(duplicate.snapshotPath, (snapshot) => {
    snapshot.tools[1].name = snapshot.tools[0].name;
  });
  assert.match(errorsFor(duplicate.root), /Duplicate tool name:/);

  const missingDescription = fixture(t);
  rewriteSnapshot(missingDescription.snapshotPath, (snapshot) => {
    delete snapshot.tools[0].description;
  });
  const errors = errorsFor(missingDescription.root);
  assert.match(errors, /tools\[0\] is missing description/);
  assert.match(errors, /tools\[0\]\.description must be nonempty/);
});

test("rejects confidential or unapproved tool fields", (t) => {
  const { root, snapshotPath } = fixture(t);
  rewriteSnapshot(snapshotPath, (snapshot) => {
    snapshot.tools[0].accessToken = "synthetic-placeholder-token";
  });
  assert.match(errorsFor(root), /tools\[0\] has unexpected field: accessToken/);
});

test("rejects an unexpected endpoint or profile and trading mode", (t) => {
  const { root, snapshotPath } = fixture(t);
  rewriteSnapshot(snapshotPath, (snapshot) => {
    snapshot.endpoint = "https://example.invalid/mcp";
    snapshot.profile = "admin";
    snapshot.tradingMode = "trading-enabled";
  });
  const errors = errorsFor(root);
  assert.match(errors, /Unexpected endpoint/);
  assert.match(errors, /Unexpected profile/);
  assert.match(errors, /Unexpected tradingMode/);
});

test("validation detects rendered Markdown drift and CLI generation repairs it", (t) => {
  const { root, markdownPath } = fixture(t);
  const stale = readFileSync(markdownPath, "utf8").replace("# OpenAI hosted MCP tools", "# Stale OpenAI tools");
  writeFileSync(markdownPath, stale);
  assert.match(errorsFor(root), /docs\/openai\/tools\.md is missing or out of date/);

  execFileSync("node", [checker, root], { encoding: "utf8" });
  assert.deepEqual(validateOpenaiTools(root).errors, []);
  assert.notEqual(readFileSync(markdownPath, "utf8"), stale);
});
