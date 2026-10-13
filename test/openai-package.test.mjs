import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { validateOpenaiPackage } from "../scripts/openai-package.mjs";

const repoRoot = resolve(import.meta.dirname, "..");
const packageDir = join(repoRoot, "plugins/co-invest-openai");
const builder = join(repoRoot, "scripts/package-openai.py");
const allowlist = ["CHANGELOG.md", "LICENSE", "README.md", "assets/logo.svg", "mcp.json", "plugin.json"];

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "liquid-plugin-openai-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "plugins"), { recursive: true });
  mkdirSync(join(root, "schemas/agent-plugins"), { recursive: true });
  cpSync(packageDir, join(root, "plugins/co-invest-openai"), { recursive: true });
  cpSync(join(repoRoot, "schemas/agent-plugins"), join(root, "schemas/agent-plugins"), { recursive: true });
  return { root, dir: join(root, "plugins/co-invest-openai") };
}

function errorsFor(root) {
  return validateOpenaiPackage(root).errors.join("\n");
}

function rewriteJson(path, mutate) {
  const value = JSON.parse(readFileSync(path, "utf8"));
  mutate(value);
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function runBuilder(root, output) {
  return execFileSync("python3", [builder, "--out", output, "--repo-root", root], { encoding: "utf8" });
}

test("validates the portable OpenAI package", (t) => {
  const { root } = fixture(t);
  assert.deepEqual(validateOpenaiPackage(root), { errors: [], packageCount: 1 });
});

test("rejects valid JSON with invalid manifest or MCP shapes before building", (t) => {
  for (const file of ["plugin.json", "mcp.json"]) {
    for (const value of [null, false, 0, "", [], {}, { mcpServers: [] }, { mcpServers: { "Co-Invest": null } }]) {
      const { root, dir } = fixture(t);
      writeFileSync(join(dir, file), JSON.stringify(value));
      assert.notEqual(errorsFor(root), "", `${file} accepted ${JSON.stringify(value)}`);
    }
  }
  const { root, dir } = fixture(t);
  writeFileSync(join(dir, "mcp.json"), "{}");
  const output = join(root, "invalid.zip");
  assert.throws(() => runBuilder(root, output));
  assert.equal(existsSync(output), false);
});

test("rejects a wrong MCP domain and embedded authorization credentials", (t) => {
  const { root, dir } = fixture(t);
  rewriteJson(join(dir, "mcp.json"), (config) => {
    config.mcpServers["Co-Invest"].url = "https://example.test/mcp";
    config.mcpServers["Co-Invest"].headers = { Authorization: "Bearer sk_live_1234567890abcdef" };
  });
  let errors = errorsFor(root);
  assert.match(errors, /must use streamable-http at https:\/\/coinvest-chat\.liquid\.trade\/mcp/);
  assert.match(errors, /headers are not allowed/);
  assert.match(errors, /possible credential or private key detected/);

  rewriteJson(join(dir, "mcp.json"), (config) => {
    delete config.mcpServers["Co-Invest"].headers;
    config.mcpServers["Co-Invest"].extensions["com.openai"].auth.client_secret = "client-secret-placeholder-value";
  });
  errors = errorsFor(root);
  assert.match(errors, /known OpenAI OAuth DCR auth extension/);
  assert.match(errors, /possible credential or private key detected/);
});

test("does not echo malformed manifest contents into validation errors", (t) => {
  const { root, dir } = fixture(t);
  writeFileSync(join(dir, "plugin.json"), '{"placeholder":"SYNTHETIC_SENTINEL_1234567890"');
  const errors = errorsFor(root);
  assert.match(errors, /cannot read valid JSON/);
  assert.doesNotMatch(errors, /SYNTHETIC_SENTINEL_1234567890/);
});

test("rejects package files outside the reviewed allowlist", (t) => {
  const { root, dir } = fixture(t);
  writeFileSync(join(dir, "reviewer-notes.txt"), "private review notes\n");
  assert.match(errorsFor(root), /file is outside the reviewed OpenAI package scope/);
});

test("rejects symlinked files and directories in the package", (t) => {
  const fileFixture = fixture(t);
  rmSync(join(fileFixture.dir, "README.md"));
  symlinkSync("LICENSE", join(fileFixture.dir, "README.md"));
  assert.match(errorsFor(fileFixture.root), /symlinks are not allowed in the OpenAI package/);

  const directoryFixture = fixture(t);
  rmSync(join(directoryFixture.dir, "assets"), { recursive: true });
  symlinkSync(join(packageDir, "assets"), join(directoryFixture.dir, "assets"), "dir");
  assert.match(errorsFor(directoryFixture.root), /symlinks are not allowed in the OpenAI package/);

  const assetFixture = fixture(t);
  const externalSvg = join(assetFixture.root, "synthetic-logo.svg");
  writeFileSync(externalSvg, '<svg width="800" height="800"></svg>');
  rmSync(join(assetFixture.dir, "assets/logo.svg"));
  symlinkSync(externalSvg, join(assetFixture.dir, "assets/logo.svg"));
  assert.match(errorsFor(assetFixture.root), /symlinks are not allowed in the OpenAI package/);
});

test("requires OpenAI interface metadata and enforces its text limits", (t) => {
  const { root, dir } = fixture(t);
  rewriteJson(join(dir, "plugin.json"), (manifest) => {
    const interfaceValue = manifest.extensions["com.openai"].interface;
    delete interfaceValue.developerName;
    interfaceValue.shortDescription = "x".repeat(31);
    interfaceValue.longDescription = "x".repeat(4001);
    interfaceValue.supportURL = "http://liquid.trade/support";
  });
  const errors = errorsFor(root);
  assert.match(errors, /interface\.developerName must be a non-empty string/);
  assert.match(errors, /interface\.shortDescription must be at most 30 characters/);
  assert.match(errors, /interface\.longDescription must be at most 4000 characters/);
  assert.match(errors, /interface\.supportURL must be a public HTTPS URL/);
});

test("builds deterministic ZIPs with only the six allowlisted package paths", (t) => {
  const { root } = fixture(t);
  const first = join(root, "artifacts/first.zip");
  const second = join(root, "artifacts/second.zip");
  runBuilder(root, first);
  runBuilder(root, second);
  assert.equal(readFileSync(first).equals(readFileSync(second)), true);

  const inspect = "import json, sys, zipfile; z=zipfile.ZipFile(sys.argv[1]); print(json.dumps({'names': sorted(z.namelist()), 'text': '\\n'.join(z.read(n).decode('utf-8', 'ignore') for n in z.namelist() if not n.endswith('.svg'))}))";
  const archive = JSON.parse(execFileSync("python3", ["-c", inspect, first], { encoding: "utf8" }));
  assert.deepEqual(archive.names, allowlist);
  assert.doesNotMatch(archive.text, /Bearer\s+[A-Za-z0-9._~+/-]{16,}|client[_-]?secret\s*[:=]\s*\S+/i);
  assert.equal(lstatSync(first).isFile(), true);
});

test("builder rejects an existing output and output inside the package", (t) => {
  const { root, dir } = fixture(t);
  const existing = join(root, "already.zip");
  writeFileSync(existing, "keep this file");
  assert.throws(() => runBuilder(root, existing), /output already exists/);
  assert.equal(readFileSync(existing, "utf8"), "keep this file");

  const insidePackage = join(dir, "package.zip");
  assert.throws(() => runBuilder(root, insidePackage), /output path must be outside the OpenAI package directory/);
  assert.equal(existsSync(insidePackage), false);

  const outputAlias = join(root, "package-alias");
  symlinkSync(dir, outputAlias, "dir");
  assert.throws(() => runBuilder(root, join(outputAlias, "aliased.zip")), /output path must be outside the OpenAI package directory/);
  assert.equal(existsSync(join(dir, "aliased.zip")), false);
});
