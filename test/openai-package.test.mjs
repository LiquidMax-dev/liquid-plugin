import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { validateOpenaiPackage } from "../scripts/openai-package.mjs";
import { SKILL_SYNC_MAP } from "../scripts/sync-skills.mjs";

const repoRoot = resolve(import.meta.dirname, "..");
const packageDir = join(repoRoot, "plugins/co-invest-openai");
const builder = join(repoRoot, "scripts/package-openai.py");
const manifestPath = ".codex-plugin/plugin.json";
const mcpPath = ".mcp.json";
const skillsPath = "skills";
const skillNames = [...SKILL_SYNC_MAP["co-invest-openai"]];
const expectedMcp = { mcpServers: { "co-invest": { url: "https://coinvest-chat.liquid.trade" } } };
const archivePaths = [
  manifestPath,
  mcpPath,
  "assets/logo-dark.png",
  "assets/logo.png",
  ...skillNames.map((name) => `${skillsPath}/${name}/SKILL.md`),
];

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "liquid-plugin-openai-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "plugins"), { recursive: true });
  mkdirSync(join(root, "schemas/openai"), { recursive: true });
  cpSync(packageDir, join(root, "plugins/co-invest-openai"), { recursive: true });
  cpSync(join(repoRoot, "schemas/openai/published-plugin-1.0.0.json"), join(root, "schemas/openai/published-plugin-1.0.0.json"));
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

test("validates published metadata, exact registered MCP URL, and all bundled skills", (t) => {
  const { root, dir } = fixture(t);
  assert.deepEqual(validateOpenaiPackage(root), { errors: [], packageCount: 1 });
  assert.deepEqual(JSON.parse(readFileSync(join(dir, mcpPath), "utf8")), expectedMcp);
  for (const name of skillNames) assert.equal(readFileSync(join(dir, skillsPath, name, "SKILL.md"), "utf8").length > 0, true);
});

test("rejects listing metadata drift, wrong version, or unexpected manifest MCP/skills fields", (t) => {
  const cases = [
    (manifest) => { manifest.name = "app-wrong"; },
    (manifest) => { manifest.interface.shortDescription = "Changed listing copy"; },
    (manifest) => { manifest.interface.displayName = "Other"; },
    (manifest) => { manifest.version = "1.1.1"; },
    (manifest) => { manifest.mcpServers = { url: "https://coinvest-chat.liquid.trade/" }; },
    (manifest) => { manifest.skills = "./other/"; },
  ];
  for (const mutate of cases) {
    const { root, dir } = fixture(t);
    rewriteJson(join(dir, manifestPath), mutate);
    assert.match(errorsFor(root), /manifest must match the published 1\.0\.0 export except for version, mcpServers, skills, description, longDescription and defaultPrompt|mcpServers must be "\.\/.mcp\.json"|skills must be "\.\/skills\/"|version must be "1\.1\.0"/);
  }
});

test("accepts new listing copy within OpenAI's limits and rejects copy outside them", (t) => {
  const accepted = fixture(t);
  rewriteJson(join(accepted.dir, manifestPath), (manifest) => {
    manifest.description = "New copy";
    manifest.interface.longDescription = "New copy";
    manifest.interface.defaultPrompt = ["One", "Two"];
  });
  assert.deepEqual(validateOpenaiPackage(accepted.root).errors, []);

  const cases = [
    [(manifest) => { manifest.description = "Only one field changed"; }, /description and interface\.longDescription must be identical/],
    [(manifest) => { manifest.description = manifest.interface.longDescription = "x".repeat(4001); }, /at most 4000 characters/],
    [(manifest) => { manifest.interface.defaultPrompt = ["1", "2", "3", "4"]; }, /1 to 3 unique prompts/],
    [(manifest) => { manifest.interface.defaultPrompt = []; }, /1 to 3 unique prompts/],
    [(manifest) => { manifest.interface.defaultPrompt = ["Same", "Same"]; }, /1 to 3 unique prompts/],
    [(manifest) => { manifest.interface.defaultPrompt = ["x".repeat(129)]; }, /1 to 3 unique prompts/],
    [(manifest) => { manifest.interface.defaultPrompt = ["@Co-Invest NVDA"]; }, /without @mentions/],
  ];
  for (const [mutate, expected] of cases) {
    const { root, dir } = fixture(t);
    rewriteJson(join(dir, manifestPath), mutate);
    assert.match(errorsFor(root), expected);
  }
});

