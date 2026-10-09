import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { validateMusePackage } from "../scripts/muse-paper-only.mjs";

const repoRoot = resolve(import.meta.dirname, "..");
const packageDir = join(repoRoot, "plugins/co-invest-muse");

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "liquid-plugin-muse-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "plugins"), { recursive: true });
  mkdirSync(join(root, "schemas/agent-plugins"), { recursive: true });
  cpSync(packageDir, join(root, "plugins/co-invest-muse"), { recursive: true });
  cpSync(join(repoRoot, "schemas/agent-plugins"), join(root, "schemas/agent-plugins"), { recursive: true });
  return { root, dir: join(root, "plugins/co-invest-muse") };
}

function errorsFor(root) {
  return validateMusePackage(root).errors.join("\n");
}

function rewriteJson(path, mutate) {
  const value = JSON.parse(readFileSync(path, "utf8"));
  mutate(value);
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

test("discovers and validates Agent Plugins package outside Cursor marketplace", (t) => {
  const { root } = fixture(t);
  assert.deepEqual(validateMusePackage(root), { errors: [], packageCount: 1 });
});

test("rejects a missing or malformed Agent Plugins manifest", (t) => {
  const { root, dir } = fixture(t);
  rmSync(join(dir, "plugin.json"));
  assert.match(errorsFor(root), /plugin\.json: cannot parse Agent Plugins manifest/);
  writeFileSync(join(dir, "plugin.json"), "{ invalid JSON");
  assert.match(errorsFor(root), /plugin\.json: cannot parse Agent Plugins manifest/);
});

test("rejects parsed non-object Agent Plugins manifests", (t) => {
  for (const manifest of ["null", "[]", "\"plugin\""]) {
    const { root, dir } = fixture(t);
    writeFileSync(join(dir, "plugin.json"), `${manifest}\n`);
    assert.match(errorsFor(root), /plugin\.json: \(root\)/);
  }
});

test("rejects the all profile, extra query fields, URL credentials, and fragments", (t) => {
  for (const url of [
    "https://coinvest.liquid.trade/mcp",
    "https://coinvest.liquid.trade/mcp?",
    "https://coinvest.liquid.trade/mcp?profile=all",
    "https://coinvest.liquid.trade/mcp?profile=paper-only&mode=paper",
    "https://user:secret@coinvest.liquid.trade/mcp?profile=paper-only",
    "https://coinvest.liquid.trade/mcp?profile=paper-only#fragment",
  ]) {
    const { root, dir } = fixture(t);
    rewriteJson(join(dir, "mcp.json"), (config) => { config.mcpServers["Co-Invest"].url = url; });
    assert.match(errorsFor(root), /canonical streamable-http endpoint/);
  }
});

test("rejects extra servers, static credentials, and URL auth fields", (t) => {
  const { root, dir } = fixture(t);
  rewriteJson(join(dir, "mcp.json"), (config) => {
    config.mcpServers["Co-Invest"].headers = { Authorization: "Bearer placeholder-token" };
    config.mcpServers.Other = { type: "streamable-http", url: "https://example.test/mcp" };
  });
  const errors = errorsFor(root);
  assert.match(errors, /canonical streamable-http endpoint/);
  assert.match(errors, /possible credential or private key detected/);
});

test("rejects credential material in submission files", (t) => {
  const { root, dir } = fixture(t);
  writeFileSync(join(dir, "submission.md"), "reviewer token: sk_live_12345678901234567890\nclient_secret: 12345678901234567890\n");
  assert.match(errorsFor(root), /possible credential or private key detected/);
});

test("rejects missing per-tool example coverage", (t) => {
  const { root, dir } = fixture(t);
  rewriteJson(join(dir, "paper-only.examples.json"), (examples) => { delete examples.tools.analyze_market; });
  const errors = errorsFor(root);
  assert.match(errors, /missing or malformed representative case for "analyze_market"/);
  assert.match(errors, /examples SHA-256 does not match/);
});

test("rejects a changed contract profile or an out-of-scope tool", (t) => {
  const { root, dir } = fixture(t);
  rewriteJson(join(dir, "paper-only.contract.json"), (contract) => {
    contract.profile = "all";
    contract.bindings[0].definition.name = "disable_automated_trading";
  });
  const errors = errorsFor(root);
  assert.match(errors, /complete version 1 paper-only contract/);
  assert.match(errors, /outside the approved paper-only scope/);
  assert.match(errors, /contract SHA-256 does not match/);
});

test("validates the canonical contract hash separately from the copied-file digest", (t) => {
  const { root, dir } = fixture(t);
  rewriteJson(join(dir, "paper-only.source.json"), (source) => { source.contractHash = "0".repeat(64); });
  const errors = errorsFor(root);
  assert.match(errors, /contractHash does not match the copied contract/);
  assert.match(errors, /contractHash is not the reviewed paper-only profile hash/);
  assert.doesNotMatch(errors, /contract SHA-256 does not match the copied contract bytes/);
});

test("rejects a copied-file digest mismatch when the canonical contract hash is unchanged", (t) => {
  const { root, dir } = fixture(t);
  rewriteJson(join(dir, "paper-only.source.json"), (source) => { source.contractSha256 = "0".repeat(64); });
  const errors = errorsFor(root);
  assert.match(errors, /contract SHA-256 does not match the copied contract bytes/);
  assert.match(errors, /contract file SHA-256 is not the reviewed paper-only snapshot/);
  assert.doesNotMatch(errors, /contractHash does not match the copied contract/);
});

test("rejects reset if its sensitive direct-request boundary is weakened", (t) => {
  const { root, dir } = fixture(t);
  rewriteJson(join(dir, "paper-only.contract.json"), (contract) => {
    const reset = contract.bindings.find((binding) => binding.definition.name === "reset_paper_account");
    reset.approval = "none";
    reset.effects = ["account-read"];
  });
  const errors = errorsFor(root);
  assert.match(errors, /reset_paper_account must remain a direct-request paper-account write/);
  assert.match(errors, /contract SHA-256 does not match/);
});

test("requires the expanded tools and keeps shared preference writes separate from reads", (t) => {
  const { root, dir } = fixture(t);
  const contract = JSON.parse(readFileSync(join(dir, "paper-only.contract.json"), "utf8"));
  const names = contract.bindings.map((binding) => binding.definition.name);
  assert.equal(names.length, 45);
  for (const name of [
    "get_transaction_history", "show_portfolio_chart", "leaderboard_data", "leaderboard_rank",
    "edit_watchlist", "refer", "automated_trading_status",
  ]) assert.ok(names.includes(name), `${name} is in the pinned contract`);

  rewriteJson(join(dir, "paper-only.contract.json"), (value) => {
    const watchlist = value.bindings.find((binding) => binding.definition.name === "edit_watchlist");
    watchlist.effects = ["account-read"];
    watchlist.approval = "none";
    const leaderboard = value.bindings.find((binding) => binding.definition.name === "leaderboard_data");
    leaderboard.effects = ["market-read", "paper-perp-write"];
  });
  const errors = errorsFor(root);
  assert.match(errors, /tool "edit_watchlist" must declare the preference-write effect/);
  assert.match(errors, /edit_watchlist must remain a direct-request shared preference write/);
  assert.match(errors, /read-only utility "leaderboard_data" cannot declare a write effect/);
});

test("rejects duplicate tool identifiers in the pinned catalog", (t) => {
  const { root, dir } = fixture(t);
  rewriteJson(join(dir, "paper-only.contract.json"), (contract) => {
    contract.bindings[1].definition.name = contract.bindings[0].definition.name;
  });
  assert.match(errorsFor(root), /duplicate tool identifier/);
});

test("rejects symlink entries in the plugin package", (t) => {
  const { root, dir } = fixture(t);
  rmSync(join(dir, "README.md"));
  symlinkSync("submission.md", join(dir, "README.md"));
  assert.match(errorsFor(root), /symlinks are not allowed/);
});

test("rejects a symlinked Agent Plugins package root", (t) => {
  const { root, dir } = fixture(t);
  rmSync(dir, { recursive: true });
  symlinkSync(packageDir, dir, "dir");
  assert.match(errorsFor(root), /package root symlink is not allowed/);
});

test("rejects tool-reference changes that are not generated from the pinned sources", (t) => {
  const { root, dir } = fixture(t);
  const path = join(dir, "tools.md");
  writeFileSync(path, readFileSync(path, "utf8").replace("**Classification:** Read", "**Classification:** Write"));
  assert.match(errorsFor(root), /does not match deterministic generation/);
});

test("rejects a missing generated tool reference", (t) => {
  const { root, dir } = fixture(t);
  rmSync(join(dir, "tools.md"));
  assert.match(errorsFor(root), /tools\.md: required Muse package file is missing/);
});

test("validate-plugins attributes an issue to its file path when the message contains a colon and space", (t) => {
  const { root, dir } = fixture(t);
  for (const entry of ["skills", "schemas", "plugins", ".cursor-plugin"]) {
    cpSync(join(repoRoot, entry), join(root, entry), { recursive: true, force: true });
  }
  rewriteJson(join(dir, "paper-only.contract.json"), (contract) => {
    contract.bindings[0].definition.name = "bad: name";
  });
  let output = "";
  try {
    execFileSync(process.execPath, [join(repoRoot, "scripts/validate-plugins.mjs"), root], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (err) {
    output = err.stdout;
  }
  assert.match(output, /^ERROR: plugins\/co-invest-muse\/paper-only\.contract\.json: tool identifier "bad: name" is invalid$/m);
});
