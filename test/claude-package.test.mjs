import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { validateClaudePackage } from "../scripts/claude-package.mjs";
import { buildSkillZips } from "../scripts/package-claude-skills.mjs";
import { SKILL_SYNC_MAP } from "../scripts/sync-skills.mjs";

const repoRoot = resolve(import.meta.dirname, "..");
const SKILLS = SKILL_SYNC_MAP["co-invest-claude"];

// The package's own skills/ copies come from the sync step, so the fixture
// builds them from the root skills the way the sync does.
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "liquid-plugin-claude-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "plugins"), { recursive: true });
  cpSync(join(repoRoot, "plugins/co-invest-claude"), join(root, "plugins/co-invest-claude"), { recursive: true });
  cpSync(join(repoRoot, ".claude-plugin"), join(root, ".claude-plugin"), { recursive: true });
  cpSync(join(repoRoot, "skills"), join(root, "skills"), { recursive: true });
  const dir = join(root, "plugins/co-invest-claude");
  for (const name of SKILLS) cpSync(join(root, "skills", name), join(dir, "skills", name), { recursive: true });
  return { root, dir };
}

function errorsFor(root) {
  return validateClaudePackage(root).errors.join("\n");
}

function rewriteJson(path, mutate) {
  const value = JSON.parse(readFileSync(path, "utf8"));
  mutate(value);
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

test("a complete Claude package validates clean", (t) => {
  const { root } = fixture(t);
  assert.deepEqual(validateClaudePackage(root), { errors: [], packageCount: 1 });
});

test("rejects a wrong endpoint URL", (t) => {
  const { root, dir } = fixture(t);
  rewriteJson(join(dir, ".mcp.json"), (v) => { v.mcpServers["co-invest"].url += "?profile=all"; });
  assert.match(errorsFor(root), /\.mcp\.json: mcpServers must contain only the http endpoint/);
});

test("rejects a second server", (t) => {
  const { root, dir } = fixture(t);
  rewriteJson(join(dir, ".mcp.json"), (v) => { v.mcpServers.other = { type: "http", url: "https://example.com/mcp" }; });
  assert.match(errorsFor(root), /\.mcp\.json: mcpServers must contain only/);
});

test("rejects an extra file", (t) => {
  const { root, dir } = fixture(t);
  writeFileSync(join(dir, "extra.txt"), "x");
  assert.match(errorsFor(root), /extra\.txt: file is outside the reviewed Claude package scope/);
});

test("rejects a missing skill file", (t) => {
  const { root, dir } = fixture(t);
  rmSync(join(dir, "skills", SKILLS[0], "SKILL.md"));
  assert.match(errorsFor(root), new RegExp(`skills/${SKILLS[0]}/SKILL\\.md: required Claude package file is missing`));
});

test("rejects a version mismatch in the manifest and the marketplace", (t) => {
  const { root, dir } = fixture(t);
  rewriteJson(join(dir, ".claude-plugin/plugin.json"), (v) => { v.version = "1.0.9"; });
  rewriteJson(join(root, ".claude-plugin/marketplace.json"), (v) => { v.plugins[0].version = "1.0.9"; });
  const errors = errorsFor(root);
  assert.match(errors, /plugin\.json: version must be "1\.1\.0"/);
  assert.match(errors, /marketplace\.json: version must be "1\.1\.0"/);
});

test("rejects a description mismatch between manifest and marketplace", (t) => {
  const { root } = fixture(t);
  rewriteJson(join(root, ".claude-plugin/marketplace.json"), (v) => { v.plugins[0].description = "different"; });
  assert.match(errorsFor(root), /marketplace\.json: description must equal the plugin manifest description/);
});

test("rejects a marketplace source that does not exist", (t) => {
  const { root } = fixture(t);
  rewriteJson(join(root, ".claude-plugin/marketplace.json"), (v) => { v.plugins[0].source = "./plugins/nope"; });
  assert.match(errorsFor(root), /marketplace\.json: plugin source path does not exist/);
});

test("skill ZIPs are deterministic and rooted at the skill folder", () => {
  const first = buildSkillZips(repoRoot);
  const second = buildSkillZips(repoRoot);
  assert.equal(first.length, SKILLS.length);
  for (let i = 0; i < first.length; i += 1) {
    assert.equal(first[i].name, `${SKILLS[i]}.zip`);
    assert.ok(first[i].data.equals(second[i].data), `${first[i].name} differs between runs`);
  }
});

test("each skill ZIP contains <name>/SKILL.md and extracts intact", (t) => {
  const out = mkdtempSync(join(tmpdir(), "liquid-plugin-claude-zip-"));
  t.after(() => rmSync(out, { recursive: true, force: true }));
  for (const { name, data } of buildSkillZips(repoRoot)) {
    const skill = name.replace(/\.zip$/, "");
    const zip = join(out, name);
    writeFileSync(zip, data);
    const listing = execFileSync("unzip", ["-Z1", zip], { encoding: "utf8" }).split("\n").filter(Boolean);
    assert.ok(listing.includes(`${skill}/SKILL.md`), `${name} has no ${skill}/SKILL.md`);
    assert.ok(listing.every((entry) => entry.startsWith(`${skill}/`)));
    execFileSync("unzip", ["-tq", zip]);
    const extracted = execFileSync("unzip", ["-p", zip, `${skill}/SKILL.md`]);
    assert.ok(extracted.equals(readFileSync(join(repoRoot, "skills", skill, "SKILL.md"))));
  }
  assert.ok(existsSync(out));
});