test("requires the manifest MCP declaration and rejects missing, malformed, or invalid MCP files", (t) => {
  const missingDeclaration = fixture(t);
  rewriteJson(join(missingDeclaration.dir, manifestPath), (manifest) => { delete manifest.mcpServers; });
  assert.match(errorsFor(missingDeclaration.root), /mcpServers must be "\.\/.mcp\.json"/);

  const missingFile = fixture(t);
  rmSync(join(missingFile.dir, mcpPath));
  assert.match(errorsFor(missingFile.root), /\.mcp\.json: cannot read valid JSON/);

  const malformed = fixture(t);
  writeFileSync(join(malformed.dir, mcpPath), '{"secret":"SYNTHETIC_MCP_SENTINEL_1234567890"');
  const malformedErrors = errorsFor(malformed.root);
  assert.match(malformedErrors, /\.mcp\.json: cannot read valid JSON/);
  assert.doesNotMatch(malformedErrors, /SYNTHETIC_MCP_SENTINEL_1234567890/);

  for (const value of [null, false, 0, "", [], {}, { mcpServers: [] }, { mcpServers: { "co-invest": null } }]) {
    const { root, dir } = fixture(t);
    writeFileSync(join(dir, mcpPath), JSON.stringify(value));
    assert.match(errorsFor(root), /MCP configuration must contain only co-invest/);
  }
  const { root, dir } = fixture(t);
  writeFileSync(join(dir, mcpPath), "{}");
  assert.throws(() => runBuilder(root, join(root, "invalid-mcp.zip")));
  assert.equal(existsSync(join(root, "invalid-mcp.zip")), false);
});

test("rejects MCP URL changes, auth headers, and extra server declarations", (t) => {
  const cases = [
    (mcp) => { mcp.mcpServers["co-invest"].url = "https://coinvest-chat.liquid.trade/"; },
    (mcp) => { mcp.mcpServers["co-invest"].url = "https://coinvest-chat.liquid.trade/mcp"; },
    (mcp) => { mcp.mcpServers["co-invest"].headers = { Authorization: "Bearer synthetic-token-value-1234567890" }; },
    (mcp) => { mcp.mcpServers.other = { url: "https://example.invalid/" }; },
  ];
  for (const mutate of cases) {
    const { root, dir } = fixture(t);
    rewriteJson(join(dir, mcpPath), mutate);
    assert.match(errorsFor(root), /MCP configuration must contain only co-invest/);
  }
});

test("requires the exact skills declaration and rejects an invalid declaration path", (t) => {
  const missing = fixture(t);
  rewriteJson(join(missing.dir, manifestPath), (manifest) => { delete manifest.skills; });
  assert.match(errorsFor(missing.root), /skills must be "\.\/skills\/"/);

  const wrong = fixture(t);
  rewriteJson(join(wrong.dir, manifestPath), (manifest) => { manifest.skills = "./skills"; });
  assert.match(errorsFor(wrong.root), /skills must be "\.\/skills\/"/);
});

test("rejects invalid skill frontmatter, mismatched names, and empty bodies", (t) => {
  const malformedFrontmatter = fixture(t);
  const malformedPath = join(malformedFrontmatter.dir, skillsPath, skillNames[0], "SKILL.md");
  writeFileSync(malformedPath, "---\nname: [\ndescription: Co-Invest market research\n---\nBody.\n");
  assert.match(errorsFor(malformedFrontmatter.root), /frontmatter/);

  const wrongName = fixture(t);
  const wrongNamePath = join(wrongName.dir, skillsPath, skillNames[0], "SKILL.md");
  writeFileSync(wrongNamePath, "---\nname: wrong-skill\ndescription: Co-Invest market research\n---\nResearch body.\n");
  assert.match(errorsFor(wrongName.root), /skill frontmatter name must match its directory/);

  const emptyBody = fixture(t);
  const emptyBodyPath = join(emptyBody.dir, skillsPath, skillNames[0], "SKILL.md");
  writeFileSync(emptyBodyPath, `---\nname: ${skillNames[0]}\ndescription: Co-Invest market research\n---\n`);
  assert.match(errorsFor(emptyBody.root), /skill body must be non-empty/);
});

test("rejects unexpected skill resources and symlinked skill files", (t) => {
  const extraResource = fixture(t);
  const extraPath = join(extraResource.dir, skillsPath, skillNames[0], "reference.md");
  writeFileSync(extraPath, "Unexpected skill resource.\n");
  assert.match(errorsFor(extraResource.root), /file is outside the reviewed OpenAI package scope/);

  const symlinkedSkill = fixture(t);
  const target = join(symlinkedSkill.dir, skillsPath, skillNames[0], "SKILL.md");
  const replacement = join(symlinkedSkill.root, "skill-target.md");
  writeFileSync(replacement, readFileSync(target));
  rmSync(target);
  symlinkSync(replacement, target);
  assert.match(errorsFor(symlinkedSkill.root), /symlinks are not allowed in the OpenAI package/);
});

test("rejects valid JSON manifest values with an invalid shape", (t) => {
  for (const value of [null, false, 0, "", [], {}, { version: "1.1.0" }]) {
    const { root, dir } = fixture(t);
    writeFileSync(join(dir, manifestPath), JSON.stringify(value));
    assert.notEqual(errorsFor(root), "", `accepted ${JSON.stringify(value)}`);
  }
  const { root, dir } = fixture(t);
  writeFileSync(join(dir, manifestPath), "{}");
  assert.throws(() => runBuilder(root, join(root, "invalid.zip")));
  assert.equal(existsSync(join(root, "invalid.zip")), false);
});

test("rejects a malformed MCP declaration before creating an archive", (t) => {
  const { root, dir } = fixture(t);
  writeFileSync(join(dir, mcpPath), "{");
  const output = join(root, "invalid-mcp-json.zip");
  assert.throws(() => runBuilder(root, output));
  assert.equal(existsSync(output), false);
});

test("does not echo malformed manifest contents into validation errors", (t) => {
  const { root, dir } = fixture(t);
  writeFileSync(join(dir, manifestPath), '{"placeholder":"SYNTHETIC_SENTINEL_1234567890"');
  const errors = errorsFor(root);
  assert.match(errors, /cannot read valid JSON/);
  assert.doesNotMatch(errors, /SYNTHETIC_SENTINEL_1234567890/);
});

test("rejects a one-byte change to either published logo", (t) => {
  for (const name of ["assets/logo.png", "assets/logo-dark.png"]) {
    const { root, dir } = fixture(t);
    const path = join(dir, name);
    const bytes = readFileSync(path);
    bytes[bytes.length - 1] ^= 1;
    writeFileSync(path, bytes);
    assert.match(errorsFor(root), /logo bytes do not match the published asset/);
  }
});

test("rejects confidential README content, unexpected files, and package-root assets", (t) => {
  const readmeFixture = fixture(t);
  writeFileSync(join(readmeFixture.dir, "README.md"), "Authorization: Bearer synthetic_token_value_1234567890\n");
  assert.match(errorsFor(readmeFixture.root), /possible credential or private key detected/);

  const extraFixture = fixture(t);
  writeFileSync(join(extraFixture.dir, "reviewer-notes.txt"), "private review notes\n");
  assert.match(errorsFor(extraFixture.root), /file is outside the reviewed OpenAI package scope/);

  const rootAssetFixture = fixture(t);
  writeFileSync(join(rootAssetFixture.dir, "logo.png"), "not a package asset\n");
  assert.match(errorsFor(rootAssetFixture.root), /file is outside the reviewed OpenAI package scope/);
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
});

test("builds deterministic ZIPs of the manifest, MCP map, logos and shared skills with the source listing copy and the published identity, MCP, skills, and logos", (t) => {
  const { root, dir } = fixture(t);
  const first = join(root, "artifacts/first.zip");
  const second = join(root, "artifacts/second.zip");
  runBuilder(root, first);
  runBuilder(root, second);
  assert.equal(readFileSync(first).equals(readFileSync(second)), true);

  const inspect = "import json, sys, zipfile; z=zipfile.ZipFile(sys.argv[1]); print(json.dumps({'names': sorted(z.namelist()), 'manifest': json.loads(z.read('.codex-plugin/plugin.json')), 'mcp': json.loads(z.read('.mcp.json'))}))";
  const archive = JSON.parse(execFileSync("python3", ["-c", inspect, first], { encoding: "utf8" }));
  assert.deepEqual(archive.names, [...archivePaths].sort());
  const baseline = JSON.parse(readFileSync(join(root, "schemas/openai/published-plugin-1.0.0.json"), "utf8"));
  assert.equal(archive.manifest.version, "1.1.0");
  assert.equal(archive.manifest.mcpServers, "./.mcp.json");
  assert.equal(archive.manifest.skills, "./skills/");
  delete archive.manifest.version;
  delete archive.manifest.mcpServers;
  delete archive.manifest.skills;
  delete baseline.version;
  const source = JSON.parse(readFileSync(join(dir, manifestPath), "utf8"));
  assert.equal(archive.manifest.description, source.description);
  assert.equal(archive.manifest.interface.longDescription, source.description);
  assert.deepEqual(archive.manifest.interface.defaultPrompt, source.interface.defaultPrompt);
  for (const manifest of [archive.manifest, baseline]) {
    delete manifest.description;
    delete manifest.interface.longDescription;
    delete manifest.interface.defaultPrompt;
  }
  assert.deepEqual(archive.manifest, baseline);
  assert.deepEqual(archive.mcp, expectedMcp);
  for (const name of skillNames) {
    const path = `${skillsPath}/${name}/SKILL.md`;
    assert.deepEqual(execFileSync("python3", ["-c", "import sys,zipfile;sys.stdout.buffer.write(zipfile.ZipFile(sys.argv[1]).read(sys.argv[2]))", first, path]), readFileSync(join(dir, path)));
  }
  for (const name of ["assets/logo.png", "assets/logo-dark.png"]) {
    assert.deepEqual(execFileSync("python3", ["-c", "import sys,zipfile;sys.stdout.buffer.write(zipfile.ZipFile(sys.argv[1]).read(sys.argv[2]))", first, name]), readFileSync(join(dir, name)));
  }
  assert.equal(lstatSync(first).isFile(), true);
  assert.equal(existsSync(join(root, "plugins/co-invest-openai/README.md")), true);
  assert.deepEqual(archivePaths, [manifestPath, mcpPath, "assets/logo-dark.png", "assets/logo.png", ...skillNames.map((name) => `${skillsPath}/${name}/SKILL.md`)]);
});

test("builder rejects existing output and output paths inside or aliased into the package", (t) => {
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
